'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  CheckCircle,
  Star,
  Medal,
  Trophy,
  Award,
  Target,
  Clock,
  Zap,
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

// Dữ liệu mẫu cho trang kết quả quiz
const quizResult = {
  quizId: 'quiz1',
  title: 'Kiến thức tổng quát về Việt Nam',
  totalQuestions: 5,
  correctAnswers: 4,
  score: 60,
  maxScore: 75,
  timeTaken: '3:24',
  accuracy: 80,
  startedAt: new Date('2023-09-15T10:30:00'),
  achievements: [
    {
      id: 'ach1',
      title: 'Tốc độ ánh sáng',
      description: 'Hoàn thành quiz trong thời gian dưới 4 phút',
      icon: Clock,
      color: 'bg-blue-500',
      isNewlyUnlocked: true,
      points: 25,
    },
    {
      id: 'ach2',
      title: 'Siêu chính xác',
      description: 'Đạt độ chính xác trên 80%',
      icon: Target,
      color: 'bg-green-500',
      isNewlyUnlocked: true,
      points: 30,
    },
    {
      id: 'ach3',
      title: 'Chinh phục Việt Nam',
      description: 'Hoàn thành quiz về Việt Nam',
      icon: Award,
      color: 'bg-orange-500',
      isNewlyUnlocked: false,
      points: 20,
    },
  ],
  streakCount: 3,
  levelProgress: {
    currentLevel: 2,
    currentLevelName: 'Người học mới',
    nextLevelName: 'Học viên tích cực',
    xpEarned: 75,
    xpForNextLevel: 150,
    progress: 55,
  },
};

