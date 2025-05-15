'use client';

import React, { useState, useEffect } from 'react';
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
  X,
  Star,
  Crown,
  Shield,
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

interface UserAchievements {
  userId: string;
  totalPoints: number;
  newAchievements: Achievement[];
}

interface UserSessionResult {
  sessionParticipantId: string;
  displayName: string;
  displayAvatar: string;
  finalScore: number;
  finalRanking: number;
  finalCorrectCount: number;
  finalIncorrectCount: number;
}

interface SessionResultSummaryProps {
  sessionCode: string;
  displayName: string;
  avatar: string;
  userResult?: UserSessionResult;
  rank?: number;
  totalParticipants?: number;
  onNavigateToHome?: () => void;
  achievements?: UserAchievements;
}

export default function SessionResultSummary({
  sessionCode,
  displayName,
  avatar,
  userResult,
  rank = 0,
  totalParticipants = 0,
  onNavigateToHome,
  achievements,
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
    } else if (iconUrl.includes('STAR')) {
      return <Star className='h-6 w-6' />;
    } else if (iconUrl.includes('CROWN')) {
      return <Crown className='h-6 w-6' />;
    } else if (iconUrl.includes('SHIELD')) {
      return <Shield className='h-6 w-6' />;
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
            {userResult?.finalRanking && userResult.finalRanking > 0 && (
              <p className='text-sm text-muted-foreground'>
                Xếp hạng: {userResult.finalRanking}/{totalParticipants}
              </p>
            )}
          </div>
          <div className='text-center'>
            <div className='text-3xl font-bold text-primary'>
              {userResult?.finalScore || 0}
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
                    {userResult?.finalScore || 0}
                  </div>
                  <div className='text-xs text-muted-foreground'>Điểm số</div>
                </div>
              </div>
            </div>

            {userResult?.finalRanking && userResult.finalRanking > 0 && (
              <div className='bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg'>
                <div className='flex items-center gap-3'>
                  <div className='p-2 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-full'>
                    <Medal className='h-5 w-5' />
                  </div>
                  <div>
                    <div className='text-2xl font-bold'>
                      {userResult.finalRanking}
                    </div>
                    <div className='text-xs text-muted-foreground'>
                      Xếp hạng
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className='bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg'>
              <div className='flex items-center gap-3'>
                <div className='p-2 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full'>
                  <CheckCircle className='h-5 w-5' />
                </div>
                <div>
                  <div className='text-2xl font-bold'>
                    {userResult?.finalCorrectCount || 0}
                  </div>
                  <div className='text-xs text-muted-foreground'>
                    Câu trả lời đúng
                  </div>
                </div>
              </div>
            </div>

            <div className='bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg'>
              <div className='flex items-center gap-3'>
                <div className='p-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full'>
                  <X className='h-5 w-5' />
                </div>
                <div>
                  <div className='text-2xl font-bold'>
                    {userResult?.finalIncorrectCount || 0}
                  </div>
                  <div className='text-xs text-muted-foreground'>
                    Câu trả lời sai
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className='mt-8'>
            <Button
              className='w-full bg-[rgb(173,216,255)] text-white'
              onClick={onNavigateToHome}
            >
              <CheckCircle className='mr-2 h-4 w-4' /> Quay về trang chủ
            </Button>
          </div>
        </motion.div>

        {/* Cột phải - Thống kê và thành tựu */}
        <motion.div
          className='md:col-span-7 bg-white dark:bg-gray-800 rounded-xl shadow-md p-6'
          variants={itemVariants}
        >
          <h2 className='text-xl font-semibold mb-6'>Thống kê & Thành tựu</h2>
          <div className='space-y-4'>
            <div className='bg-[rgb(173,216,255)]/20 p-4 rounded-lg border border-[rgb(173,216,255)]/40'>
              <div className='flex items-center gap-4'>
                <div className='p-3 bg-[rgb(173,216,255)] text-white rounded-full'>
                  <Target className='h-6 w-6' />
                </div>
                <div className='flex-1'>
                  <h3 className='font-bold text-lg'>Tỷ lệ chính xác</h3>
                  <p className='text-sm text-muted-foreground'>
                    {userResult &&
                      userResult.finalCorrectCount !== undefined &&
                      userResult.finalIncorrectCount !== undefined
                      ? `${Math.round(
                        (userResult.finalCorrectCount /
                          Math.max(
                            1,
                            userResult.finalCorrectCount +
                            userResult.finalIncorrectCount
                          )) *
                        100
                      )}%`
                      : '0%'}
                  </p>
                </div>
              </div>
            </div>

            {achievements && (
              <div className='mt-6'>
                <div className='bg-[rgb(255,198,121)]/20 p-4 rounded-lg border border-[rgb(255,198,121)]/40 mb-4'>
                  <div className='flex items-center gap-4'>
                    <div className='p-3 bg-[rgb(255,198,121)] text-white rounded-full'>
                      <Star className='h-6 w-6' />
                    </div>
                    <div className='flex-1'>
                      <h3 className='font-bold text-lg'>Tổng điểm thành tựu</h3>
                      <p className='text-sm text-muted-foreground'>
                        {achievements.totalPoints} điểm tích lũy
                      </p>
                    </div>
                  </div>
                </div>

                {achievements.newAchievements &&
                  achievements.newAchievements.length > 0 ? (
                  <div className='space-y-3'>
                    <h3 className='font-semibold text-base'>
                      Thành tựu mới đạt được:
                    </h3>
                    {achievements.newAchievements.map((achievement, index) => (
                      <motion.div
                        key={achievement.achievementId}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 * index }}
                        className='bg-[rgb(213,189,255)]/20 p-3 rounded-lg border border-[rgb(213,189,255)]/40'
                      >
                        <div className='flex items-start gap-3'>
                          <div className='p-2 bg-[rgb(213,189,255)] text-white rounded-full mt-1'>
                            {renderAchievementIcon(achievement.iconUrl)}
                          </div>
                          <div>
                            <h4 className='font-bold text-base'>
                              {achievement.name}
                            </h4>
                            <p className='text-xs text-muted-foreground'>
                              {achievement.description}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className='p-4 bg-gray-50 dark:bg-gray-700/30 rounded-lg text-center'>
                    <p className='text-sm text-muted-foreground'>
                      Tiếp tục tham gia để đạt thêm thành tựu mới!
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
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
