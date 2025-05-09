'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Clock, CheckCircle, XCircle, Users, CheckSquare } from 'lucide-react';
import { SessionWebSocket } from '@/websocket/sessionWebSocket';
import { motion } from 'framer-motion';

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
  onAnswerSubmit?: (selectedAnswers: string[]) => void;
  sessionWebSocket?: SessionWebSocket;
}

export default function QuizCheckboxViewer({
  activity,
  sessionId,
  sessionCode,
  onAnswerSubmit,
  sessionWebSocket,
}: QuizActivityProps) {
  const [selectedAnswers, setSelectedAnswers] = useState<string[]>([]);
  const [timeLeft, setTimeLeft] = useState(
    activity?.quiz?.timeLimitSeconds || 20
  );
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [totalParticipants, setTotalParticipants] = useState(0);

  // Reset state when activity changes
  useEffect(() => {
    setSelectedAnswers([]);
    setTimeLeft(activity?.quiz?.timeLimitSeconds || 60);
    setIsSubmitted(false);
    setShowResults(false);
    setIsSubmitting(false);
    setError(null);
  }, [activity.activityId]);

  useEffect(() => {
    if (timeLeft > 0 && !isSubmitted) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    } else if (timeLeft === 0 && !isSubmitted) {
      handleSubmit();
    }
  }, [timeLeft, isSubmitted]);

  // Lắng nghe cập nhật số người tham gia
  useEffect(() => {
    if (!sessionWebSocket) return;

    const handleParticipantsUpdate = (participants: any[]) => {
      console.log('[QuizCheckbox] Nhận cập nhật participants:', {
        totalParticipants: participants.length,
        participants,
      });

      setTotalParticipants(participants.length);
      // Đếm số người đã trả lời
      const answered = participants.filter((p) => p.hasAnswered).length;
      console.log('[QuizCheckbox] Số người đã trả lời:', answered);
      setAnsweredCount(answered);
    };

    sessionWebSocket.onParticipantsUpdateHandler(handleParticipantsUpdate);

    return () => {
      // Cleanup subscription if needed
    };
  }, [sessionWebSocket]);

  const handleAnswerChange = (answerId: string) => {
    setSelectedAnswers((prev) => {
      if (prev.includes(answerId)) {
        return prev.filter((id) => id !== answerId);
      } else {
        return [...prev, answerId];
      }
    });
  };

  const handleSubmit = async () => {
    if (isSubmitting || isSubmitted || selectedAnswers.length === 0) return;

    setIsSubmitting(true);
    setError(null);

    try {
      if (onAnswerSubmit) {
        onAnswerSubmit(selectedAnswers);
      }

      if (sessionWebSocket) {
        if (!sessionCode && !sessionId) {
          console.warn('[QuizCheckbox] Thiếu cả sessionCode và sessionId');
          setError('Không thể xác định phiên. Vui lòng thử lại.');
          return;
        }

        const payload = {
          sessionCode: sessionCode,
          activityId: activity.activityId,
          answerContent: selectedAnswers.join(','),
        };

        console.log('[QuizCheckbox] Gửi câu trả lời:', payload);
        await sessionWebSocket.submitActivity(payload);
        console.log('[QuizCheckbox] Đã gửi câu trả lời thành công');
      } else {
        console.warn('[QuizCheckbox] Không có kết nối WebSocket');
      }

      setIsSubmitted(true);
      setShowResults(true);
    } catch (err) {
      console.error('[QuizCheckbox] Lỗi khi gửi câu trả lời:', err);
      setError('Không thể gửi câu trả lời. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const calculateScore = () => {
    const correctAnswers = activity.quiz.quizAnswers.filter(
      (answer) => answer.isCorrect
    );
    const selectedCorrect = selectedAnswers.filter((answerId) => {
      const answer = activity.quiz.quizAnswers.find(
        (a) => a.quizAnswerId === answerId
      );
      return answer?.isCorrect;
    });

    const score = (selectedCorrect.length / correctAnswers.length) * 100;
    return Math.round(score);
  };

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
              <div className='h-7 w-7 rounded-full bg-violet-500 flex items-center justify-center shadow-sm'>
                <CheckSquare className='h-4 w-4' />
              </div>
              <div className='text-xs capitalize font-medium'>
                Multiple Response
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
                Math.max(
                  0,
                  (timeLeft / (activity?.quiz?.timeLimitSeconds || 20)) * 100
                )
              )}%`,
            }}
            transition={{ duration: 0.1 }}
          />
          {/* Participants Progress */}
          <motion.div
            className='h-1 bg-violet-500'
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

        {/* Options */}
        <div className='p-4 bg-white dark:bg-gray-800'>
          {error && (
            <motion.div
              className='mb-4 p-3 text-sm bg-red-100 text-red-800 rounded-md'
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {error}
            </motion.div>
          )}

          <div className={`grid grid-cols-1 md:grid-cols-2 gap-3`}>
            {activity.quiz.quizAnswers
              .sort((a, b) => a.orderIndex - b.orderIndex)
              .map((answer, index) => {
                const optionLetter = ['A', 'B', 'C', 'D', 'E', 'F'][index];
                const optionStyle = getOptionStyle(index);
                const isSelected = selectedAnswers.includes(
                  answer.quizAnswerId
                );
                const isCorrect = isSubmitted && answer.isCorrect;

                return (
                  <motion.div
                    key={answer.quizAnswerId}
                    className='group rounded-lg transition-all duration-300 overflow-hidden'
                    whileHover={{ scale: !isSubmitted ? 1.02 : 1 }}
                    whileTap={{ scale: !isSubmitted ? 0.98 : 1 }}
                    onClick={() =>
                      !isSubmitted && handleAnswerChange(answer.quizAnswerId)
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

                        <div className='flex items-center gap-2'>
                          <Checkbox
                            checked={isSelected}
                            className='h-5 w-5 rounded-md'
                            disabled={isSubmitted}
                          />
                          {isSubmitted && isCorrect && (
                            <div className='flex-shrink-0 bg-gradient-to-r from-green-500 via-emerald-400 to-emerald-600 text-white rounded-full p-1.5 shadow-lg border border-white/30'>
                              <CheckCircle className='h-4 w-4' />
                            </div>
                          )}
                        </div>
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
                disabled={selectedAnswers.length === 0 || isSubmitting}
                onClick={handleSubmit}
              >
                {isSubmitting ? 'Đang gửi...' : 'Gửi câu trả lời'}
              </Button>
            </motion.div>
          )}

          {/* Results */}
          {isSubmitted && showResults && (
            <motion.div
              className='mt-6 p-4 rounded-lg bg-gray-50 dark:bg-gray-900/50'
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className='flex items-center gap-2 mb-2'>
                <div className='flex items-center gap-2 text-primary'>
                  <CheckCircle className='h-5 w-5' />
                  <span className='font-semibold'>
                    Điểm số: {calculateScore()}%
                  </span>
                </div>
              </div>
              <p className='text-gray-600 dark:text-gray-300'>
                Bạn đã chọn đúng{' '}
                {
                  selectedAnswers.filter(
                    (id) =>
                      activity.quiz.quizAnswers.find(
                        (a) => a.quizAnswerId === id
                      )?.isCorrect
                  ).length
                }{' '}
                trong số{' '}
                {activity.quiz.quizAnswers.filter((a) => a.isCorrect).length}{' '}
                đáp án đúng.
              </p>
            </motion.div>
          )}
        </div>
      </Card>
    </div>
  );
}
