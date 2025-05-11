'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  AlertCircle,
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  Users,
  ArrowRight,
  ArrowUpDown,
} from 'lucide-react';
import { SessionWebSocket } from '@/websocket/sessionWebSocket';
import { motion, AnimatePresence } from 'framer-motion';
import { SortableList, Item } from './SortableList';

interface QuizReorderViewerProps {
  activity: {
    activityId: string;
    title: string;
    description?: string;
    backgroundColor?: string;
    backgroundImage?: string;
    hostShowAnswer?: boolean;
    quiz: {
      questionText: string;
      timeLimitSeconds: number;
      quizAnswers: {
        quizAnswerId: string;
        answerText: string;
        isCorrect: boolean;
        orderIndex: number;
      }[];
    };
  };
  sessionId: string;
  sessionWebSocket: SessionWebSocket;
}

export const QuizReorderViewer: React.FC<QuizReorderViewerProps> = ({
  activity,
  sessionId,
  sessionWebSocket,
}) => {
  const [items, setItems] = useState<Item[]>([]);
  const [timeLeft, setTimeLeft] = useState(activity.quiz.timeLimitSeconds);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [totalParticipants, setTotalParticipants] = useState(0);

  // Đáp án đúng
  const correctOrder = useMemo(() => {
    return activity.quiz.quizAnswers
      .sort((a, b) => a.orderIndex - b.orderIndex)
      .map((a) => a.quizAnswerId);
  }, [activity.quiz.quizAnswers]);

  // Khởi tạo items (shuffle)
  useEffect(() => {
    const shuffled = [...activity.quiz.quizAnswers]
      .sort(() => Math.random() - 0.5)
      .map((a) => ({ id: a.quizAnswerId, text: a.answerText }));
    setItems(shuffled);
  }, [activity.quiz.quizAnswers]);

  // Đếm ngược thời gian
  useEffect(() => {
    if (timeLeft > 0 && !isAnswered) {
      const t = setInterval(() => setTimeLeft((t) => t - 1), 1000);
      return () => clearInterval(t);
    }
  }, [timeLeft, isAnswered]);

  // Cập nhật participants từ WebSocket
  useEffect(() => {
    if (!sessionWebSocket) return;
    const handler = (list: any[]) => {
      setTotalParticipants(list.length);
      setAnsweredCount(list.filter((p) => p.hasAnswered).length);
    };
    sessionWebSocket.onParticipantsUpdateHandler(handler);
  }, [sessionWebSocket]);

  const handleSubmit = async () => {
    if (isSubmitting || isAnswered) return;
    setIsSubmitting(true);
    setError(null);

    try {
      const answerContent = items.map((i) => i.id).join(',');
      await sessionWebSocket.submitActivity({
        sessionId,
        activityId: activity.activityId,
        answerContent,
      });

      const userOrder = items.map((i) => i.id);
      const correct =
        JSON.stringify(userOrder) === JSON.stringify(correctOrder);
      setIsCorrect(correct);
      setIsAnswered(true);
    } catch (e) {
      setError('Không thể gửi câu trả lời. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <div className='min-h-full bg-transparent'>
      <Card className='bg-[#0e1c26]/80 backdrop-blur-md shadow-xl border border-white/5 text-white overflow-hidden'>
        {/* Header với thời gian và tiến trình */}
        <motion.div
          className='aspect-[16/5] md:aspect-[16/4] rounded-t-xl flex flex-col shadow-md relative overflow-hidden'
          style={{
            backgroundImage: activity.backgroundImage
              ? `url(${activity.backgroundImage})`
              : undefined,
            backgroundColor: activity.backgroundColor || '#0e2838',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          {/* Overlay */}
          <div className='absolute inset-0 bg-gradient-to-b from-[#0a1b25]/80 to-[#0f2231]/70' />

          {/* Status Bar */}
          <div className='absolute top-0 left-0 right-0 h-12 bg-[#0e1c26]/80 backdrop-blur-sm border-b border-white/5 flex items-center justify-between px-3 md:px-5 text-white z-10'>
            <div className='flex items-center gap-2 md:gap-3'>
              <div className='h-6 w-6 md:h-7 md:w-7 rounded-full bg-gradient-to-r from-[#aef359] to-[#e4f88d] flex items-center justify-center shadow-md'>
                <ArrowUpDown className='h-3 w-3 md:h-4 md:w-4 text-[#0e1c26]' />
              </div>
              <div className='text-xs capitalize font-medium text-white/80'>
                Reorder Quiz
              </div>
            </div>
            <div className='flex items-center gap-1 md:gap-2'>
              <motion.div
                className='flex items-center gap-1 md:gap-1.5 bg-[#0e2838]/80 border border-white/10 px-2 py-1 rounded-full text-[10px] md:text-xs font-medium'
                animate={{
                  opacity: timeLeft < 10 ? [0.7, 1] : 1,
                  scale: timeLeft < 10 ? [1, 1.05, 1] : 1,
                }}
                transition={{
                  duration: 0.5,
                  repeat: timeLeft < 10 ? Infinity : 0,
                  repeatType: 'reverse',
                }}
              >
                <Clock className='h-3 w-3 md:h-3.5 md:w-3.5 text-[#aef359]' />
                <span
                  className={timeLeft < 10 ? 'text-red-300' : 'text-white/90'}
                >
                  {formatTime(timeLeft)}
                </span>
              </motion.div>
            </div>
          </div>

          {/* Question Text */}
          <div className='flex-1 flex flex-col items-center justify-center z-10 py-5 md:py-8 px-3 md:px-5'>
            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className='text-lg md:text-xl lg:text-2xl font-bold text-center max-w-2xl text-white drop-shadow-lg'
            >
              {activity.quiz.questionText}
            </motion.h2>
            {activity.description && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.8 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className='mt-2 text-xs md:text-sm text-white/80 text-center max-w-xl'
              >
                {activity.description}
              </motion.p>
            )}
          </div>
        </motion.div>

        {/* Progress Bars */}
        <div className='w-full'>
          {/* Time Progress */}
          <motion.div
            className='h-1 bg-gradient-to-r from-[#aef359] to-[#e4f88d]'
            initial={{ width: '100%' }}
            animate={{
              width: `${Math.min(
                100,
                Math.max(0, (timeLeft / activity.quiz.timeLimitSeconds) * 100)
              )}%`,
            }}
            transition={{ duration: 0.1 }}
          />
          {/* Participants Progress */}
          <motion.div
            className='h-1 bg-purple-500/70'
            initial={{ width: '0%' }}
            animate={{
              width: `${Math.min(
                100,
                Math.max(
                  0,
                  (answeredCount / Math.max(1, totalParticipants)) * 100
                )
              )}%`,
            }}
            transition={{ duration: 0.1 }}
          />
        </div>

        {/* Content */}
        <div className='p-3 md:p-6 bg-[#0e1c26]/70'>
          <AnimatePresence>
            {error && (
              <motion.div
                className='mb-4 p-3 rounded-xl bg-red-500/20 border border-red-500/30 text-white/90'
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <div className='flex items-center gap-2'>
                  <AlertCircle className='h-5 w-5 text-red-400' />
                  <span>{error}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {isAnswered && isCorrect !== null && (
              <motion.div
                className='mb-4 md:mb-6 p-3 md:p-4 rounded-xl bg-[#0e2838]/50 border border-white/10'
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              >
                <div className='flex items-center gap-2 mb-2 md:mb-3'>
                  {isCorrect ? (
                    <div className='flex items-center gap-2 text-[#aef359]'>
                      <CheckCircle className='h-4 w-4 md:h-5 md:w-5' />
                      <span className='text-sm md:text-base font-semibold'>
                        Thứ tự đã đúng!
                      </span>
                    </div>
                  ) : (
                    <div className='flex items-center gap-2 text-red-400'>
                      <XCircle className='h-4 w-4 md:h-5 md:w-5' />
                      <span className='text-sm md:text-base font-semibold'>
                        Thứ tự chưa đúng
                      </span>
                    </div>
                  )}
                </div>
                {!isCorrect && (
                  <div className='mt-2 md:mt-3'>
                    <p className='text-xs md:text-sm text-white/70 mb-2 md:mb-3'>
                      Thứ tự đúng là:
                    </p>
                    <div className='mt-1 md:mt-2 space-y-1 md:space-y-2'>
                      {correctOrder.map((id, idx) => {
                        const answer = activity.quiz.quizAnswers.find(
                          (a) => a.quizAnswerId === id
                        )!;
                        return (
                          <motion.div
                            key={id}
                            className='p-2 md:p-3 bg-gradient-to-r from-[#0f2231]/80 to-[#102942]/80 backdrop-blur-sm rounded-xl border border-[#aef359]/20 shadow-md relative overflow-hidden'
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.1 }}
                          >
                            <div className='absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#aef359]/30 to-transparent' />
                            <div className='flex items-center gap-2'>
                              <div className='h-5 w-5 md:h-6 md:w-6 rounded-full bg-[#aef359]/20 flex items-center justify-center'>
                                <span className='text-[10px] md:text-xs text-[#aef359]'>
                                  {idx + 1}
                                </span>
                              </div>
                              <span className='text-sm md:text-base text-white/90'>
                                {answer.answerText}
                              </span>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Hiển thị đáp án khi host yêu cầu */}
          <AnimatePresence>
            {activity.hostShowAnswer && !isAnswered && (
              <motion.div
                className='mb-4 md:mb-6 p-3 md:p-4 rounded-xl bg-[#0e2838]/50 border border-white/10'
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              >
                <div className='flex items-center gap-2 mb-2 md:mb-3'>
                  <div className='flex items-center gap-2 text-[#aef359]'>
                    <CheckCircle className='h-4 w-4 md:h-5 md:w-5' />
                    <span className='text-sm md:text-base font-semibold'>
                      Thứ tự đúng:
                    </span>
                  </div>
                </div>
                <div className='mt-1 md:mt-2 space-y-1 md:space-y-2'>
                  {correctOrder.map((id, idx) => {
                    const answer = activity.quiz.quizAnswers.find(
                      (a) => a.quizAnswerId === id
                    )!;
                    return (
                      <motion.div
                        key={id}
                        className='p-2 md:p-3 bg-gradient-to-r from-[#0f2231]/80 to-[#102942]/80 backdrop-blur-sm rounded-xl border border-[#aef359]/20 shadow-md relative overflow-hidden'
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                      >
                        <div className='absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#aef359]/30 to-transparent' />
                        <div className='flex items-center gap-2'>
                          <div className='h-5 w-5 md:h-6 md:w-6 rounded-full bg-[#aef359]/20 flex items-center justify-center'>
                            <span className='text-[10px] md:text-xs text-[#aef359]'>
                              {idx + 1}
                            </span>
                          </div>
                          <span className='text-sm md:text-base text-white/90'>
                            {answer.answerText}
                          </span>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div
            className='space-y-3 md:space-y-4'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {/* DnD list */}
            <div className='bg-[#0e2838]/30 p-1 md:p-2 rounded-xl border border-white/5'>
              <SortableList items={items} onChange={setItems} />
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Button
                onClick={handleSubmit}
                disabled={
                  isSubmitting ||
                  isAnswered ||
                  timeLeft === 0 ||
                  activity.hostShowAnswer
                }
                className={`w-full py-3 md:py-5 text-base md:text-lg font-semibold rounded-xl flex items-center justify-center gap-2 ${
                  isSubmitting ||
                  isAnswered ||
                  timeLeft === 0 ||
                  activity.hostShowAnswer
                    ? 'bg-[#0e2838]/50 text-white/50 cursor-not-allowed'
                    : 'bg-gradient-to-r from-[#aef359] to-[#e4f88d] text-[#0e1c26] hover:from-[#9ee348] hover:to-[#d3e87c] hover:shadow-lg hover:shadow-[#aef359]/20'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className='h-4 w-4 md:h-5 md:w-5 animate-spin' />
                    <span>Đang gửi...</span>
                  </>
                ) : isAnswered ? (
                  'Đã gửi câu trả lời'
                ) : timeLeft === 0 ? (
                  'Hết thời gian'
                ) : (
                  <>
                    <span>Gửi câu trả lời</span>
                    <ArrowRight className='h-4 w-4 md:h-5 md:w-5' />
                  </>
                )}
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </Card>
    </div>
  );
};
