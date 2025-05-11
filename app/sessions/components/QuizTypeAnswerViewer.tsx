'use client';

import { useState, useEffect } from 'react';
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
}

export default function QuizTypeAnswerViewer({
  activity,
  sessionId,
  sessionWebSocket,
}: QuizTypeAnswerViewerProps) {
  const [answer, setAnswer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(activity.quiz.timeLimitSeconds);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [totalParticipants, setTotalParticipants] = useState(0);

  useEffect(() => {
    if (timeLeft > 0 && !isAnswered) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => Math.max(0, prev - 1));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [timeLeft, isAnswered]);

  useEffect(() => {
    if (!sessionWebSocket) return;

    const handleParticipantsUpdate = (participants: any[]) => {
      setTotalParticipants(participants.length);
      const answered = participants.filter((p) => p.hasAnswered).length;
      setAnsweredCount(answered);
    };

    sessionWebSocket.onParticipantsUpdateHandler(handleParticipantsUpdate);
  }, [sessionWebSocket]);

  const handleSubmit = async () => {
    if (!answer.trim() || isSubmitting || isAnswered) return;

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
  };

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
          className='aspect-[16/4] rounded-t-xl flex flex-col shadow-md relative overflow-hidden'
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
          <div className='absolute top-0 left-0 right-0 h-12 bg-[#0e1c26]/80 backdrop-blur-sm border-b border-white/5 flex items-center justify-between px-5 text-white z-10'>
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
            </div>
          </div>

          {/* Question Text */}
          <div className='flex-1 flex flex-col items-center justify-center z-10 py-8 px-5'>
            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className='text-xl md:text-2xl font-bold text-center max-w-2xl text-white drop-shadow-lg'
            >
              {activity.quiz.questionText}
            </motion.h2>
            {activity.description && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.8 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className='mt-2 text-sm text-white/80 text-center max-w-xl'
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
                disabled={isSubmitting || isAnswered}
                className='w-full h-14 text-lg pl-12 pr-4 bg-[#0e2838]/90 border-2 border-white/10 focus:border-[#aef359]/50 rounded-xl shadow-lg backdrop-blur-lg transition-all duration-300 focus:ring-2 focus:ring-[#aef359]/20 text-white/90 placeholder:text-white/50'
                onKeyDown={(e) => {
                  if (
                    e.key === 'Enter' &&
                    !isSubmitting &&
                    !isAnswered &&
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
            {!isAnswered && !activity.hostShowAnswer && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <Button
                  onClick={handleSubmit}
                  disabled={!answer.trim() || isSubmitting}
                  className={`w-full py-5 text-lg font-semibold rounded-xl flex items-center justify-center gap-2 ${
                    !answer.trim() || isSubmitting
                      ? 'bg-[#0e2838]/50 text-white/50 cursor-not-allowed'
                      : 'bg-gradient-to-r from-[#aef359] to-[#e4f88d] text-[#0e1c26] hover:from-[#9ee348] hover:to-[#d3e87c] hover:shadow-lg hover:shadow-[#aef359]/20'
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className='h-5 w-5 animate-spin' />
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

            {/* Results */}
            <AnimatePresence>
              {(isAnswered || activity.hostShowAnswer) && (
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
                        <span className='font-semibold'>Đáp án đúng:</span>
                      </div>
                      <div className='flex items-center gap-2 text-white/80'>
                        <div className='h-2 w-2 rounded-full bg-[#aef359]'></div>
                        <p>
                          {
                            activity.quiz.quizAnswers.find((a) => a.isCorrect)
                              ?.answerText
                          }
                        </p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className='flex items-center gap-2 mb-3'>
                        {isCorrect ? (
                          <div className='flex items-center gap-2 text-[#aef359]'>
                            <CheckCircle className='h-5 w-5' />
                            <span className='font-semibold'>
                              Câu trả lời đúng!
                            </span>
                          </div>
                        ) : (
                          <div className='flex items-center gap-2 text-red-400'>
                            <XCircle className='h-5 w-5' />
                            <span className='font-semibold'>
                              Câu trả lời chưa đúng
                            </span>
                          </div>
                        )}
                      </div>
                      <p className='text-white/70'>
                        Đáp án đúng là:{' '}
                        <span className='font-medium text-[#aef359]'>
                          {
                            activity.quiz.quizAnswers.find((a) => a.isCorrect)
                              ?.answerText
                          }
                        </span>
                      </p>
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </Card>
    </div>
  );
}
