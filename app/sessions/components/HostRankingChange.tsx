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
  const [disableAnimation, setDisableAnimation] = useState(false);

  // Ref để theo dõi các phần tử cho animation
  const participantRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const animationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load ranking data when component mounts
  useEffect(() => {
    if (!sessionWebSocket || !currentActivityId) return;

    // Sử dụng phương thức publishRankingData để lấy dữ liệu trực tiếp
    try {
      // Khởi tạo dữ liệu vị trí từ sessionWebSocket
      const positionData =
        sessionWebSocket.getRankingPositionData(currentActivityId);

      // Với logic mới, dữ liệu previous có thể là null (quiz đầu tiên) hoặc có giá trị (quiz tiếp theo)
      // Chúng ta không cần gán thủ công current làm previous nữa
      setPositionMap(positionData);

      // Thêm log để debug vấn đề với positionMap
      console.log('[DEBUG] Khởi tạo positionMap trong useEffect:', {
        positionData,
        currentActivityId,
        hasValidCurrent:
          positionData && Object.keys(positionData.current || {}).length > 0,
        hasPrevious: positionData && positionData.previous !== null,
      });

      const directData = sessionWebSocket.publishRankingData(currentActivityId);
      setRankingData(directData);
      console.log('[HostRankingChange] Đã nhận dữ liệu trực tiếp:', directData);

      if (debugMode) {
        console.log('[HostRankingChange] Position data:', positionData);
      }
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

    // Trigger animation sau khi component mount
    setAnimationComplete(false);

    // Tự động đánh dấu animation hoàn thành sau thời gian
    animationTimeoutRef.current = setTimeout(() => {
      setAnimationComplete(true);
    }, 4500); // Tăng thời gian để animation chạy chậm hơn

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
    // Nếu đã tắt animation, trả về không có animation
    if (disableAnimation) {
      return {
        initial: { opacity: 1 },
        animate: { opacity: 1 },
        transition: { duration: 0 },
      };
    }

    // Nếu animation đã hoàn thành hoặc không có dữ liệu position
    if (!positionMap || animationComplete) {
      return {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.7, type: 'spring', stiffness: 80 },
      };
    }

    // Nếu không có dữ liệu previous (đây là quiz đầu tiên)
    if (!positionMap.previous) {
      return {
        initial: { opacity: 0, scale: 0.9 },
        animate: { opacity: 1, scale: 1 },
        transition: {
          duration: 0.8,
          type: 'spring',
          stiffness: 100,
          delay: 0.2,
        },
      };
    }

    // Lấy vị trí hiện tại (current) và vị trí trước đó (previous) của người chơi
    const currentPos = positionMap.current[participantName];
    const previousPos = positionMap.previous[participantName];

    // Debug animation
    if (debugMode) {
      console.log(`[Animation Debug] ${participantName}:`, {
        previousPos,
        currentPos,
        diff: previousPos !== undefined ? previousPos - currentPos : 'new',
        positionMapDetails: positionMap,
      });
    }

    // Nếu là người dùng mới hoặc không có vị trí trước đó
    if (previousPos === undefined) {
      return {
        initial: { opacity: 0, x: 100 },
        animate: { opacity: 1, x: 0 },
        transition: {
          duration: 1,
          type: 'spring',
          stiffness: 70,
          damping: 12,
          delay: 1,
        },
      };
    }

    // Tính toán khoảng cách di chuyển dựa trên sự thay đổi vị trí
    // Quan trọng: current/previous đại diện cho 0-based index trong mảng
    // previousPos < currentPos: người chơi đã xuống hạng (vị trí index tăng)
    // previousPos > currentPos: người chơi đã lên hạng (vị trí index giảm)
    const positionChange = previousPos - currentPos;

    // Ước tính khoảng cách di chuyển dựa trên chiều cao mỗi phần tử + padding
    const ITEM_HEIGHT = 74; // Điều chỉnh chiều cao của mỗi phần tử trong bảng
    // Tính khoảng cách dựa trên số vị trí thay đổi nhân với chiều cao
    const distance = positionChange * ITEM_HEIGHT;

    // Nếu vị trí không thay đổi
    if (positionChange === 0) {
      return {
        initial: { scale: 1 },
        animate: { scale: [1, 1.05, 1] },
        transition: {
          duration: 0.8,
          times: [0, 0.6, 1],
          delay: 0.3 + currentPos * 0.06,
        },
      };
    }

    // Nếu người dùng lên hạng (di chuyển lên, có nghĩa là giảm index)
    if (positionChange > 0) {
      return {
        initial: {
          y: distance, // Bắt đầu từ vị trí cũ (ở dưới)
          opacity: 0.8,
          backgroundColor: 'rgba(34, 197, 94, 0.2)',
          borderColor: 'rgba(34, 197, 94, 0.5)',
        },
        animate: {
          y: 0, // Di chuyển lên vị trí mới (ở trên)
          opacity: 1,
          backgroundColor: ['rgba(34, 197, 94, 0.2)', 'transparent'],
          borderColor: ['rgba(34, 197, 94, 0.5)', 'rgba(255, 255, 255, 0.05)'],
        },
        transition: {
          type: 'spring',
          stiffness: 80,
          damping: 18,
          mass: 1.2,
          delay: 0.3 + currentPos * 0.06,
          backgroundColor: { duration: 3 },
          borderColor: { duration: 3 },
        },
      };
    }

    // Nếu người dùng xuống hạng (di chuyển xuống, có nghĩa là tăng index)
    if (positionChange < 0) {
      return {
        initial: {
          y: distance, // Bắt đầu từ vị trí cũ (ở trên)
          opacity: 0.8,
          backgroundColor: 'rgba(239, 68, 68, 0.2)',
          borderColor: 'rgba(239, 68, 68, 0.5)',
        },
        animate: {
          y: 0, // Di chuyển xuống vị trí mới (ở dưới)
          opacity: 1,
          backgroundColor: ['rgba(239, 68, 68, 0.2)', 'transparent'],
          borderColor: ['rgba(239, 68, 68, 0.5)', 'rgba(255, 255, 255, 0.05)'],
        },
        transition: {
          type: 'spring',
          stiffness: 80,
          damping: 18,
          mass: 1.2,
          delay: 0.3 + currentPos * 0.06,
          backgroundColor: { duration: 3 },
          borderColor: { duration: 3 },
        },
      };
    }

    // Fallback nếu không có trường hợp nào khớp
    return {
      initial: { opacity: 0.5 },
      animate: { opacity: 1 },
      transition: { duration: 0.8 },
    };
  };

  // Thêm một phương thức để tải lại dữ liệu nếu cần
  const handleRefreshData = () => {
    if (sessionWebSocket && currentActivityId) {
      try {
        console.log('[HostRankingChange] Bắt đầu tải lại dữ liệu...');
        // Đánh dấu animation chưa hoàn thành để chạy lại
        setAnimationComplete(false);

        // Tải lại dữ liệu vị trí
        const positionData =
          sessionWebSocket.getRankingPositionData(currentActivityId);

        console.log('[HostRankingChange] Dữ liệu vị trí mới (trước khi set):', {
          positionData,
          currentPositionCount: Object.keys(positionData.current || {}).length,
          hasPrevious: positionData.previous !== null,
        });

        setPositionMap(positionData);

        if (debugMode) {
          console.log('[HostRankingChange] Dữ liệu vị trí mới:', positionData);
        }

        // Tải lại dữ liệu xếp hạng - đảm bảo gọi finishActivity
        const refreshedData =
          sessionWebSocket.publishRankingData(currentActivityId);
        setRankingData(refreshedData);

        console.log('[HostRankingChange] Dữ liệu refreshed:', {
          refreshedData,
          hasChanges: Object.keys(refreshedData.changes || {}).length,
          positionMapAfterRefresh:
            sessionWebSocket.getRankingPositionData(currentActivityId),
        });

        // Đặt lại hẹn giờ để đánh dấu hoàn thành animation
        if (animationTimeoutRef.current) {
          clearTimeout(animationTimeoutRef.current);
        }
        animationTimeoutRef.current = setTimeout(() => {
          setAnimationComplete(true);
          console.log('[HostRankingChange] Animation đã hoàn thành');
        }, 4500); // Tăng thời gian để animation chạy chậm hơn
      } catch (error) {
        console.error('[HostRankingChange] Lỗi khi tải lại dữ liệu:', error);
      }
    }
  };

  // Thêm phương thức để reset thủ công dữ liệu vị trí
  const handleResetPositions = () => {
    if (!rankingData) return;

    const currentPositions: Record<string, number> = {};
    rankingData.participants
      .sort((a, b) => a.realtimeRanking - b.realtimeRanking)
      .forEach((p, index) => {
        currentPositions[p.displayName] = index;
      });

    // Tạo position map mới, trong đó previous = current
    const newPositionMap = {
      current: { ...currentPositions },
      previous: { ...currentPositions },
    };

    setPositionMap(newPositionMap);
    setAnimationComplete(false);

    if (debugMode) {
      console.log(
        '[HostRankingChange] Đã reset dữ liệu vị trí, previous = current:',
        newPositionMap
      );
    }

    // Đặt lại hẹn giờ
    if (animationTimeoutRef.current) {
      clearTimeout(animationTimeoutRef.current);
    }
    animationTimeoutRef.current = setTimeout(() => {
      setAnimationComplete(true);
    }, 4500); // Tăng thời gian để animation chạy chậm hơn
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
            <AnimatePresence initial={true}>
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
                    layout
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
                      <div className='flex items-center'>
                        <span
                          className={`font-medium ${
                            index < 3 ? 'text-white' : 'text-white/80'
                          }`}
                        >
                          {participant.displayName}
                        </span>

                        {/* Biểu tượng thay đổi thứ hạng bên cạnh tên */}
                        {hasPreviousData &&
                          change.direction !== 'new' &&
                          change.direction !== 'same' && (
                            <div
                              className={`ml-2 flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium
                              ${
                                change.direction === 'up'
                                  ? 'bg-green-500/20 text-green-300'
                                  : 'bg-red-500/20 text-red-300'
                              }`}
                            >
                              {change.direction === 'up' ? (
                                <>
                                  <ChevronUp className='h-3 w-3' />
                                  <span className='ml-0.5'>
                                    {change.change}
                                  </span>
                                </>
                              ) : (
                                <>
                                  <ChevronDown className='h-3 w-3' />
                                  <span className='ml-0.5'>
                                    {change.change}
                                  </span>
                                </>
                              )}
                            </div>
                          )}
                      </div>
                    </div>

                    {/* Điểm số */}
                    <div className='w-20 text-center'>
                      <motion.div
                        className={`font-bold ${
                          index < 3 ? 'text-lg' : 'text-base'
                        } bg-[#aef359]/20 rounded-full px-2 py-1 inline-block`}
                        initial={{ opacity: 0.8 }}
                        animate={{
                          opacity: [0.8, 1, 1],
                          scale: [1, 1.1, 1],
                        }}
                        transition={{
                          duration: 1,
                          times: [0, 0.4, 1],
                          delay: 1 + index * 0.08,
                        }}
                      >
                        <span className='text-[#aef359]'>
                          {participant.realtimeScore}
                        </span>
                      </motion.div>
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
                              delay: 0.8 + index * 0.06,
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
                              y: [0, -8, 0],
                            }}
                            transition={{
                              type: 'spring',
                              stiffness: 300,
                              delay: 0.8 + index * 0.06,
                              y: {
                                times: [0, 0.5, 1],
                                duration: 1.2,
                                repeat: 1,
                                repeatDelay: 0.3,
                              },
                            }}
                          >
                            <div className='bg-green-500/20 px-2 py-0.5 rounded-full flex items-center'>
                              <ChevronUp className='h-5 w-5 mr-1' />
                              <span className='font-medium'>
                                {change.change}
                              </span>
                            </div>
                          </motion.div>
                        ) : change.direction === 'down' ? (
                          <motion.div
                            className='flex items-center text-red-400'
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{
                              scale: 1,
                              opacity: 1,
                              y: [0, 8, 0],
                            }}
                            transition={{
                              type: 'spring',
                              stiffness: 300,
                              delay: 0.8 + index * 0.06,
                              y: {
                                times: [0, 0.5, 1],
                                duration: 1.2,
                                repeat: 1,
                                repeatDelay: 0.3,
                              },
                            }}
                          >
                            <div className='bg-red-500/20 px-2 py-0.5 rounded-full flex items-center'>
                              <ChevronDown className='h-5 w-5 mr-1' />
                              <span className='font-medium'>
                                {change.change}
                              </span>
                            </div>
                          </motion.div>
                        ) : (
                          <motion.div
                            className='flex items-center text-gray-400'
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{
                              type: 'spring',
                              stiffness: 300,
                              delay: 0.8 + index * 0.04,
                            }}
                          >
                            <div className='bg-gray-500/20 px-2 py-0.5 rounded-full flex items-center'>
                              <Minus className='h-4 w-4 mr-1' />
                              <span className='font-medium'>0</span>
                            </div>
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
            <div className='flex items-center justify-between mb-2'>
              <p className='font-mono'>Thông tin Debug:</p>
              <div className='flex space-x-2'>
                <button
                  onClick={() => setDisableAnimation(!disableAnimation)}
                  className={`px-2 py-1 rounded ${
                    disableAnimation
                      ? 'bg-red-500/30 text-red-300'
                      : 'bg-green-500/30 text-green-300'
                  }`}
                >
                  Animation: {disableAnimation ? 'Tắt' : 'Bật'}
                </button>
                <button
                  onClick={handleResetPositions}
                  className='px-2 py-1 bg-purple-500/20 rounded text-purple-300 hover:bg-purple-500/30'
                >
                  Reset Positions
                </button>
                <button
                  onClick={handleRefreshData}
                  className='px-2 py-1 bg-blue-500/20 rounded text-blue-300 hover:bg-blue-500/30'
                >
                  Tải lại dữ liệu
                </button>
              </div>
            </div>

            <div className='mb-2'>
              <p className='mb-1'>
                Activity ID:{' '}
                <span className='text-green-300'>{currentActivityId}</span>
              </p>
              <p className='mb-1'>
                Animation Complete:{' '}
                <span
                  className={
                    animationComplete ? 'text-green-300' : 'text-amber-300'
                  }
                >
                  {animationComplete ? 'Yes' : 'No'}
                </span>
              </p>
              <p className='mb-1'>
                Animation Status:{' '}
                <span
                  className={
                    disableAnimation ? 'text-red-300' : 'text-green-300'
                  }
                >
                  {disableAnimation ? 'Đã tắt' : 'Đang bật'}
                </span>
              </p>
              <p className='mb-1'>
                Participants:{' '}
                <span className='text-green-300'>
                  {rankingData?.participants.length || 0}
                </span>
              </p>
            </div>

            <p className='font-mono mb-1'>Position Map:</p>
            <div className='flex space-x-3'>
              <div className='flex-1'>
                <p className='text-amber-300 mb-1'>Previous:</p>
                <pre className='overflow-auto bg-slate-800/50 p-1 rounded'>
                  {JSON.stringify(positionMap.previous, null, 2)}
                </pre>
              </div>
              <div className='flex-1'>
                <p className='text-green-300 mb-1'>Current:</p>
                <pre className='overflow-auto bg-slate-800/50 p-1 rounded'>
                  {JSON.stringify(positionMap.current, null, 2)}
                </pre>
              </div>
            </div>

            <p className='mt-2 text-xs text-amber-300'>
              * Nếu Previous và Current giống nhau, animation sẽ sử dụng hiệu
              ứng "pulse" thay vì di chuyển
            </p>
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