export default function QuizSummaryPage() {
  const percentCorrect =
    (quizResult.correctAnswers / quizResult.totalQuestions) * 100;

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

  return (
    <div className='container mx-auto px-4 py-8'>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className='max-w-4xl mx-auto'
      >
        <motion.div
          className='text-center mb-8'
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className='inline-flex items-center justify-center p-3 bg-primary/10 text-primary rounded-full mb-4'>
            <Trophy className='h-12 w-12' />
          </div>
          <h1 className='text-3xl md:text-4xl font-bold mb-2'>Kết quả Quiz</h1>
          <p className='text-muted-foreground'>
            Hoàn thành: {quizResult.title}
          </p>
        </motion.div>

        {/* Điểm số và thành tích */}
        <div className='grid grid-cols-1 md:grid-cols-12 gap-6 mb-12'>
          {/* Cột trái - Kết quả */}
          <motion.div
            className='md:col-span-7 bg-white dark:bg-gray-800 rounded-xl shadow-md p-6'
            variants={itemVariants}
            initial='hidden'
            animate='visible'
          >
            <h2 className='text-xl font-semibold mb-6'>Kết quả chi tiết</h2>

            <div className='mb-6'>
              <div className='flex justify-between items-center mb-2'>
                <span className='text-sm font-medium'>Độ chính xác</span>
                <span className='text-sm font-bold'>
                  {quizResult.correctAnswers}/{quizResult.totalQuestions} câu
                  đúng
                </span>
              </div>
              <Progress value={Math.min(Math.max(percentCorrect, 0), 100)} className='h-2.5' />
            </div>

            <div className='grid grid-cols-2 gap-4 mb-6'>
              <div className='bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg'>
                <div className='flex items-center gap-3'>
                  <div className='p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full'>
                    <Trophy className='h-5 w-5' />
                  </div>
                  <div>
                    <div className='text-2xl font-bold'>{quizResult.score}</div>
                    <div className='text-xs text-muted-foreground'>Điểm số</div>
                  </div>
                </div>
              </div>

              <div className='bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg'>
                <div className='flex items-center gap-3'>
                  <div className='p-2 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full'>
                    <Target className='h-5 w-5' />
                  </div>
                  <div>
                    <div className='text-2xl font-bold'>
                      {quizResult.accuracy}%
                    </div>
                    <div className='text-xs text-muted-foreground'>
                      Độ chính xác
                    </div>
                  </div>
                </div>
              </div>

              <div className='bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg'>
                <div className='flex items-center gap-3'>
                  <div className='p-2 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-full'>
                    <Clock className='h-5 w-5' />
                  </div>
                  <div>
                    <div className='text-2xl font-bold'>
                      {quizResult.timeTaken}
                    </div>
                    <div className='text-xs text-muted-foreground'>
                      Thời gian
                    </div>
                  </div>
                </div>
              </div>

              <div className='bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg'>
                <div className='flex items-center gap-3'>
                  <div className='p-2 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-full'>
                    <Zap className='h-5 w-5' />
                  </div>
                  <div>
                    <div className='text-2xl font-bold'>
                      {quizResult.streakCount}
                    </div>
                    <div className='text-xs text-muted-foreground'>
                      Chuỗi đúng
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className='mb-6'>
              <h3 className='text-sm font-medium mb-3'>Tiến độ cấp độ</h3>
              <div className='flex items-center gap-2 mb-2'>
                <Badge variant='outline' className='bg-primary/5 text-xs'>
                  Cấp {quizResult.levelProgress.currentLevel}
                </Badge>
                <span className='text-sm'>
                  {quizResult.levelProgress.currentLevelName}
                </span>
                <div className='flex-1 h-px bg-gray-200 dark:bg-gray-700'></div>
                <Badge variant='outline' className='bg-primary/5 text-xs'>
                  Cấp {quizResult.levelProgress.currentLevel + 1}
                </Badge>
                <span className='text-sm'>
                  {quizResult.levelProgress.nextLevelName}
                </span>
              </div>
              <div className='w-full bg-gray-100 dark:bg-gray-700 h-2 rounded-full overflow-hidden'>
                <motion.div
                  className='h-full bg-primary'
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(Math.max(quizResult.levelProgress.progress, 0), 100)}%` }}
                  transition={{ duration: 1, delay: 0.5 }}
                />
              </div>
              <div className='flex justify-between text-xs text-muted-foreground mt-1'>
                <span>+{quizResult.levelProgress.xpEarned} XP kiếm được</span>
                <span>
                  {quizResult.levelProgress.xpForNextLevel -
                    (quizResult.levelProgress.xpEarned *
                      quizResult.levelProgress.progress) /
                    100}{' '}
                  XP còn thiếu
                </span>
              </div>
            </div>

            <div className='flex flex-col sm:flex-row gap-3'>
              <Button variant='outline' className='flex-1' asChild>
                <Link href='/quiz'>
                  <Zap className='mr-2 h-4 w-4' /> Quiz khác
                </Link>
              </Button>
              <Button
                className='flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 text-white'
                asChild
              >
                <Link href={`/quiz/${quizResult.quizId}/review`}>
                  <CheckCircle className='mr-2 h-4 w-4' /> Xem đáp án
                </Link>
              </Button>
            </div>
          </motion.div>

          {/* Cột phải - Thành tựu */}
          <motion.div
            className='md:col-span-5 bg-white dark:bg-gray-800 rounded-xl shadow-md p-6'
            variants={itemVariants}
            initial='hidden'
            animate='visible'
            transition={{ delay: 0.2 }}
          >
            <h2 className='text-xl font-semibold mb-6'>Thành tựu đạt được</h2>

            <div className='space-y-4'>
              {quizResult.achievements.map((achievement, index) => (
                <motion.div
                  key={achievement.id}
                  className={`p-4 border rounded-lg relative ${achievement.isNewlyUnlocked
                    ? 'border-primary bg-primary/5'
                    : 'border-gray-200 dark:border-gray-700'
                    }`}
                  initial={{ x: 50, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                >
                  {achievement.isNewlyUnlocked && (
                    <div className='absolute -top-2 -right-2 bg-primary text-white text-xs px-2 py-1 rounded-full'>
                      Mới
                    </div>
                  )}

                  <div className='flex gap-4'>
                    <div
                      className={`w-12 h-12 rounded-lg flex items-center justify-center ${achievement.color} text-white`}
                    >
                      <achievement.icon className='h-6 w-6' />
                    </div>

                    <div className='flex-1'>
                      <h3 className='font-semibold'>{achievement.title}</h3>
                      <p className='text-sm text-muted-foreground'>
                        {achievement.description}
                      </p>
                      <div className='mt-1 text-xs'>
                        <Badge className='bg-primary/10 text-primary border-0'>
                          +{achievement.points} điểm
                        </Badge>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className='mt-6 text-center'>
              <Link
                href='/achievements'
                className='text-sm text-primary hover:underline flex items-center justify-center'
              >
                <Trophy className='h-4 w-4 mr-1' /> Xem tất cả thành tựu
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Khung chia sẻ */}
        <motion.div
          className='bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-6 text-white text-center'
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.7, duration: 0.5 }}
        >
          <h2 className='text-xl font-semibold mb-3'>
            Chia sẻ kết quả của bạn
          </h2>
          <p className='mb-4 text-blue-100'>
            Khoe thành tích với bạn bè và thách thức họ vượt qua điểm số của
            bạn!
          </p>

          <div className='flex flex-wrap justify-center gap-3'>
            <Button variant='secondary' className='bg-white text-blue-600'>
              <svg
                xmlns='http://www.w3.org/2000/svg'
                width='16'
                height='16'
                viewBox='0 0 24 24'
                fill='none'
                stroke='currentColor'
                strokeWidth='2'
                strokeLinecap='round'
                strokeLinejoin='round'
                className='mr-2'
              >
                <path d='M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z'></path>
              </svg>
              Facebook
            </Button>
            <Button variant='secondary' className='bg-white text-blue-600'>
              <svg
                xmlns='http://www.w3.org/2000/svg'
                width='16'
                height='16'
                viewBox='0 0 24 24'
                fill='none'
                stroke='currentColor'
                strokeWidth='2'
                strokeLinecap='round'
                strokeLinejoin='round'
                className='mr-2'
              >
                <path d='M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z'></path>
              </svg>
              Twitter
            </Button>
            <Button variant='secondary' className='bg-white text-blue-600'>
              <svg
                xmlns='http://www.w3.org/2000/svg'
                width='16'
                height='16'
                viewBox='0 0 24 24'
                fill='none'
                stroke='currentColor'
                strokeWidth='2'
                strokeLinecap='round'
                strokeLinejoin='round'
                className='mr-2'
              >
                <rect x='9' y='9' width='13' height='13' rx='2' ry='2'></rect>
                <path d='M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1'></path>
              </svg>
              Sao chép liên kết
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
