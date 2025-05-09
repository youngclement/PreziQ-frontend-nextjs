import { motion, AnimatePresence } from 'framer-motion';
import { Medal } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { useEffect, useState } from 'react';

interface Participant {
  displayName: string;
  displayAvatar: string;
  realtimeScore: number;
  realtimeRanking: number;
  id?: string;
}

interface RealtimeLeaderboardProps {
  participants: Participant[];
  currentUserName?: string;
  onScoreUpdate?: (score: number, id: string | undefined) => void;
}

export default function RealtimeLeaderboard({
  participants,
  currentUserName,
  onScoreUpdate,
}: RealtimeLeaderboardProps) {
  const [prevRanking, setPrevRanking] = useState<{ [key: string]: number }>({});
  const [prevScore, setPrevScore] = useState<number>(0);

  // Sắp xếp người chơi theo điểm số
  const sortedParticipants = [...participants].sort(
    (a, b) => b.realtimeScore - a.realtimeScore
  );

  // Theo dõi thay đổi điểm số của người chơi hiện tại
  useEffect(() => {
    if (!currentUserName) {
      console.log(
        '[RealtimeLeaderboard] Chưa có thông tin người chơi hiện tại'
      );
      return;
    }

    const currentUser = participants.find(
      (p) => p.displayName === currentUserName
    );

    console.log('[RealtimeLeaderboard] Kiểm tra cập nhật điểm:', {
      currentUserName,
      currentUser,
      oldScore: prevScore,
      newScore: currentUser?.realtimeScore,
      timestamp: new Date().toISOString(),
    });

    if (currentUser && currentUser.realtimeScore !== prevScore) {
      console.log('[RealtimeLeaderboard] Cập nhật điểm số:', {
        oldScore: prevScore,
        newScore: currentUser.realtimeScore,
        timestamp: new Date().toISOString(),
      });
      setPrevScore(currentUser.realtimeScore);
      if (onScoreUpdate) {
        onScoreUpdate(currentUser.realtimeScore, currentUser.id);
      }
    }
  }, [currentUserName, participants, prevScore, onScoreUpdate]);

  // Cập nhật ranking trước đó khi participants thay đổi
  useEffect(() => {
    const newRanking: { [key: string]: number } = {};
    sortedParticipants.forEach((p, index) => {
      newRanking[p.displayName] = index;
    });
    setPrevRanking(newRanking);
  }, [participants]);

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

  // Animation variants cho việc thay đổi vị trí
  const itemVariants = {
    initial: (custom: number) => ({
      opacity: 0,
      y: custom > 0 ? 20 : -20, // Di chuyển từ trên xuống nếu tăng hạng, từ dưới lên nếu giảm hạng
    }),
    animate: {
      opacity: 1,
      y: 0,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 24,
        mass: 0.8,
      },
    },
    exit: (custom: number) => ({
      opacity: 0,
      y: custom > 0 ? -20 : 20,
      transition: {
        duration: 0.2,
      },
    }),
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
          <AnimatePresence mode='popLayout'>
            {sortedParticipants.map((participant, index) => {
              const rankChange =
                (prevRanking[participant.displayName] || 0) - index;
              const isRankUp = rankChange > 0;
              const isRankDown = rankChange < 0;

              return (
                <motion.div
                  key={participant.displayName}
                  layout
                  custom={rankChange}
                  variants={itemVariants}
                  initial='initial'
                  animate='animate'
                  exit='exit'
                  className={`flex items-center p-3 rounded-lg ${
                    participant.displayName === currentUserName
                      ? 'bg-indigo-50 border border-indigo-100'
                      : 'bg-white/30 hover:bg-white/40'
                  } transition-colors relative`}
                >
                  {/* Rank Change Indicator */}
                  {(isRankUp || isRankDown) && (
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`absolute left-0 -ml-6 ${
                        isRankUp ? 'text-green-500' : 'text-red-500'
                      }`}
                    >
                      {isRankUp ? '↑' : '↓'}
                    </motion.div>
                  )}

                  {/* Rank */}
                  <motion.div
                    layout
                    className={`w-8 text-center font-bold ${getRankColor(
                      index + 1
                    )}`}
                  >
                    {getRankIcon(index + 1)}
                  </motion.div>

                  {/* Avatar & Name */}
                  <motion.div
                    layout
                    className='flex items-center flex-1 min-w-0'
                  >
                    <Avatar className='h-8 w-8 mr-3'>
                      <AvatarImage
                        src={participant.displayAvatar}
                        alt={participant.displayName}
                      />
                      <AvatarFallback>
                        {participant.displayName.substring(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div className='truncate'>
                      <p
                        className={`font-medium ${
                          participant.displayName === currentUserName
                            ? 'text-indigo-600'
                            : ''
                        }`}
                      >
                        {participant.displayName}
                        {participant.displayName === currentUserName && (
                          <span className='ml-2 text-xs bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded'>
                            Bạn
                          </span>
                        )}
                      </p>
                    </div>
                  </motion.div>

                  {/* Score */}
                  <motion.div layout className='ml-4'>
                    <motion.span
                      className={`font-semibold ${
                        participant.displayName === currentUserName
                          ? 'text-indigo-600'
                          : 'text-gray-700'
                      }`}
                      animate={{
                        scale: [1, 1.1, 1],
                        transition: { duration: 0.3 },
                      }}
                    >
                      {participant.realtimeScore} điểm
                    </motion.span>
                  </motion.div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    </Card>
  );
}
