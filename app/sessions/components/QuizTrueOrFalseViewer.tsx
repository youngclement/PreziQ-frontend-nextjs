'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { SessionWebSocket } from '@/websocket/sessionWebSocket';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock,
  CheckCircle,
  XCircle,
  Users,
  ToggleLeft,
  Loader2,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';

interface QuizTrueOrFalseViewerProps {
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
        quizAnswerId: string;
        answerText: string;
        isCorrect: boolean;
      }[];
    };
  };
  sessionId: string;
  sessionWebSocket: SessionWebSocket;
}

export default function QuizTrueOrFalseViewer({
  activity,
  sessionId,
  sessionWebSocket,
}: QuizTrueOrFalseViewerProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
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
    if (!selectedAnswer || isAnswered) return;
    setIsSubmitting(true);
    setError(null);

    try {
      await sessionWebSocket.submitActivity({
        sessionId,
        activityId: activity.activityId,
        answerContent: selectedAnswer,
      });

      // Kiểm tra câu trả lời
      const correctAnswer = activity.quiz.quizAnswers.find((a) => a.isCorrect);
      if (correctAnswer) {
        const isAnswerCorrect = selectedAnswer === correctAnswer.quizAnswerId;
        setIsCorrect(isAnswerCorrect);
      }

      setIsAnswered(true);
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

  const getOptionStyle = (
    index: number,
    isSelected: boolean,
    isCorrect: boolean,
    isSubmitted: boolean
  ) => {
    const styles = [
      {
        bg: 'from-blue-500/70 to-indigo-600/70',
        bgSelected: 'from-blue-500/90 to-indigo-600/90',
        bgCorrect: 'from-green-500/80 to-emerald-600/80',
        bgIncorrect: 'from-red-500/70 to-rose-600/70',
        text: 'Đúng',
        glow: '#5c8dff',
      },
      {
        bg: 'from-amber-500/70 to-orange-600/70',
        bgSelected: 'from-amber-500/90 to-orange-600/90',
        bgCorrect: 'from-green-500/80 to-emerald-600/80',
        bgIncorrect: 'from-red-500/70 to-rose-600/70',
        text: 'Sai',
        glow: '#ffb55c',
      },
    ];

    const baseStyle = styles[index % styles.length];

    if (isSubmitted) {
      if (isCorrect) {
        return {
          bg: `bg-gradient-to-r ${baseStyle.bgCorrect}`,
          text: baseStyle.text,
          glow: '#5cff8d',
        };
      } else if (isSelected) {
        return {
          bg: `bg-gradient-to-r ${baseStyle.bgIncorrect}`,
          text: baseStyle.text,
          glow: '#ff5c5c',
        };
      }
    }

    if (isSelected) {
      return {
        bg: `bg-gradient-to-r ${baseStyle.bgSelected}`,
        text: baseStyle.text,
        glow: baseStyle.glow,
      };
    }

    return {
      bg: `bg-gradient-to-r ${baseStyle.bg}`,
      text: baseStyle.text,
      glow: baseStyle.glow,
    };
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
                <ToggleLeft className='h-4 w-4 text-[#0e1c26]' />
              </div>
              <div className='text-xs capitalize font-medium text-white/80'>
                True or False
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
            className='h-1 bg-blue-500/70'
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
            className='grid grid-cols-1 md:grid-cols-2 gap-6 mb-6'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {activity.quiz.quizAnswers.map((answer, index) => {
              const isSelected = selectedAnswer === answer.quizAnswerId;
              const isCorrect = isAnswered && answer.isCorrect;
              const optionStyle = getOptionStyle(
                index,
                isSelected,
                answer.isCorrect,
                isAnswered
              );

              return (
                <motion.div
                  key={answer.quizAnswerId}
                  whileHover={{ scale: !isAnswered ? 1.03 : 1 }}
                  whileTap={{ scale: !isAnswered ? 0.97 : 1 }}
                  className={`relative rounded-xl ${
                    isSelected ? 'z-10' : 'z-0'
                  }`}
                  onClick={() =>
                    !isAnswered && setSelectedAnswer(answer.quizAnswerId)
                  }
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.1 + index * 0.2 }}
                >
                  {/* Glow effect */}
                  {isSelected && (
                    <motion.div
                      className='absolute -inset-0.5 rounded-xl blur-sm opacity-50'
                      style={{ background: optionStyle.glow }}
                      animate={{ opacity: [0.5, 0.8, 0.5] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  )}

                  <div
                    className={`
                      ${optionStyle.bg}
                      p-5 h-full rounded-xl border border-white/20
                      backdrop-blur-sm shadow-lg cursor-pointer
                      flex flex-col items-center justify-center transition-all duration-300 relative overflow-hidden
                      min-h-[130px]
                    `}
                  >
                    {/* Animated background effect */}
                    <div className='absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-70' />
                    <div className='absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent' />

                    {/* Answer text */}
                    <div className='relative z-10 flex flex-col items-center gap-3'>
                      <span className='text-2xl font-bold text-white'>
                        {optionStyle.text}
                      </span>

                      {isAnswered && isCorrect && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{
                            type: 'spring',
                            stiffness: 300,
                            damping: 20,
                          }}
                          className='flex-shrink-0 bg-[#aef359] text-[#0e1c26] rounded-full p-1.5 shadow-lg'
                        >
                          <CheckCircle className='h-5 w-5' />
                        </motion.div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>

          {/* Submit Button */}
          {!isAnswered && !activity.hostShowAnswer && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Button
                className={`w-full py-5 text-lg font-semibold rounded-xl flex items-center justify-center gap-2 ${
                  !selectedAnswer || isSubmitting
                    ? 'bg-[#0e2838]/50 text-white/50 cursor-not-allowed'
                    : 'bg-gradient-to-r from-[#aef359] to-[#e4f88d] text-[#0e1c26] hover:from-[#9ee348] hover:to-[#d3e87c] hover:shadow-lg hover:shadow-[#aef359]/20'
                }`}
                disabled={!selectedAnswer || isSubmitting}
                onClick={handleSubmit}
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
                      {
                        activity.quiz.quizAnswers.find((a) => a.isCorrect)
                          ?.answerText
                      }
                    </p>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Card>
    </div>
  );
}
