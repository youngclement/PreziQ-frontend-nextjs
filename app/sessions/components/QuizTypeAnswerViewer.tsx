'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { SessionWebSocket } from '@/websocket/sessionWebSocket';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock,
  CheckCircle,
  XCircle,
  Users,
  Type,
  Loader2,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';

interface QuizTypeAnswerViewerProps {
  activity: {
    activityId: string;
    title: string;
    description: string;
    backgroundColor?: string;
    backgroundImage?: string;
    hostShowAnswer?: boolean;
    quiz: {
      questionText: string;
      timeLimitSeconds: number;
      quizAnswers: {
        answerText: string;
        isCorrect: boolean;
      }[];
    };
  };
  sessionId: string;
  sessionWebSocket: SessionWebSocket;
  isParticipating?: boolean;
}

export default function QuizTypeAnswerViewer({
  activity,
  sessionId,
  sessionWebSocket,
  isParticipating = true,
}: QuizTypeAnswerViewerProps) {
  const [answer, setAnswer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(activity.quiz.timeLimitSeconds);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [totalParticipants, setTotalParticipants] = useState(0);
  const [isQuizEnded, setIsQuizEnded] = useState(false);

  const handleSubmit = useCallback(async () => {
    if (!answer.trim() || isSubmitting || isAnswered || isQuizEnded) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await sessionWebSocket.submitActivity({
        sessionId,
        activityId: activity.activityId,
        answerContent: answer.trim(),
      });
      setIsAnswered(true);

      // Kiểm tra câu trả lời
      const correctAnswer = activity.quiz.quizAnswers.find((a) => a.isCorrect);
      if (correctAnswer) {
        const isAnswerCorrect =
          answer.trim().toLowerCase() ===
          correctAnswer.answerText.toLowerCase();
        setIsCorrect(isAnswerCorrect);
      }
    } catch (err) {
      setError('Không thể gửi câu trả lời. Vui lòng thử lại.');
      console.error('Error submitting answer:', err);
    } finally {
      setIsSubmitting(false);
    }
  }, [
    answer,
    isSubmitting,
    isAnswered,
    isQuizEnded,
    sessionWebSocket,
    sessionId,
    activity.activityId,
    activity.quiz.quizAnswers,
  ]);

  useEffect(() => {
    if (timeLeft <= 0) {
      // Khi hết thời gian, đánh dấu quiz kết thúc
      setIsQuizEnded(true);

      // Tự động submit câu trả lời nếu đã nhập nhưng chưa gửi
      if (answer.trim() && !isAnswered && !isSubmitting) {
        console.log(
          '[QuizTypeAnswerViewer] Tự động gửi đáp án khi hết thời gian'
        );
        handleSubmit();
      }

      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, answer, isAnswered, isSubmitting, handleSubmit]);

  // Thêm useEffect mới để kiểm tra khi nào quiz kết thúc
  useEffect(() => {
    // Quiz kết thúc khi hết thời gian hoặc tất cả đã trả lời
    if (
      timeLeft <= 0 ||
      (answeredCount > 0 && answeredCount >= totalParticipants)
    ) {
      setIsQuizEnded(true);
    }
  }, [timeLeft, answeredCount, totalParticipants]);

  useEffect(() => {
    if (!sessionWebSocket) return;

    console.log('[QuizTypeAnswer] Khởi tạo cập nhật số người tham gia');

    // Hàm cập nhật responseRatio - lấy trực tiếp từ WebSocket
    const updateResponseRatio = () => {
      // Lấy giá trị từ WebSocket
      const participantsRatio = sessionWebSocket.getParticipantsEventRatio();

      console.log(
        `[QuizTypeAnswer] Số người tham gia đã trả lời: ${participantsRatio.count}/${participantsRatio.total} (${participantsRatio.percentage}%)`
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
      console.log('[QuizTypeAnswer] Dọn dẹp cập nhật số người tham gia');
      clearInterval(intervalId);
    };
  }, [sessionWebSocket]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className='min-h-full bg-transparent'>
      <Card className='bg-[#0e1c26]/80 backdrop-blur-md shadow-xl border border-white/5 text-white overflow-hidden'>
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
          <div className='absolute inset-0 bg-gradient-to-b from-[#0a1b25]/80 to-[#0f2231]/70' />

          {/* Status Bar */}
          <div className='sticky top-0 left-0 right-0 h-12 bg-[#0e1c26]/80 backdrop-blur-sm border-b border-white/5 flex items-center justify-between px-5 text-white z-20'>
            <div className='flex items-center gap-3'>
              <div className='h-7 w-7 rounded-full bg-gradient-to-r from-[#aef359] to-[#e4f88d] flex items-center justify-center shadow-md'>
                <Type className='h-4 w-4 text-[#0e1c26]' />
              </div>
              <div className='text-xs capitalize font-medium text-white/80'>
                Type Answer
              </div>
            </div>
            <div className='flex items-center gap-2'>
              <motion.div
                className='flex items-center gap-1.5 bg-[#0e2838]/80 border border-white/10 px-2 py-1 rounded-full text-xs font-medium'
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
                <Clock className='h-3.5 w-3.5 text-[#aef359]' />
                <span
                  className={timeLeft < 10 ? 'text-red-300' : 'text-white/90'}
                >
                  {formatTime(timeLeft)}
                </span>
              </motion.div>
              {sessionWebSocket && (
                <motion.div
                  key={`${answeredCount}-${totalParticipants}`}
                  className={`
                    flex items-center gap-1.5 mr-2 ${
                      answeredCount >= totalParticipants
                        ? 'bg-[#0e2838]/80 border-[#aef359]/30 shadow-[#aef359]/10'
                        : 'bg-[#0e2838]/80 border-amber-500/30 shadow-amber-500/10'
                    } border border-white/10 px-2 py-1 rounded-full text-xs font-medium`}
                  animate={{
                    scale: answeredCount > 0 ? [1, 1.15, 1] : 1,
                    transition: { duration: 0.5 },
                  }}
                >
                  <Users className='h-3.5 w-3.5 text-[#aef359]' />
                  <span
                    className={
                      answeredCount >= totalParticipants
                        ? 'text-[#aef359]'
                        : 'text-amber-400'
                    }
                  >
                    {answeredCount}
                  </span>
                  <span className='text-white/50'>/{totalParticipants}</span>
                  <span className='ml-1 text-xs opacity-75'>
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
          <div className='flex flex-col items-center z-10 px-4 md:px-6 py-6 md:py-8'>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className='w-full flex flex-col items-center justify-center'
            >
              <h2 className='text-base md:text-xl lg:text-2xl font-bold text-center text-white drop-shadow-lg'>
                {activity.quiz.questionText}
              </h2>
              {activity.description && (
                <p className='mt-2 text-xs md:text-sm text-white/80 text-center'>
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
        <div className='p-6 bg-[#0e1c26]/70'>
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

          <motion.div
            className='space-y-4'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className='relative'>
              <motion.div
                className='absolute inset-y-0 left-0 w-10 flex items-center justify-center text-[#aef359] pl-3'
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <Type className='h-5 w-5' />
              </motion.div>

              <Input
                type='text'
                placeholder='Nhập câu trả lời của bạn...'
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                disabled={isSubmitting || isAnswered || isQuizEnded}
                className='w-full h-14 text-lg pl-12 pr-4 bg-[#0e2838]/90 border-2 border-white/10 focus:border-[#aef359]/50 rounded-xl shadow-lg backdrop-blur-lg transition-all duration-300 focus:ring-2 focus:ring-[#aef359]/20 text-white/90 placeholder:text-white/50'
                onKeyDown={(e) => {
                  if (
                    e.key === 'Enter' &&
                    !isSubmitting &&
                    !isAnswered &&
                    !isQuizEnded &&
                    answer.trim()
                  ) {
                    handleSubmit();
                  }
                }}
              />

              {/* Decorative light effect */}
              <div className='absolute inset-0 bg-[radial-gradient(circle_at_0%_100%,rgba(174,243,89,0.05),transparent_70%)] opacity-50 pointer-events-none rounded-xl' />

              {/* Top border highlight */}
              <div className='absolute top-0 left-5 right-5 h-px bg-gradient-to-r from-transparent via-[#aef359]/30 to-transparent' />
            </div>

            {/* Submit Button */}
            {answer.trim() && !isAnswered && isParticipating && (
              <motion.div
                className='mt-6 w-full'
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Button
                  className='w-full px-8 py-6 text-lg font-bold bg-gradient-to-r from-[#aef359] to-[#e4f88d] hover:from-[#9ee348] hover:to-[#d3e87c] text-slate-900 shadow-lg flex items-center justify-center gap-2'
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

            {/* Thông báo đã gửi câu trả lời khi submit nhưng chưa kết thúc quiz */}
            {isAnswered && !isQuizEnded && (
              <motion.div
                className='mt-6 p-4 rounded-xl bg-[#0e2838]/50 border border-[#aef359]/30 text-white/90'
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className='flex items-center gap-2 mb-2 text-[#aef359]'>
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
              {(isQuizEnded && isAnswered) ||
              activity.hostShowAnswer ||
              isQuizEnded ? (
                <motion.div
                  className='mt-6 p-4 rounded-xl bg-[#0e2838]/50 border border-white/10'
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                >
                  {activity.hostShowAnswer && !isAnswered ? (
                    <div>
                      <div className='flex items-center gap-2 mb-3 text-[#aef359]'>
                        <CheckCircle className='h-5 w-5' />
                        <span className='font-semibold'>Đáp án chính xác:</span>
                      </div>
                      <div className='space-y-2'>
                        {activity.quiz.quizAnswers
                          .filter((answer) => answer.isCorrect)
                          .map((answer, idx) => (
                            <div
                              key={idx}
                              className='flex items-center gap-2 text-white/80'
                            >
                              <div className='h-2 w-2 rounded-full bg-[#aef359]'></div>
                              <p className='font-medium text-[#aef359]'>
                                {answer.answerText}
                              </p>
                            </div>
                          ))}
                      </div>
                    </div>
                  ) : isQuizEnded && !isAnswered ? (
                    <div>
                      <div className='flex items-center gap-2 mb-3 text-[#aef359]'>
                        <CheckCircle className='h-5 w-5' />
                        <span className='font-semibold'>Đáp án chính xác:</span>
                      </div>
                      <div className='space-y-2'>
                        {activity.quiz.quizAnswers
                          .filter((answer) => answer.isCorrect)
                          .map((answer, idx) => (
                            <div
                              key={idx}
                              className='flex items-center gap-2 text-white/80'
                            >
                              <div className='h-2 w-2 rounded-full bg-[#aef359]'></div>
                              <p className='font-medium text-[#aef359]'>
                                {answer.answerText}
                              </p>
                            </div>
                          ))}
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className='flex items-center gap-2 mb-3'>
                        <div className='flex items-center gap-2'>
                          {isCorrect ? (
                            <CheckCircle className='h-5 w-5 text-[#aef359]' />
                          ) : (
                            <XCircle className='h-5 w-5 text-red-400' />
                          )}
                          <span
                            className={`font-semibold ${
                              isCorrect ? 'text-[#aef359]' : 'text-red-400'
                            }`}
                          >
                            {isCorrect ? 'Đúng' : 'Sai'}
                          </span>
                        </div>
                      </div>
                      <div className='space-y-2'>
                        <div className='flex items-start gap-2'>
                          <p className='font-medium text-white/70'>
                            Bạn đã trả lời:{' '}
                          </p>
                          <p className='font-medium text-white/90'>{answer}</p>
                        </div>
                        <div className='flex items-start gap-2'>
                          <p className='font-medium text-white/70'>
                            Đáp án đúng:{' '}
                          </p>
                          <p className='font-medium text-[#aef359]'>
                            {activity.quiz.quizAnswers.find((a) => a.isCorrect)
                              ?.answerText || ''}
                          </p>
                        </div>
                      </div>
                    </>
                  )}
                </motion.div>
              ) : null}
            </AnimatePresence>
          </motion.div>
        </div>
      </Card>
    </div>
  );
}
