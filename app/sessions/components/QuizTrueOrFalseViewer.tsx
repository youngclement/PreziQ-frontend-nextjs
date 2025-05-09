'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { SessionWebSocket } from '@/websocket/sessionWebSocket';
import { motion } from 'framer-motion';
import {
  Clock,
  CheckCircle2,
  XCircle,
  Users,
  ToggleLeft,
  Loader2,
} from 'lucide-react';

interface QuizTrueOrFalseViewerProps {
  activity: {
    activityId: string;
    title: string;
    description: string;
    backgroundColor?: string;
    backgroundImage?: string;
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

  const getOptionStyle = (index: number) => {
    const styles = [
      {
        bg: 'bg-gradient-to-r from-green-600 via-emerald-500 to-emerald-700',
        border: 'border-green-200 dark:border-green-900',
        shadow: 'shadow-green-200/40 dark:shadow-green-900/20',
      },
      {
        bg: 'bg-gradient-to-r from-red-600 via-rose-500 to-rose-700',
        border: 'border-red-200 dark:border-red-900',
        shadow: 'shadow-red-200/40 dark:shadow-red-900/20',
      },
    ];
    return styles[index % styles.length];
  };

  return (
    <div className='min-h-screen bg-gray-50 p-4'>
      <Card className='max-w-4xl mx-auto overflow-hidden'>
        {/* Header với thời gian và tiến trình */}
        <motion.div
          className='aspect-[16/5] rounded-t-xl flex flex-col shadow-md relative overflow-hidden'
          style={{
            backgroundImage: activity.backgroundImage
              ? `url(${activity.backgroundImage})`
              : undefined,
            backgroundColor: activity.backgroundColor || '#FFFFFF',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          {/* Overlay */}
          <div className='absolute inset-0 bg-black/30' />

          {/* Status Bar */}
          <div className='absolute top-0 left-0 right-0 h-12 bg-black/40 flex items-center justify-between px-5 text-white z-10'>
            <div className='flex items-center gap-3'>
              <div className='h-7 w-7 rounded-full bg-teal-500 flex items-center justify-center shadow-sm'>
                <ToggleLeft className='h-4 w-4' />
              </div>
              <div className='text-xs capitalize font-medium'>
                True or False
              </div>
            </div>
            <div className='flex items-center gap-2'>
              <div className='flex items-center gap-2 bg-black/60 px-2 py-1 rounded-full text-xs'>
                <Users className='h-3.5 w-3.5' />
                <span>
                  {answeredCount}/{totalParticipants}
                </span>
              </div>
              <div className='flex items-center gap-1.5 bg-primary px-2 py-1 rounded-full text-xs font-medium'>
                <Clock className='h-3.5 w-3.5' />
                {formatTime(timeLeft)}
              </div>
            </div>
          </div>

          {/* Question Text */}
          <div className='flex-1 flex flex-col items-center justify-center z-10 py-6 px-5'>
            <h2 className='text-xl md:text-2xl font-bold text-center max-w-2xl text-white drop-shadow-sm px-4'>
              {activity.quiz.questionText}
            </h2>
            {activity.description && (
              <p className='mt-2 text-sm text-white/80 text-center max-w-xl'>
                {activity.description}
              </p>
            )}
          </div>
        </motion.div>

        {/* Progress Bars */}
        <div className='w-full'>
          {/* Time Progress */}
          <motion.div
            className='h-1 bg-primary'
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
            className='h-1 bg-teal-500'
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
        <div className='p-4 bg-white dark:bg-gray-800'>
          {error && (
            <Alert variant='destructive' className='mb-4'>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
            {activity.quiz.quizAnswers.map((answer, index) => {
              const optionStyle = getOptionStyle(index);
              const isSelected = selectedAnswer === answer.quizAnswerId;
              const isCorrect = isAnswered && answer.isCorrect;

              return (
                <motion.div
                  key={answer.quizAnswerId}
                  className='group rounded-lg transition-all duration-300 overflow-hidden'
                  whileHover={{ scale: !isAnswered ? 1.02 : 1 }}
                  whileTap={{ scale: !isAnswered ? 0.98 : 1 }}
                  onClick={() =>
                    !isAnswered && setSelectedAnswer(answer.quizAnswerId)
                  }
                >
                  <div
                    className={`
                    p-4 h-full rounded-lg border-2 flex items-center gap-4 transition-all duration-300 relative
                    backdrop-blur-lg shadow-xl cursor-pointer
                    ${
                      isAnswered && isCorrect
                        ? 'bg-green-50/80 dark:bg-green-950/40 border-green-300 dark:border-green-800/80'
                        : isAnswered && isSelected && !isCorrect
                        ? 'bg-red-50/80 dark:bg-red-950/40 border-red-300 dark:border-red-800/80'
                        : isSelected
                        ? 'bg-primary/10 border-primary'
                        : 'bg-white/90 dark:bg-gray-900/80 border-gray-200 dark:border-gray-700'
                    }
                  `}
                  >
                    {/* Decorative light effect */}
                    <div className='absolute inset-0 bg-[radial-gradient(circle_at_0%_100%,rgba(255,255,255,0.1),transparent_70%)] opacity-50' />

                    <div
                      className={`
                      relative z-10 w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 
                      text-white font-medium shadow-lg border border-white/30 ${optionStyle.bg}
                    `}
                    >
                      {answer.answerText}
                    </div>

                    <div className='flex-1 flex items-center justify-between relative z-10'>
                      <span className='text-base text-gray-800 dark:text-gray-100'>
                        {answer.answerText}
                      </span>

                      {isAnswered && isCorrect && (
                        <div className='flex-shrink-0 bg-gradient-to-r from-green-500 via-emerald-400 to-emerald-600 text-white rounded-full p-1.5 shadow-lg border border-white/30'>
                          <CheckCircle2 className='h-4 w-4' />
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Submit Button */}
          {!isAnswered && (
            <motion.div
              className='mt-6'
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Button
                className={`w-full h-14 text-lg font-semibold ${
                  isSubmitting || !selectedAnswer
                    ? 'bg-gray-400'
                    : 'bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700'
                }`}
                disabled={!selectedAnswer || isSubmitting}
                onClick={handleSubmit}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className='mr-2 h-5 w-5 animate-spin' />
                    Đang gửi...
                  </>
                ) : (
                  'Gửi câu trả lời'
                )}
              </Button>
            </motion.div>
          )}

          {/* Results */}
          {isAnswered && (
            <motion.div
              className='mt-6 p-4 rounded-lg bg-gray-50 dark:bg-gray-900/50'
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className='flex items-center gap-2 mb-2'>
                {isCorrect ? (
                  <>
                    <CheckCircle2 className='h-5 w-5 text-green-500' />
                    <span className='text-green-500 font-medium'>
                      Câu trả lời đúng!
                    </span>
                  </>
                ) : (
                  <>
                    <XCircle className='h-5 w-5 text-red-500' />
                    <span className='text-red-500 font-medium'>
                      Câu trả lời chưa đúng
                    </span>
                  </>
                )}
              </div>
              <p className='text-gray-600 dark:text-gray-300'>
                Đáp án đúng là:{' '}
                {activity.quiz.quizAnswers.find((a) => a.isCorrect)?.answerText}
              </p>
            </motion.div>
          )}
        </div>
      </Card>
    </div>
  );
}
