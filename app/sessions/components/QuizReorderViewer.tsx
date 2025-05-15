'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
  isParticipating?: boolean;
}

export const QuizReorderViewer = ({
  activity,
  sessionId,
  sessionWebSocket,
  isParticipating = true,
}: QuizReorderViewerProps) => {
  const [items, setItems] = useState<Item[]>([]);
  const [timeLeft, setTimeLeft] = useState(activity.quiz.timeLimitSeconds);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [totalParticipants, setTotalParticipants] = useState(0);
  const [isQuizEnded, setIsQuizEnded] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

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

  // Thêm useEffect để kiểm tra khi nào quiz kết thúc
  useEffect(() => {
    // Quiz kết thúc khi hết thời gian hoặc tất cả đã trả lời
    if (
      timeLeft <= 0 ||
      (answeredCount > 0 && answeredCount >= totalParticipants)
    ) {
      setIsQuizEnded(true);

      // Nếu đã submit rồi và quiz vừa mới kết thúc, hiển thị kết quả
      if (isSubmitted && !isQuizEnded) {
        // Đã submit và vừa kết thúc, hiển thị kết quả
        const userOrder = items.map((i) => i.id);
        const correct =
          JSON.stringify(userOrder) === JSON.stringify(correctOrder);
        setIsCorrect(correct);
      }
    }
  }, [
    timeLeft,
    answeredCount,
    totalParticipants,
    isSubmitted,
    isQuizEnded,
    items,
    correctOrder,
  ]);

  // Cập nhật participants từ WebSocket
  useEffect(() => {
    if (!sessionWebSocket) return;

    console.log('[QuizReorder] Khởi tạo cập nhật số người tham gia');

    // Hàm cập nhật responseRatio - lấy trực tiếp từ WebSocket
    const updateResponseRatio = () => {
      // Lấy giá trị từ WebSocket
      const participantsRatio = sessionWebSocket.getParticipantsEventRatio();

      console.log(
        `[QuizReorder] Số người tham gia đã trả lời: ${participantsRatio.count}/${participantsRatio.total} (${participantsRatio.percentage}%)`
      );

      // Cập nhật số lượng đếm
      setAnsweredCount(participantsRatio.count);
      setTotalParticipants(participantsRatio.total);
    };

    // Cập nhật ban đầu
    updateResponseRatio();

    // Thiết lập interval để cập nhật liên tục
    const intervalId = setInterval(updateResponseRatio, 2000);

    // Đăng ký lắng nghe sự kiện participants update từ WebSocket
    sessionWebSocket.onParticipantsUpdateHandler(() => {
      updateResponseRatio();
    });

    return () => {
      console.log('[QuizReorder] Dọn dẹp cập nhật số người tham gia');
      clearInterval(intervalId);
    };
  }, [sessionWebSocket]);

  // Chuyển handleSubmit thành useCallback
  const handleSubmit = useCallback(async () => {
    if (isSubmitting || isAnswered || isQuizEnded) return;
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
      setIsSubmitted(true);
    } catch (e) {
      setError('Không thể gửi câu trả lời. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  }, [
    isSubmitting,
    isAnswered,
    isQuizEnded,
    items,
    sessionWebSocket,
    sessionId,
    activity.activityId,
    correctOrder,
  ]);

  // Cải thiện logic đếm ngược và tự động submit khi hết thời gian
  useEffect(() => {
    if (timeLeft <= 0) {
      // Khi hết thời gian, đánh dấu quiz kết thúc
      setIsQuizEnded(true);

      // Tự động submit câu trả lời nếu đã sắp xếp nhưng chưa gửi
      if (items.length > 0 && !isSubmitted && !isSubmitting) {
        console.log('[QuizReorderViewer] Tự động gửi đáp án khi hết thời gian');
        handleSubmit();
      }

      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, items, isSubmitted, isSubmitting, handleSubmit]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <div className='min-h-full bg-transparent'>
      <Card className='bg-black bg-opacity-30 backdrop-blur-md shadow-xl border border-white/5 text-white overflow-hidden'>
        {/* Header với thời gian và tiến trình */}
        <motion.div
          className='rounded-t-xl flex flex-col shadow-md relative overflow-hidden'
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
          <div className='absolute inset-0 bg-black bg-opacity-30' />

          {/* Status Bar */}
          <div className='sticky top-0 left-0 right-0 h-12 bg-black bg-opacity-40 backdrop-blur-sm border-b border-white/5 flex items-center justify-between px-3 md:px-5 text-white z-20'>
            <div className='flex items-center gap-2 md:gap-3'>
              <div className='h-6 w-6 md:h-7 md:w-7 rounded-full bg-[rgb(198,234,132)] flex items-center justify-center shadow-md'>
                <ArrowUpDown className='h-3 w-3 md:h-4 md:w-4 text-black' />
              </div>
              <div className='text-xs capitalize font-medium text-white/80'>
                Reorder Quiz
              </div>
            </div>
            <div className='flex items-center gap-1 md:gap-2'>
              <motion.div
                className='flex items-center gap-1 md:gap-1.5 bg-black bg-opacity-30 border border-white/10 px-2 py-1 rounded-full text-[10px] md:text-xs font-medium'
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
                <Clock className='h-3 w-3 md:h-3.5 md:w-3.5 text-[rgb(198,234,132)]' />
                <span
                  className={timeLeft < 10 ? 'text-red-300' : 'text-white/90'}
                >
                  {formatTime(timeLeft)}
                </span>
              </motion.div>

              {/* Thêm hiển thị số người đã trả lời */}
              {sessionWebSocket && (
                <motion.div
                  key={`${answeredCount}-${totalParticipants}`}
                  className={`
                    flex items-center gap-1 md:gap-1.5 mr-1 md:mr-2 ${answeredCount >= totalParticipants
                      ? 'bg-black bg-opacity-30 border-[rgb(198,234,132)]/30 shadow-[rgb(198,234,132)]/10'
                      : 'bg-black bg-opacity-30 border-[rgb(255,198,121)]/30 shadow-[rgb(255,198,121)]/10'
                    } border border-white/10 px-2 py-1 rounded-full text-[10px] md:text-xs font-medium`}
                  animate={{
                    scale: answeredCount > 0 ? [1, 1.15, 1] : 1,
                    transition: { duration: 0.5 },
                  }}
                >
                  <Users className='h-3 w-3 md:h-3.5 md:w-3.5 text-[rgb(198,234,132)]' />
                  <span
                    className={
                      answeredCount >= totalParticipants
                        ? 'text-[rgb(198,234,132)]'
                        : 'text-[rgb(255,198,121)]'
                    }
                  >
                    {answeredCount}
                  </span>
                  <span className='text-white/50'>/{totalParticipants}</span>
                  <span className='ml-1 text-[9px] md:text-xs opacity-75'>
                    (
                    {Math.round(
                      (answeredCount / Math.max(1, totalParticipants)) * 100
                    )}
                    %)
                  </span>
                </motion.div>
              )}
            </div>
          </div>

          {/* Question Text */}
          <div className='flex flex-col items-center z-10 px-3 md:px-5 py-5 md:py-7'>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className='w-full flex flex-col items-center justify-center'
            >
              <h2 className='text-sm md:text-lg lg:text-xl font-bold text-center text-white drop-shadow-lg'>
                {activity.quiz.questionText}
              </h2>
              {activity.description && (
                <p className='mt-1 text-xs md:text-sm text-white/80 text-center'>
                  {activity.description}
                </p>
              )}
            </motion.div>
          </div>
        </motion.div>

        {/* Progress Bars */}
        <div className='w-full'>
          {/* Time Progress */}
          <motion.div
            className='h-1 bg-[rgb(198,234,132)]'
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
            className='h-1 bg-[rgb(213,189,255)]'
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
        <div className='p-3 md:p-6 bg-black bg-opacity-20'>
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

          {/* Thông báo đã gửi câu trả lời khi submit nhưng chưa kết thúc quiz */}
          {isAnswered && !isQuizEnded && (<motion.div
            className='mt-6 p-4 rounded-xl bg-black bg-opacity-30 border border-[rgb(198,234,132)]/30 text-white/90'
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className='flex items-center gap-2 mb-2 text-[rgb(198,234,132)]'>
              <CheckCircle className='h-5 w-5' />
              <span className='font-semibold'>Đã gửi câu trả lời!</span>
            </div>
            <p className='text-white/70'>
              Câu trả lời của bạn đã được ghi nhận. Kết quả sẽ được hiển thị
              khi tất cả người tham gia đã trả lời hoặc hết thời gian.
            </p>
          </motion.div>
          )}

          {/* Results */}
          <AnimatePresence>
            {(isSubmitted && isQuizEnded) ||
              activity.hostShowAnswer ||
              isQuizEnded ? (
              <motion.div
                className='mt-6 p-4 rounded-xl bg-black bg-opacity-30 border border-white/10'
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              >
                {activity.hostShowAnswer && !isSubmitted ? (
                  <div>
                    <div className='flex items-center gap-2 mb-3 text-[rgb(198,234,132)]'>
                      <CheckCircle className='h-5 w-5' />
                      <span className='font-semibold'>Đáp án chính xác:</span>
                    </div>
                    <div className='space-y-2'>
                      {correctOrder.map((id, idx) => {
                        const answer = activity.quiz.quizAnswers.find(
                          (a) => a.quizAnswerId === id
                        );
                        return (
                          <div
                            key={idx}
                            className='flex items-start gap-2 text-white/80'
                          >
                            <div className='mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-[rgb(198,234,132)]'></div>
                            <p>{answer?.answerText || ''}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : isQuizEnded && !isSubmitted ? (
                  <div>
                    <div className='mt-3'>
                      <p className='font-medium text-white/90 mb-2'>
                        Thứ tự đúng:
                      </p>
                      {correctOrder.map((id, idx) => {
                        const answer = activity.quiz.quizAnswers.find(
                          (a) => a.quizAnswerId === id
                        );
                        return (
                          <div
                            key={idx}
                            className='flex items-start gap-2 text-white/80'
                          >
                            <div className='mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-[rgb(198,234,132)]'></div>
                            <p>{answer?.answerText || ''}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <>
                    <div className='flex items-center gap-2 mb-3'>
                      <div className='flex items-center gap-2'>
                        {isCorrect ? (
                          <CheckCircle className='h-5 w-5 text-[rgb(198,234,132)]' />
                        ) : (
                          <XCircle className='h-5 w-5 text-[rgb(255,182,193)]' />
                        )}
                        <span
                          className={`font-semibold ${isCorrect ? 'text-[rgb(198,234,132)]' : 'text-[rgb(255,182,193)]'
                            }`}
                        >
                          {isCorrect ? 'Đúng' : 'Sai'}
                        </span>
                      </div>
                    </div>

                    <div className='space-y-2'>
                      <p className='font-medium text-white/90 mb-2'>
                        Thứ tự đúng:
                      </p>
                      {correctOrder.map((id, idx) => {
                        const answer = activity.quiz.quizAnswers.find(
                          (a) => a.quizAnswerId === id
                        );
                        return (
                          <div
                            key={idx}
                            className='flex items-start gap-2 text-white/80'
                          >
                            <div className='mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-[rgb(198,234,132)]'></div>
                            <p>{answer?.answerText || ''}</p>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </motion.div>
            ) : null}
          </AnimatePresence>

          <motion.div
            className='space-y-3 md:space-y-4'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {/* DnD list */}
            <div className='bg-black bg-opacity-30 p-1 md:p-2 rounded-xl border border-white/5'>
              <SortableList
                items={items}
                onChange={setItems}
                disabled={isAnswered || isQuizEnded}
              />
            </div>

            {/* Submit Button */}
            {!isSubmitted && isParticipating && (
              <motion.div
                className='mt-6 w-full'
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Button
                  className='w-full px-8 py-6 text-lg font-bold bg-[rgb(198,234,132)] hover:bg-[rgb(198,234,132)]/90 text-black shadow-lg flex items-center justify-center gap-2'
                  disabled={isSubmitting || timeLeft <= 0}
                  onClick={handleSubmit}
                >
                  {isSubmitting ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{
                          repeat: Infinity,
                          duration: 1,
                          ease: 'linear',
                        }}
                      >
                        <Loader2 className='h-5 w-5' />
                      </motion.div>
                      <span>Đang gửi...</span>
                    </>
                  ) : (
                    <>
                      <span>Gửi câu trả lời</span>
                      <ArrowRight className='h-5 w-5' />
                    </>
                  )}
                </Button>
              </motion.div>
            )}
          </motion.div>
        </div>
      </Card>
    </div>
  );
};
