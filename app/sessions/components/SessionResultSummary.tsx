'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  Trophy,
  Target,
  Clock,
  Zap,
  CheckCircle,
  ChevronRight,
  Award,
  Medal,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';

interface Achievement {
  achievementId: string;
  name: string;
  description: string;
  iconUrl: string;
  requiredPoints: number;
}

interface UserSessionResult {
  userId: string;
  totalPoints: number;
  newAchievements: Achievement[];
}

interface SessionResultSummaryProps {
  sessionCode: string;
  displayName: string;
  avatar: string;
  userResult?: UserSessionResult;
  rank?: number;
  totalParticipants?: number;
  onNavigateToHome?: () => void;
}

export default function SessionResultSummary({
  sessionCode,
  displayName,
  avatar,
  userResult,
  rank = 0,
  totalParticipants = 0,
  onNavigateToHome,
}: SessionResultSummaryProps) {
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: 'spring', stiffness: 100 },
    },
  };

  // Function to render achievement icon
  const renderAchievementIcon = (iconUrl: string) => {
    // Nếu iconUrl bắt đầu với 'TROPHY', 'MEDAL', 'STAR', v.v. thì hiển thị icon tương ứng
    if (iconUrl.includes('TROPHY')) {
      return <Trophy className='h-6 w-6' />;
    } else if (iconUrl.includes('MEDAL')) {
      return <Medal className='h-6 w-6' />;
    } else if (iconUrl.includes('TARGET')) {
      return <Target className='h-6 w-6' />;
    } else if (iconUrl.includes('ZAP')) {
      return <Zap className='h-6 w-6' />;
    } else if (iconUrl.includes('AWARD')) {
      return <Award className='h-6 w-6' />;
    } else {
      // Default icon
      return <Award className='h-6 w-6' />;
    }
  };

  return (
    <motion.div
      className='max-w-4xl mx-auto'
      variants={containerVariants}
      initial='hidden'
      animate='visible'
    >
      <motion.div className='text-center mb-8' variants={itemVariants}>
        <div className='inline-flex items-center justify-center p-3 bg-primary/10 text-primary rounded-full mb-4'>
          <Trophy className='h-12 w-12' />
        </div>
        <h1 className='text-3xl md:text-4xl font-bold mb-2'>
          Kết quả phiên học
        </h1>
        <p className='text-muted-foreground'>Phiên: {sessionCode}</p>
      </motion.div>

      {/* Thông tin người dùng */}
      <motion.div
        className='mb-8 flex items-center justify-center'
        variants={itemVariants}
      >
        <Card className='p-6 flex items-center gap-4 max-w-md w-full'>
          <Avatar className='h-16 w-16'>
            <AvatarImage src={avatar} alt={displayName} />
            <AvatarFallback>{displayName.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className='flex-1'>
            <h2 className='text-xl font-bold'>{displayName}</h2>
            {rank > 0 && (
              <p className='text-sm text-muted-foreground'>
                Xếp hạng: {rank}/{totalParticipants}
              </p>
            )}
          </div>
          <div className='text-center'>
            <div className='text-3xl font-bold text-primary'>
              {userResult?.totalPoints || 0}
            </div>
            <div className='text-xs text-muted-foreground'>Tổng điểm</div>
          </div>
        </Card>
      </motion.div>

      {/* Kết quả chi tiết */}
      <div className='grid grid-cols-1 md:grid-cols-12 gap-6 mb-12'>
        {/* Cột trái - Điểm số */}
        <motion.div
          className='md:col-span-5 bg-white dark:bg-gray-800 rounded-xl shadow-md p-6'
          variants={itemVariants}
        >
          <h2 className='text-xl font-semibold mb-6'>Thành tích</h2>

          <div className='grid grid-cols-1 gap-4 mb-6'>
            <div className='bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg'>
              <div className='flex items-center gap-3'>
                <div className='p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full'>
                  <Trophy className='h-5 w-5' />
                </div>
                <div>
                  <div className='text-2xl font-bold'>
                    {userResult?.totalPoints || 0}
                  </div>
                  <div className='text-xs text-muted-foreground'>Điểm số</div>
                </div>
              </div>
            </div>

            {rank > 0 && (
              <div className='bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg'>
                <div className='flex items-center gap-3'>
                  <div className='p-2 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-full'>
                    <Medal className='h-5 w-5' />
                  </div>
                  <div>
                    <div className='text-2xl font-bold'>{rank}</div>
                    <div className='text-xs text-muted-foreground'>
                      Xếp hạng
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className='mt-8'>
            <Button
              className='w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white'
              onClick={onNavigateToHome}
            >
              <CheckCircle className='mr-2 h-4 w-4' /> Quay về trang chủ
            </Button>
          </div>
        </motion.div>

        {/* Cột phải - Thành tựu */}
        <motion.div
          className='md:col-span-7 bg-white dark:bg-gray-800 rounded-xl shadow-md p-6'
          variants={itemVariants}
        >
          <h2 className='text-xl font-semibold mb-6'>Thành tựu mới</h2>

          {!userResult ||
          !userResult.newAchievements ||
          userResult.newAchievements.length === 0 ? (
            <div className='text-center py-8 text-muted-foreground'>
              <Award className='h-12 w-12 mx-auto mb-4 opacity-20' />
              <p>Bạn chưa đạt được thành tựu nào trong phiên này</p>
              <p className='text-sm mt-2'>
                Tiếp tục tham gia các phiên học để mở khóa thành tựu!
              </p>
            </div>
          ) : (
            <div className='space-y-4'>
              {userResult.newAchievements.map((achievement) => (
                <motion.div
                  key={achievement.achievementId}
                  className='bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800 flex items-start gap-4'
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className='p-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-full'>
                    {renderAchievementIcon(achievement.iconUrl)}
                  </div>
                  <div className='flex-1'>
                    <h3 className='font-bold text-lg'>{achievement.name}</h3>
                    <p className='text-sm text-muted-foreground'>
                      {achievement.description}
                    </p>
                    {achievement.requiredPoints > 0 && (
                      <Badge className='mt-2 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100'>
                        +{achievement.requiredPoints} điểm yêu cầu
                      </Badge>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Nút điều hướng */}
      <motion.div className='text-center' variants={itemVariants}>
        <p className='text-muted-foreground mb-4'>
          Cảm ơn bạn đã tham gia phiên học!
        </p>

        <div className='flex flex-col sm:flex-row gap-3 justify-center'>
          <Button variant='outline' asChild>
            <Link href='/sessions'>
              <Zap className='mr-2 h-4 w-4' /> Tham gia phiên khác
            </Link>
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}
