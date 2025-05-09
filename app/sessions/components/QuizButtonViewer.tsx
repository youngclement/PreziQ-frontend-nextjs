'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { SessionWebSocket } from '@/websocket/sessionWebSocket';
import { motion } from 'framer-motion';
import { Clock, CheckCircle, Radio } from 'lucide-react';

interface QuizAnswer {
  quizAnswerId: string;
  answerText: string;
  isCorrect: boolean;
  explanation: string;
  orderIndex: number;
}

interface Quiz {
  quizId: string;
  questionText: string;
  timeLimitSeconds: number;
  pointType: string;
  quizAnswers: QuizAnswer[];
}

interface QuizActivityProps {
  activity: {
    activityId: string;
    activityType: string;
    title: string;
    description: string;
    backgroundColor?: string;
    backgroundImage?: string;
    customBackgroundMusic?: string;
    quiz: Quiz;
  };
  sessionId?: string;
  sessionCode?: string;
  onAnswerSubmit?: (answerId: string) => void;
  sessionWebSocket?: SessionWebSocket;
}

const QuizButtonViewer: React.FC<QuizActivityProps> = ({
  activity,
  sessionId,
  sessionCode,
  onAnswerSubmit,
  sessionWebSocket,
}) => {
  const [selectedAnswerId, setSelectedAnswerId] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(
    activity.quiz.timeLimitSeconds
  );
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (timeRemaining <= 0) {
      return;
    }

    const timer = setInterval(() => {
      setTimeRemaining((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining]);

  const handleSelectAnswer = (answerId: string) => {
    if (isSubmitted) return;
    setSelectedAnswerId(answerId);
  };

  const handleSubmit = async () => {
    if (!selectedAnswerId || isSubmitted) return;
    setIsSubmitted(true);
    setSubmitError(null);

    if (onAnswerSubmit) {
      onAnswerSubmit(selectedAnswerId);
    }

    if (sessionWebSocket) {
      try {
        if (!sessionCode && !sessionId) {
          console.warn('Thiếu cả sessionCode và sessionId');
          setSubmitError('Không thể xác định phiên. Vui lòng thử lại.');
          return;
        }

        const payload = {
          sessionCode: sessionCode,
          activityId: activity.activityId,
          answerContent: selectedAnswerId,
        };

        await sessionWebSocket.submitActivity(payload);

        console.log('Đã gửi câu trả lời:', payload);
      } catch (error) {
        console.error('Lỗi khi gửi câu trả lời:', error);
        setSubmitError('Không thể gửi câu trả lời. Vui lòng thử lại.');
      }
    } else {
      console.warn('Không có kết nối WebSocket');
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs
      .toString()
      .padStart(2, '0')}`;
  };

  const progressPercentage = Math.max(
    0,
    Math.min(100, (timeRemaining / activity.quiz.timeLimitSeconds) * 100)
  );

  // Thêm các hàm helper từ question-preview
  const getOptionStyle = (index: number) => {
    const styles = [
      {
        bg: 'bg-gradient-to-r from-pink-600 via-rose-500 to-rose-700',
        border: 'border-pink-200 dark:border-pink-900',
        shadow: 'shadow-pink-200/40 dark:shadow-pink-900/20',
      },
      {
        bg: 'bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-700',
        border: 'border-blue-200 dark:border-blue-900',
        shadow: 'shadow-blue-200/40 dark:shadow-blue-900/20',
      },
      {
        bg: 'bg-gradient-to-r from-green-600 via-emerald-500 to-emerald-700',
        border: 'border-green-200 dark:border-green-900',
        shadow: 'shadow-green-200/40 dark:shadow-green-900/20',
      },
      {
        bg: 'bg-gradient-to-r from-amber-600 via-orange-500 to-orange-700',
        border: 'border-amber-200 dark:border-amber-900',
        shadow: 'shadow-amber-200/40 dark:shadow-amber-900/20',
      },
      {
        bg: 'bg-gradient-to-r from-purple-600 via-violet-500 to-violet-700',
        border: 'border-purple-200 dark:border-purple-900',
        shadow: 'shadow-purple-200/40 dark:shadow-purple-900/20',
      },
      {
        bg: 'bg-gradient-to-r from-cyan-600 via-sky-500 to-sky-700',
        border: 'border-cyan-200 dark:border-cyan-900',
        shadow: 'shadow-cyan-200/40 dark:shadow-cyan-900/20',
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
              <div className='h-7 w-7 rounded-full bg-blue-500 flex items-center justify-center shadow-sm'>
                <Radio className='h-4 w-4' />
              </div>
              <div className='text-xs capitalize font-medium'>
                Multiple Choice
              </div>
            </div>
            <div className='flex items-center gap-2'>
              <div className='flex items-center gap-1.5 bg-primary px-2 py-1 rounded-full text-xs font-medium'>
                <Clock className='h-3.5 w-3.5' />
                {formatTime(timeRemaining)}
              </div>
            </div>
          </div>

          {/* Question Text */}
          <div className='flex-1 flex flex-col items-center justify-center z-10 py-6 px-5'>
            <h2 className='text-xl md:text-2xl font-bold text-center max-w-2xl text-white drop-shadow-sm px-4'>
              {activity.quiz.questionText}
            </h2>
          </div>
        </motion.div>

        {/* Progress Bar */}
        <div className='w-full h-1 bg-gray-200'>
          <motion.div
            className='h-full bg-primary'
            initial={{ width: '100%' }}
            animate={{ width: `${progressPercentage}%` }}
            transition={{ duration: 0.1 }}
          />
        </div>

        {/* Options */}
        <div className='p-4 bg-white dark:bg-gray-800'>
          <div className={`grid grid-cols-1 md:grid-cols-2 gap-3`}>
            {activity.quiz.quizAnswers
              .sort((a, b) => a.orderIndex - b.orderIndex)
              .map((answer, index) => {
                const optionLetter = ['A', 'B', 'C', 'D', 'E', 'F'][index];
                const optionStyle = getOptionStyle(index);
                const isSelected = selectedAnswerId === answer.quizAnswerId;
                const isCorrect = isSubmitted && answer.isCorrect;

                return (
                  <motion.div
                    key={answer.quizAnswerId}
                    className='group rounded-lg transition-all duration-300 overflow-hidden'
                    whileHover={{ scale: !isSubmitted ? 1.02 : 1 }}
                    whileTap={{ scale: !isSubmitted ? 0.98 : 1 }}
                    onClick={() =>
                      !isSubmitted && handleSelectAnswer(answer.quizAnswerId)
                    }
                  >
                    <div
                      className={`
                      p-4 h-full rounded-lg border-2 flex items-center gap-4 transition-all duration-300 relative
                      backdrop-blur-lg shadow-xl cursor-pointer
                      ${
                        isSubmitted && isCorrect
                          ? 'bg-green-50/80 dark:bg-green-950/40 border-green-300 dark:border-green-800/80'
                          : isSubmitted && isSelected && !isCorrect
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
                        {optionLetter}
                      </div>

                      <div className='flex-1 flex items-center justify-between relative z-10'>
                        <span className='text-base text-gray-800 dark:text-gray-100'>
                          {answer.answerText}
                        </span>

                        {isSubmitted && isCorrect && (
                          <div className='flex-shrink-0 bg-gradient-to-r from-green-500 via-emerald-400 to-emerald-600 text-white rounded-full p-1.5 shadow-lg border border-white/30'>
                            <CheckCircle className='h-4 w-4' />
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
          </div>

          {/* Submit Button */}
          {!isSubmitted && (
            <motion.div
              className='mt-6'
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Button
                className='w-full py-6 text-lg font-semibold'
                disabled={!selectedAnswerId}
                onClick={handleSubmit}
              >
                Gửi câu trả lời
              </Button>
            </motion.div>
          )}

          {/* Error Message */}
          {submitError && (
            <motion.div
              className='mt-4 p-3 text-sm bg-red-100 text-red-800 rounded-md'
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {submitError}
            </motion.div>
          )}

          {/* Explanation */}
          {isSubmitted && selectedAnswerId && (
            <motion.div
              className='mt-6 p-4 rounded-lg bg-gray-50 dark:bg-gray-900/50'
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className='flex items-center gap-2 mb-2'>
                {activity.quiz.quizAnswers.find(
                  (a) => a.quizAnswerId === selectedAnswerId
                )?.isCorrect ? (
                  <div className='flex items-center gap-2 text-green-600'>
                    <CheckCircle className='h-5 w-5' />
                    <span className='font-semibold'>Chính xác!</span>
                  </div>
                ) : (
                  <div className='flex items-center gap-2 text-red-600'>
                    <CheckCircle className='h-5 w-5' />
                    <span className='font-semibold'>Chưa chính xác</span>
                  </div>
                )}
              </div>
              <p className='text-gray-600 dark:text-gray-300'>
                {
                  activity.quiz.quizAnswers.find(
                    (a) => a.quizAnswerId === selectedAnswerId
                  )?.explanation
                }
              </p>
            </motion.div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default QuizButtonViewer;
