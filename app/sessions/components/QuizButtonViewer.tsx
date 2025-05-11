'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { SessionWebSocket } from '@/websocket/sessionWebSocket';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock,
  CheckCircle,
  Radio,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';

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
    hostShowAnswer?: boolean;
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
  const getOptionStyle = (
    index: number,
    isSelected: boolean,
    isCorrect: boolean,
    isSubmitted: boolean
  ) => {
    const styles = [
      {
        bg: 'from-pink-500/70 to-rose-600/70',
        bgSelected: 'from-pink-500/90 to-rose-600/90',
        bgCorrect: 'from-green-500/80 to-emerald-600/80',
        bgIncorrect: 'from-red-500/70 to-rose-600/70',
        iconBg: 'bg-gradient-to-r from-pink-600 via-rose-500 to-rose-700',
        glow: '#ff5c8d',
      },
      {
        bg: 'from-blue-500/70 to-indigo-600/70',
        bgSelected: 'from-blue-500/90 to-indigo-600/90',
        bgCorrect: 'from-green-500/80 to-emerald-600/80',
        bgIncorrect: 'from-red-500/70 to-rose-600/70',
        iconBg: 'bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-700',
        glow: '#5c8dff',
      },
      {
        bg: 'from-purple-500/70 to-violet-600/70',
        bgSelected: 'from-purple-500/90 to-violet-600/90',
        bgCorrect: 'from-green-500/80 to-emerald-600/80',
        bgIncorrect: 'from-red-500/70 to-rose-600/70',
        iconBg: 'bg-gradient-to-r from-purple-600 via-violet-500 to-violet-700',
        glow: '#c45cff',
      },
      {
        bg: 'from-amber-500/70 to-orange-600/70',
        bgSelected: 'from-amber-500/90 to-orange-600/90',
        bgCorrect: 'from-green-500/80 to-emerald-600/80',
        bgIncorrect: 'from-red-500/70 to-rose-600/70',
        iconBg: 'bg-gradient-to-r from-amber-600 via-orange-500 to-orange-700',
        glow: '#ffb55c',
      },
    ];

    const baseStyle = styles[index % styles.length];

    if (isSubmitted) {
      if (isCorrect) {
        return {
          bg: `bg-gradient-to-r ${baseStyle.bgCorrect}`,
          glow: '#5cff8d',
        };
      } else if (isSelected) {
        return {
          bg: `bg-gradient-to-r ${baseStyle.bgIncorrect}`,
          glow: '#ff5c5c',
        };
      }
    }

    if (isSelected) {
      return {
        bg: `bg-gradient-to-r ${baseStyle.bgSelected}`,
        glow: baseStyle.glow,
      };
    }

    return {
      bg: `bg-gradient-to-r ${baseStyle.bg}`,
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
                <Radio className='h-4 w-4 text-[#0e1c26]' />
              </div>
              <div className='text-xs capitalize font-medium text-white/80'>
                Multiple Choice
              </div>
            </div>
            <div className='flex items-center gap-2'>
              <motion.div
                className='flex items-center gap-1.5 bg-[#0e2838]/80 border border-white/10 px-2 py-1 rounded-full text-xs font-medium'
                animate={{
                  opacity: timeRemaining < 10 ? [0.7, 1] : 1,
                  scale: timeRemaining < 10 ? [1, 1.05, 1] : 1,
                }}
                transition={{
                  duration: 0.5,
                  repeat: timeRemaining < 10 ? Infinity : 0,
                  repeatType: 'reverse',
                }}
              >
                <Clock className='h-3.5 w-3.5 text-[#aef359]' />
                <span
                  className={
                    timeRemaining < 10 ? 'text-red-300' : 'text-white/90'
                  }
                >
                  {formatTime(timeRemaining)}
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
          </div>
        </motion.div>

        {/* Progress Bar */}
        <div className='w-full h-1 bg-[#0e2838]'>
          <motion.div
            className='h-full bg-gradient-to-r from-[#aef359] to-[#e4f88d]'
            initial={{ width: '100%' }}
            animate={{ width: `${progressPercentage}%` }}
            transition={{ duration: 0.1 }}
          />
        </div>

        {/* Options */}
        <div className='p-6 bg-[#0e1c26]/70'>
          <motion.div
            className={`grid grid-cols-1 md:grid-cols-2 gap-3`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {activity.quiz.quizAnswers
              .sort((a, b) => a.orderIndex - b.orderIndex)
              .map((answer, index) => {
                const optionLetter = ['A', 'B', 'C', 'D', 'E', 'F'][index];
                const isSelected = selectedAnswerId === answer.quizAnswerId;
                const isCorrect = isSubmitted && answer.isCorrect;
                const optionStyle = getOptionStyle(
                  index,
                  isSelected,
                  answer.isCorrect,
                  isSubmitted
                );

                return (
                  <motion.div
                    key={answer.quizAnswerId}
                    whileHover={{ scale: !isSubmitted ? 1.02 : 1 }}
                    whileTap={{ scale: !isSubmitted ? 0.98 : 1 }}
                    className={`relative rounded-xl ${
                      isSelected ? 'z-10' : 'z-0'
                    }`}
                    onClick={() =>
                      !isSubmitted && handleSelectAnswer(answer.quizAnswerId)
                    }
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.1 + index * 0.1 }}
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
                        p-4 h-full rounded-xl border border-white/20
                        backdrop-blur-sm shadow-lg cursor-pointer
                        flex items-center gap-4 transition-all duration-300 relative overflow-hidden
                      `}
                    >
                      {/* Animated background effect */}
                      <div className='absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-70' />
                      <div className='absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent' />

                      {/* Option circle */}
                      <div
                        className={`
                          relative z-10 w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 
                          text-white font-bold shadow-lg border border-white/30
                          bg-[#0e2838] text-[#aef359]
                        `}
                      >
                        {optionLetter}
                      </div>

                      {/* Answer text */}
                      <div className='flex-1 flex items-center justify-between relative z-10'>
                        <span className='text-white/90 font-medium'>
                          {answer.answerText}
                        </span>

                        {isSubmitted && isCorrect && (
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
                            <CheckCircle className='h-4 w-4' />
                          </motion.div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
          </motion.div>

          {/* Submit Button */}
          {!isSubmitted && !activity.hostShowAnswer && (
            <motion.div
              className='mt-6'
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Button
                className={`w-full py-5 text-lg font-semibold rounded-xl ${
                  !selectedAnswerId
                    ? 'bg-[#0e2838]/50 text-white/50 cursor-not-allowed'
                    : 'bg-gradient-to-r from-[#aef359] to-[#e4f88d] text-[#0e1c26] hover:from-[#9ee348] hover:to-[#d3e87c] hover:shadow-lg hover:shadow-[#aef359]/20'
                }`}
                disabled={!selectedAnswerId}
                onClick={handleSubmit}
              >
                <span className='flex items-center gap-2'>
                  Gửi câu trả lời
                  <ArrowRight className='h-5 w-5' />
                </span>
              </Button>
            </motion.div>
          )}

          {/* Error Message */}
          <AnimatePresence>
            {submitError && (
              <motion.div
                className='mt-4 p-3 rounded-xl bg-red-500/20 border border-red-500/30 text-white/90'
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <div className='flex items-center gap-2'>
                  <AlertCircle className='h-5 w-5 text-red-400' />
                  <span>{submitError}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Explanation */}
          <AnimatePresence>
            {(isSubmitted || activity.hostShowAnswer) && (
              <motion.div
                className='mt-6 p-4 rounded-xl bg-[#0e2838]/50 border border-white/10'
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              >
                {activity.hostShowAnswer && !isSubmitted && (
                  <div className='flex items-center gap-2 mb-2 text-[#aef359]'>
                    <CheckCircle className='h-5 w-5' />
                    <span className='font-semibold'>Đáp án chính xác:</span>
                  </div>
                )}

                {isSubmitted && (
                  <div className='flex items-center gap-2 mb-2'>
                    {activity.quiz.quizAnswers.find(
                      (a) => a.quizAnswerId === selectedAnswerId
                    )?.isCorrect ? (
                      <div className='flex items-center gap-2 text-[#aef359]'>
                        <CheckCircle className='h-5 w-5' />
                        <span className='font-semibold'>Chính xác!</span>
                      </div>
                    ) : (
                      <div className='flex items-center gap-2 text-red-400'>
                        <AlertCircle className='h-5 w-5' />
                        <span className='font-semibold'>Chưa chính xác</span>
                      </div>
                    )}
                  </div>
                )}

                {activity.hostShowAnswer && !isSubmitted ? (
                  <div className='space-y-2'>
                    {activity.quiz.quizAnswers
                      .filter((answer) => answer.isCorrect)
                      .map((answer, idx) => (
                        <div
                          key={idx}
                          className='flex items-center gap-2 text-white/80'
                        >
                          <div className='h-2 w-2 rounded-full bg-[#aef359]'></div>
                          <p>{answer.answerText}</p>
                        </div>
                      ))}
                    {activity.quiz.quizAnswers.filter(
                      (answer) => answer.isCorrect
                    )[0]?.explanation && (
                      <p className='text-white/70 mt-2 pt-2 border-t border-white/10'>
                        {
                          activity.quiz.quizAnswers.filter(
                            (answer) => answer.isCorrect
                          )[0].explanation
                        }
                      </p>
                    )}
                  </div>
                ) : (
                  <p className='text-white/70'>
                    {
                      activity.quiz.quizAnswers.find(
                        (a) => a.quizAnswerId === selectedAnswerId
                      )?.explanation
                    }
                  </p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Card>
    </div>
  );
};

export default QuizButtonViewer;
