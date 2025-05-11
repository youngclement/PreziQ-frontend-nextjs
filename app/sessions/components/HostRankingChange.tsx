'use client';

import { useState, useEffect, useRef } from 'react';
import {
  SessionWebSocket,
  RankedParticipant,
  RankingChangeData,
} from '@/websocket/sessionWebSocket';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  X,
  ArrowUp,
  ArrowDown,
  Minus,
  User,
  Award,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface HostRankingChangeProps {
  sessionWebSocket: SessionWebSocket;
  currentActivityId: string;
  onClose: () => void;
  isFullscreenMode?: boolean;
}

export default function HostRankingChange({
  sessionWebSocket,
  currentActivityId,
  onClose,
  isFullscreenMode = false,
}: HostRankingChangeProps) {
  const [rankingData, setRankingData] = useState<RankingChangeData | null>(
    null
  );
  const [animationComplete, setAnimationComplete] = useState(false);
  const [positionMap, setPositionMap] = useState<{
    current: Record<string, number>;
    previous: Record<string, number> | null;
  } | null>(null);
  const [debugMode, setDebugMode] = useState(false);

  // Ref để theo dõi các phần tử cho animation
  const participantRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const animationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load ranking data when component mounts
  useEffect(() => {
    if (!sessionWebSocket || !currentActivityId) return;

    // Sử dụng phương thức publishRankingData để lấy dữ liệu trực tiếp
    try {
      const directData = sessionWebSocket.publishRankingData(currentActivityId);
      setRankingData(directData);
      console.log('[HostRankingChange] Đã nhận dữ liệu trực tiếp:', directData);
    } catch (error) {
      console.error(
        '[HostRankingChange] Lỗi khi lấy dữ liệu trực tiếp:',
        error
      );

      // Dự phòng: thử lấy dữ liệu đã có
      const fallbackData = sessionWebSocket.getLatestRankingChangeData();
      if (fallbackData) {
        setRankingData(fallbackData);
        console.log(
          '[HostRankingChange] Sử dụng dữ liệu dự phòng:',
          fallbackData
        );
      }
    }

    // Đăng ký theo dõi thay đổi xếp hạng
    const unsubscribe = sessionWebSocket.subscribeToRankingChanges((data) => {
      setRankingData(data);
      console.log('[HostRankingChange] Nhận cập nhật xếp hạng:', data);
    });

    // Lấy dữ liệu vị trí để thực hiện animation - sử dụng activityId
    const positionData =
      sessionWebSocket.getRankingPositionData(currentActivityId);
    setPositionMap(positionData);
    console.log(
      '[HostRankingChange] Dữ liệu vị trí cho hoạt ảnh:',
      positionData
    );

    // Trigger animation sau khi component mount
    setAnimationComplete(false);

    // Tự động đánh dấu animation hoàn thành sau thời gian
    animationTimeoutRef.current = setTimeout(() => {
      setAnimationComplete(true);
    }, 2000);

    return () => {
      unsubscribe();
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }
    };
  }, [sessionWebSocket, currentActivityId]);

  // Hàm đăng ký ref cho từng phần tử
  const setParticipantRef = (name: string, ref: HTMLDivElement | null) => {
    participantRefs.current[name] = ref;
  };

  // Hàm tạo animation cho phần tử dựa trên vị trí trước và sau
  const getAnimationProps = (participantName: string) => {
    if (!positionMap || !positionMap.previous || animationComplete) {
      return {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.5, type: 'spring', stiffness: 100 },
      };
    }

    const currentPos = positionMap.current[participantName];
    const previousPos = positionMap.previous[participantName];

    // Debug animation
    if (debugMode) {
      console.log(`[Animation Debug] ${participantName}:`, {
        previousPos,
        currentPos,
        diff: previousPos !== undefined ? previousPos - currentPos : 'new',
      });
    }

    // Nếu là người dùng mới hoặc không có vị trí trước đó
    if (previousPos === undefined) {
      return {
        initial: { opacity: 0, x: 100 },
        animate: { opacity: 1, x: 0 },
        transition: {
          duration: 0.7,
          type: 'spring',
          stiffness: 80,
          damping: 10,
          delay: 0.8,
        },
      };
    }

    // Tính toán khoảng cách di chuyển
    const distance = (previousPos - currentPos) * 70; // Ước tính khoảng cách di chuyển dựa trên chiều cao phần tử

    // Nếu không có thay đổi vị trí
    if (distance === 0) {
      return {
        initial: { scale: 1 },
        animate: { scale: [1, 1.05, 1] },
        transition: {
          duration: 0.5,
          times: [0, 0.6, 1],
          delay: 0.3 + currentPos * 0.05,
        },
      };
    }

    return {
      initial: { y: distance, opacity: 0.7 },
      animate: { y: 0, opacity: 1 },
      transition: {
        type: 'spring',
        stiffness: 120,
        damping: 15,
        mass: 0.8,
        delay: 0.3 + currentPos * 0.07, // Delay tăng dần theo vị trí hiện tại
      },
    };
  };

  // Thêm một phương thức để tải lại dữ liệu nếu cần
  const handleRefreshData = () => {
    if (sessionWebSocket && currentActivityId) {
      try {
        // Đánh dấu animation chưa hoàn thành để chạy lại
        setAnimationComplete(false);

        const refreshedData =
          sessionWebSocket.publishRankingData(currentActivityId);
        setRankingData(refreshedData);

        // Lấy lại dữ liệu vị trí cho animation
        const positionData =
          sessionWebSocket.getRankingPositionData(currentActivityId);
        setPositionMap(positionData);

        console.log('[HostRankingChange] Đã tải lại dữ liệu:', refreshedData);
        console.log('[HostRankingChange] Dữ liệu vị trí mới:', positionData);

        // Đặt lại hẹn giờ để đánh dấu hoàn thành animation
        if (animationTimeoutRef.current) {
          clearTimeout(animationTimeoutRef.current);
        }
        animationTimeoutRef.current = setTimeout(() => {
          setAnimationComplete(true);
        }, 2000);
      } catch (error) {
        console.error('[HostRankingChange] Lỗi khi tải lại dữ liệu:', error);
      }
    }
  };

  // Toggle debug mode
  const toggleDebugMode = () => {
    setDebugMode(!debugMode);
    console.log(
      `[HostRankingChange] ${!debugMode ? 'Bật' : 'Tắt'} chế độ debug`
    );
  };

  if (!rankingData) {
    // Cải thiện màn hình loading, thêm nút tải lại
    return (
      <div
        className={`fixed inset-0 bg-[#0a1b25]/90 backdrop-blur-md ${
          isFullscreenMode ? 'z-50' : 'z-[9999]'
        } flex flex-col items-center justify-center`}
      >
        <div className='animate-pulse text-white/70 flex flex-col items-center'>
          <Award className='h-16 w-16 mb-4 text-[#aef359]/50' />
          <p className='text-lg mb-6'>Đang tải bảng xếp hạng...</p>
          <Button
            onClick={handleRefreshData}
            className='bg-[#0e2838] hover:bg-[#0e2838]/80 text-white border border-white/10 mt-4'
          >
            Tải lại dữ liệu
          </Button>
          <Button
            onClick={onClose}
            variant='ghost'
            className='mt-4 text-white/70 hover:text-white hover:bg-white/10'
          >
            Quay lại
          </Button>
        </div>
      </div>
    );
  }

  // Sort participants by ranking
  const sortedParticipants = [...rankingData.participants].sort(
    (a, b) => a.realtimeRanking - b.realtimeRanking
  );

  // Determine if we have previous data to show changes
  const hasPreviousData = Object.values(rankingData.changes).some(
    (change) => change.previous !== null
  );

  return (
    <div
      className={`fixed inset-0 bg-[#0a1b25]/90 backdrop-blur-md ${
        isFullscreenMode ? 'z-50' : 'z-[9999]'
      } flex flex-col`}
    >
      <div className='container mx-auto max-w-4xl flex-grow flex flex-col p-4'>
        <div className='flex items-center justify-between mb-6'>
          <h2 className='text-xl md:text-2xl font-bold bg-gradient-to-r from-[#aef359] to-[#e4f88d] text-transparent bg-clip-text'>
            Bảng xếp hạng {hasPreviousData ? 'sau hoạt động' : 'hiện tại'}
          </h2>
          <div className='flex items-center gap-2'>
            {/* Debug Button - Chỉ hiển thị trong môi trường phát triển */}
            <Button
              onClick={toggleDebugMode}
              size='sm'
              variant='ghost'
              className='text-xs rounded-full p-2 hover:bg-white/10'
            >
              <span
                className={`px-1 py-0.5 rounded ${
                  debugMode
                    ? 'bg-green-500/20 text-green-300'
                    : 'bg-gray-500/20 text-gray-300'
                }`}
              >
                Debug
              </span>
            </Button>
            <Button
              onClick={handleRefreshData}
              size='sm'
              variant='ghost'
              className='text-xs rounded-full p-2 hover:bg-white/10'
            >
              <span className='px-1 py-0.5 rounded bg-blue-500/20 text-blue-300'>
                Tải lại
              </span>
            </Button>
            <Button
              onClick={onClose}
              variant='ghost'
              className='rounded-full p-2 hover:bg-white/10'
            >
              <X className='h-6 w-6 text-white/70' />
            </Button>
          </div>
        </div>

        <div className='bg-[#0e1c26]/80 backdrop-blur-md rounded-xl border border-white/10 shadow-xl flex-grow overflow-hidden'>
          <div className='p-4 bg-[#0e2838]/50 border-b border-white/10 flex items-center'>
            <div className='w-12 text-center text-sm text-white/50 font-medium'>
              #
            </div>
            <div className='flex-grow text-sm text-white/50 font-medium'>
              Người tham gia
            </div>
            <div className='w-20 text-center text-sm text-white/50 font-medium'>
              Điểm
            </div>
            {hasPreviousData && (
              <div className='w-24 text-center text-sm text-white/50 font-medium'>
                Thay đổi
              </div>
            )}
          </div>

          <div className='overflow-y-auto custom-scrollbar h-[calc(100%-3.5rem)] p-2'>
            <AnimatePresence initial={false}>
              {sortedParticipants.map((participant, index) => {
                const change = rankingData.changes[participant.displayName];
                if (!change) return null;

                // Tạo animation props dựa trên thay đổi vị trí
                const animProps = getAnimationProps(participant.displayName);

                return (
                  <motion.div
                    key={participant.displayName}
                    className={`flex items-center p-3 mb-2 rounded-lg ${
                      index < 3
                        ? 'bg-gradient-to-r from-[#0e2838]/90 to-[#102942]/90 border border-[#aef359]/20'
                        : 'bg-[#0e2838]/50 border border-white/5'
                    }`}
                    ref={(ref) =>
                      setParticipantRef(
                        participant.displayName,
                        ref as HTMLDivElement | null
                      )
                    }
                    {...animProps}
                  >
                    {/* Thứ hạng */}
                    <div className='w-12 flex justify-center'>
                      {index < 3 ? (
                        <div
                          className={`
                          w-8 h-8 rounded-full flex items-center justify-center 
                          ${
                            index === 0
                              ? 'bg-yellow-500/30 text-yellow-200'
                              : index === 1
                              ? 'bg-gray-400/30 text-gray-200'
                              : 'bg-amber-600/30 text-amber-200'
                          }
                          font-bold text-sm border
                          ${
                            index === 0
                              ? 'border-yellow-500/30'
                              : index === 1
                              ? 'border-gray-400/30'
                              : 'border-amber-600/30'
                          }
                        `}
                        >
                          {index + 1}
                        </div>
                      ) : (
                        <span className='text-white/70 font-medium'>
                          {index + 1}
                        </span>
                      )}
                    </div>

                    {/* Thông tin người chơi */}
                    <div className='flex-grow flex items-center'>
                      <Avatar className='h-8 w-8 mr-3 border border-white/10'>
                        <AvatarImage
                          src={participant.displayAvatar}
                          alt={participant.displayName}
                        />
                        <AvatarFallback className='bg-[#0e2838]/80'>
                          {participant.displayName.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span
                        className={`font-medium ${
                          index < 3 ? 'text-white' : 'text-white/80'
                        }`}
                      >
                        {participant.displayName}
                      </span>
                    </div>

                    {/* Điểm số */}
                    <div className='w-20 text-center'>
                      <motion.span
                        className={`font-bold text-[#aef359] ${
                          index < 3 ? 'text-lg' : 'text-base'
                        }`}
                        initial={{ opacity: 0.8 }}
                        animate={{
                          opacity: [0.8, 1, 1],
                          scale: [1, 1.1, 1],
                        }}
                        transition={{
                          duration: 0.6,
                          times: [0, 0.4, 1],
                          delay: 0.8 + index * 0.05,
                        }}
                      >
                        {participant.realtimeScore}
                      </motion.span>
                    </div>

                    {/* Thay đổi thứ hạng */}
                    {hasPreviousData && (
                      <div className='w-24 text-center flex items-center justify-center'>
                        {change.direction === 'new' ? (
                          <motion.span
                            className='text-purple-400 text-sm bg-purple-500/20 px-2 py-0.5 rounded-full'
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{
                              type: 'spring',
                              stiffness: 300,
                              delay: 0.6 + index * 0.04,
                            }}
                          >
                            Mới
                          </motion.span>
                        ) : change.direction === 'up' ? (
                          <motion.div
                            className='flex items-center text-green-400'
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{
                              scale: 1,
                              opacity: 1,
                              y: [0, -5, 0],
                            }}
                            transition={{
                              type: 'spring',
                              stiffness: 300,
                              delay: 0.6 + index * 0.04,
                              y: {
                                times: [0, 0.5, 1],
                                duration: 0.6,
                                repeat: 1,
                                repeatDelay: 0.2,
                              },
                            }}
                          >
                            <ChevronUp className='h-5 w-5 mr-1' />
                            <span className='font-medium'>{change.change}</span>
                          </motion.div>
                        ) : change.direction === 'down' ? (
                          <motion.div
                            className='flex items-center text-red-400'
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{
                              scale: 1,
                              opacity: 1,
                              y: [0, 5, 0],
                            }}
                            transition={{
                              type: 'spring',
                              stiffness: 300,
                              delay: 0.6 + index * 0.04,
                              y: {
                                times: [0, 0.5, 1],
                                duration: 0.6,
                                repeat: 1,
                                repeatDelay: 0.2,
                              },
                            }}
                          >
                            <ChevronDown className='h-5 w-5 mr-1' />
                            <span className='font-medium'>{change.change}</span>
                          </motion.div>
                        ) : (
                          <motion.div
                            className='flex items-center text-gray-400'
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{
                              type: 'spring',
                              stiffness: 300,
                              delay: 0.5 + index * 0.03,
                            }}
                          >
                            <Minus className='h-4 w-4 mr-1' />
                            <span className='font-medium'>0</span>
                          </motion.div>
                        )}
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>

        {/* Debug info */}
        {debugMode && positionMap && (
          <div className='mt-2 p-3 bg-[#0e1c26]/80 backdrop-blur-md rounded-xl border border-white/10 text-xs text-white/70 overflow-auto max-h-40'>
            <p className='font-mono mb-1'>Position Map:</p>
            <pre className='overflow-auto'>
              {JSON.stringify(positionMap, null, 2)}
            </pre>
          </div>
        )}
      </div>

      {/* Nút đóng ở dưới - hiển thị với kiểu dáng khác nếu ở chế độ toàn màn hình */}
      <div className='p-4 flex justify-center'>
        <Button
          onClick={onClose}
          className={`${
            isFullscreenMode
              ? 'bg-gradient-to-r from-[#aef359] to-[#e4f88d] hover:from-[#9ee348] hover:to-[#d3e87c] text-slate-900 font-medium border border-[#aef359]/10'
              : 'bg-[#0e2838] hover:bg-[#0e2838]/80 text-white border border-white/10'
          }`}
        >
          {isFullscreenMode ? 'Tiếp tục' : 'Quay lại'}
        </Button>
      </div>

      {/* Add custom scrollbar style */}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(14, 28, 38, 0.3);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(174, 243, 89, 0.2);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(174, 243, 89, 0.4);
        }
      `}</style>
    </div>
  );
}
