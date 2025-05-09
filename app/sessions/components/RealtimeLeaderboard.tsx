import { motion, AnimatePresence } from 'framer-motion';
import { Medal, ChevronUp, ChevronDown, Minus } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import {
  LeaderboardManager,
  RankedParticipant,
} from '@/websocket/sessionWebSocket';

interface Participant {
  displayName: string;
  displayAvatar: string;
  realtimeScore: number;
  realtimeRanking: number;
  id?: string;
}

interface RealtimeLeaderboardProps {
  participants?: Participant[];
  currentUserName?: string;
  onScoreUpdate?: (score: number, id: string | undefined) => void;
}

export default function RealtimeLeaderboard({
  participants: propParticipants,
  currentUserName,
  onScoreUpdate,
}: RealtimeLeaderboardProps) {
  // State để lưu danh sách người tham gia
  const [participants, setParticipants] = useState<RankedParticipant[]>([]);
  // State để lưu điểm số trước đó
  const [prevScore, setPrevScore] = useState<number>(0);
  // Ref để lưu thứ hạng trước đó
  const prevRankingRef = useRef<{ [key: string]: number }>({});
  // Ref để theo dõi đã có dữ liệu chưa
  const initializedRef = useRef(false);
  // Đếm số lần cập nhật để làm key cho animation
  const updateCountRef = useRef(0);
  // Ref để lưu thời gian cập nhật cuối cùng
  const lastUpdateTimeRef = useRef(Date.now());

  // Hàm xử lý khi nhận cập nhật từ LeaderboardManager
  const handleLeaderboardUpdate = useCallback(
    (newParticipants: RankedParticipant[]) => {
      const now = Date.now();
      const timeSinceLastUpdate = now - lastUpdateTimeRef.current;

      // Chỉ cập nhật UI nếu đã qua ít nhất 100ms từ lần cập nhật trước
      // để tránh quá nhiều re-render trong thời gian ngắn
      if (timeSinceLastUpdate < 100) {
        return;
      }

      lastUpdateTimeRef.current = now;

      console.log(
        '[RealtimeLeaderboard] Nhận cập nhật từ LeaderboardManager:',
        newParticipants.length,
        'người tham gia, sau',
        timeSinceLastUpdate,
        'ms'
      );

      // Cập nhật danh sách người tham gia
      setParticipants(newParticipants);

      // Đánh dấu là đã có dữ liệu
      initializedRef.current = true;

      // Cập nhật điểm số hiện tại của người dùng nếu có
      if (currentUserName) {
        const currentUser = newParticipants.find(
          (p) => p.displayName === currentUserName
        );

        if (currentUser && currentUser.realtimeScore !== prevScore) {
          console.log(
            '[RealtimeLeaderboard] Cập nhật điểm số từ LeaderboardManager:',
            {
              oldScore: prevScore,
              newScore: currentUser.realtimeScore,
            }
          );

          setPrevScore(currentUser.realtimeScore);

          if (onScoreUpdate) {
            onScoreUpdate(currentUser.realtimeScore, currentUser.id);
          }
        }
      }

      // Cập nhật thứ hạng trước đó
      const newRankings: { [key: string]: number } = {};
      newParticipants.forEach((p, index) => {
        newRankings[p.displayName] = index;
      });
      prevRankingRef.current = newRankings;

      // Tăng biến đếm mỗi khi có cập nhật từ server
      updateCountRef.current++;
    },
    [currentUserName, onScoreUpdate, prevScore]
  );

  // Đăng ký nhận dữ liệu từ LeaderboardManager
  useEffect(() => {
    // Tăng biến đếm mỗi khi component được render
    updateCountRef.current++;

    console.log(
      '[RealtimeLeaderboard] Khởi tạo, đăng ký với LeaderboardManager'
    );

    // Lấy instance của LeaderboardManager
    const leaderboardManager = LeaderboardManager.getInstance();

    // Cấu hình thời gian throttle cho LeaderboardManager
    leaderboardManager.setUpdateThrottle(300);

    // Đăng ký nhận cập nhật
    const unsubscribe = leaderboardManager.subscribe(handleLeaderboardUpdate);

    // Cũng sử dụng prop participants nếu có
    if (
      propParticipants &&
      propParticipants.length > 0 &&
      !initializedRef.current
    ) {
      console.log(
        '[RealtimeLeaderboard] Sử dụng participants từ props:',
        propParticipants.length
      );
      setParticipants(propParticipants as RankedParticipant[]);
    }

    // Cleanup subscription khi component unmount
    return () => {
      console.log('[RealtimeLeaderboard] Hủy đăng ký với LeaderboardManager');
      unsubscribe();
    };
  }, [
    currentUserName,
    onScoreUpdate,
    prevScore,
    propParticipants,
    handleLeaderboardUpdate,
  ]);

  // Hàm lấy màu theo thứ hạng
  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'text-yellow-500';
      case 2:
        return 'text-gray-400';
      case 3:
        return 'text-amber-600';
      default:
        return 'text-gray-600';
    }
  };

  // Hàm lấy biểu tượng theo thứ hạng
  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return '🥇';
      case 2:
        return '🥈';
      case 3:
        return '🥉';
      default:
        return rank;
    }
  };

  // Hàm tính toán sự thay đổi thứ hạng
  const getRankChange = (name: string, currentIndex: number) => {
    const prevIndex = prevRankingRef.current[name];
    // Nếu không có thứ hạng trước đó, trả về 0 (không có thay đổi)
    if (prevIndex === undefined) return 0;
    return prevIndex - currentIndex;
  };

  return (
    <Card className='bg-white/50 backdrop-blur-sm border-white/20'>
      <div className='p-4'>
        <div className='flex items-center justify-between mb-4'>
          <h3 className='text-lg font-semibold flex items-center gap-2'>
            <Medal className='w-5 h-5 text-yellow-500' />
            Bảng xếp hạng
          </h3>
          <span className='text-sm text-gray-500'>
            {participants.length} người chơi
          </span>
        </div>

        <div className='space-y-2 relative'>
          {participants.length === 0 ? (
            <div className='text-center py-8 text-gray-500'>
              <p>Chưa có người tham gia nào</p>
              <p className='text-sm mt-2'>
                Chia sẻ mã phiên để mọi người tham gia
              </p>
            </div>
          ) : (
            <div>
              <AnimatePresence initial={false}>
                {participants.map((participant) => {
                  const rankChange = getRankChange(
                    participant.displayName,
                    participant.realtimeRanking - 1
                  );
                  const isRankUp = rankChange > 0;
                  const isRankDown = rankChange < 0;
                  const isCurrentUser =
                    participant.displayName === currentUserName;

                  return (
                    <motion.div
                      key={participant.displayName}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{
                        type: 'spring',
                        stiffness: 500,
                        damping: 30,
                        mass: 1,
                      }}
                      className={`flex items-center p-3 rounded-lg mb-2 ${
                        isCurrentUser
                          ? 'bg-indigo-50 border border-indigo-100'
                          : 'bg-white/80 hover:bg-white'
                      }`}
                    >
                      {/* Thứ hạng */}
                      <div className='w-8 text-center font-bold'>
                        <div
                          className={`inline-flex items-center justify-center ${
                            participant.realtimeRanking <= 3
                              ? 'text-lg'
                              : 'text-gray-500'
                          }`}
                        >
                          {getRankIcon(participant.realtimeRanking)}
                        </div>
                      </div>

                      {/* Chỉ báo thứ hạng thay đổi */}
                      <div className='w-6 flex items-center justify-center'>
                        {isRankUp && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className='text-green-500'
                          >
                            <ChevronUp size={16} />
                          </motion.div>
                        )}
                        {isRankDown && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className='text-red-500'
                          >
                            <ChevronDown size={16} />
                          </motion.div>
                        )}
                      </div>

                      {/* Avatar */}
                      <div className='flex-shrink-0 mr-3'>
                        <Avatar className='h-8 w-8 border border-gray-200'>
                          <AvatarImage
                            src={participant.displayAvatar}
                            alt={participant.displayName}
                          />
                          <AvatarFallback>
                            {participant.displayName.substring(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                      </div>

                      {/* Tên */}
                      <div className='flex-1 truncate'>
                        <p
                          className={`text-sm font-medium ${
                            isCurrentUser ? 'text-indigo-600' : ''
                          }`}
                        >
                          {participant.displayName}
                          {isCurrentUser && (
                            <span className='ml-1 text-xs text-indigo-500'>
                              (bạn)
                            </span>
                          )}
                        </p>
                      </div>

                      {/* Điểm số */}
                      <div className='ml-2 flex items-center'>
                        <motion.div
                          key={`score-${participant.realtimeScore}-${updateCountRef.current}`}
                          initial={{ scale: 0.8 }}
                          animate={{ scale: 1 }}
                          className={`px-2 py-1 rounded-full text-sm font-semibold ${
                            isCurrentUser
                              ? 'bg-indigo-100 text-indigo-600'
                              : 'bg-green-100 text-green-600'
                          }`}
                        >
                          {participant.realtimeScore}
                        </motion.div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
