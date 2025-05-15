import { motion, AnimatePresence } from 'framer-motion';
import {
  Medal,
  ChevronUp,
  ChevronDown,
  Minus,
  Crown,
  Award,
  TrendingUp,
} from 'lucide-react';
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
        return 'text-yellow-400';
      case 2:
        return 'text-gray-300';
      case 3:
        return 'text-amber-500';
      default:
        return 'text-white/60';
    }
  };

  // Hàm lấy biểu tượng theo thứ hạng
  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className='h-5 w-5 text-yellow-400' />;
      case 2:
        return <Award className='h-5 w-5 text-gray-300' />;
      case 3:
        return <Medal className='h-5 w-5 text-amber-500' />;
      default:
        return <span className='text-white/60'>{rank}</span>;
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
    <Card className='bg-black bg-opacity-40 backdrop-blur-md shadow-xl border border-white/5 text-white h-full'>
      <div className='p-4 h-full flex flex-col'>
        <div className='flex items-center justify-between mb-4'>
          <h3 className='text-lg font-semibold text-[rgb(198,234,132)] flex items-center gap-2'>
            <TrendingUp className='w-5 h-5 text-[rgb(198,234,132)]' />
            Bảng xếp hạng
          </h3>
          <motion.span
            initial={{ opacity: 0.6 }}
            animate={{ opacity: 1 }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              repeatType: 'reverse',
            }}
            className=' text-white/50 bg-black bg-opacity-30 px-2 py-0.5 rounded-full text-xs border border-white/10'
          >
            {participants.length} người chơi
          </motion.span>
        </div>

        <div className='space-y-2 relative flex-grow overflow-auto'>
          {participants.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className='text-center py-8 bg-black bg-opacity-20 rounded-lg border border-white/5'
            >
              <p className='text-white/70'>Chưa có người tham gia nào</p>
              <p className='text-sm mt-2 text-white/50'>
                Chia sẻ mã phiên để mọi người tham gia
              </p>
            </motion.div>
          ) : (
            <div className='max-h-[calc(100%-50px)] overflow-y-auto pr-2 py-1 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent hover:scrollbar-thumb-white/20'>
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
                      className={`flex items-center p-2 rounded-lg mb-2 backdrop-blur-sm ${isCurrentUser
                          ? 'bg-[rgb(198,234,132)]/10 border border-[rgb(198,234,132)]/30'
                          : 'bg-black bg-opacity-30 border border-white/5 hover:bg-black hover:bg-opacity-40'
                        }`}
                    >
                      {/* Thứ hạng */}
                      <div className='w-6 text-center font-bold'>
                        <div
                          className={`inline-flex items-center justify-center`}
                        >
                          {getRankIcon(participant.realtimeRanking)}
                        </div>
                      </div>

                      {/* Avatar và tên */}
                      <div className='flex items-center flex-1 min-w-0'>
                        <motion.div
                          whileHover={{ scale: 1.05 }}
                          className='relative mr-2'
                        >
                          {participant.realtimeRanking <= 3 && (
                            <motion.div
                              className={`absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full border ${participant.realtimeRanking === 1
                                  ? 'bg-yellow-500 border-yellow-300'
                                  : participant.realtimeRanking === 2
                                    ? 'bg-gray-400 border-gray-300'
                                    : 'bg-amber-600 border-amber-500'
                                }`}
                              animate={{
                                scale: [1, 1.2, 1],
                                opacity: [0.7, 1, 0.7],
                              }}
                              transition={{
                                duration: 2,
                                repeat: Infinity,
                                ease: 'easeInOut',
                              }}
                            />
                          )}

                          <Avatar className='h-7 w-7 rounded-full border border-white/20'>
                            <AvatarImage src={participant.displayAvatar} />
                            <AvatarFallback className='bg-black bg-opacity-40 text-[rgb(198,234,132)] text-xs'>
                              {participant.displayName.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                        </motion.div>

                        <div className='flex-1 min-w-0'>
                          <div className='flex items-center'>
                            <p className='font-medium text-xs truncate text-white/90'>
                              {participant.displayName}
                            </p>
                            {isRankUp && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className='ml-1'
                              >
                                <ChevronUp className='w-3 h-3 text-green-400' />
                              </motion.div>
                            )}
                            {isRankDown && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className='ml-1'
                              >
                                <ChevronDown className='w-3 h-3 text-red-400' />
                              </motion.div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Điểm số */}
                      <motion.div
                        key={`score-${participant.displayName}-${participant.realtimeScore}`}
                        initial={{ scale: 1.5 }}
                        animate={{ scale: 1 }}
                        className='min-w-[40px] text-right'
                      >
                        <div className='font-bold text-sm text-[rgb(198,234,132)]'>
                          {participant.realtimeScore}
                        </div>
                      </motion.div>
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
