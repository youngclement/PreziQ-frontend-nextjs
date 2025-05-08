'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { SessionWebSocket } from '@/websocket/sessionWebSocket';
import { Loader2, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface QuizTrueOrFalseViewerProps {
  activity: {
    activityId: string;
    title: string;
    description: string;
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

  useEffect(() => {
    if (timeLeft > 0 && !isAnswered) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [timeLeft, isAnswered]);

  const handleSubmit = async () => {
    if (!selectedAnswer) {
      setError('Vui lòng chọn một đáp án');
      return;
    }

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

  const formattedTime = () => {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  return (
    <div className='w-full max-w-3xl mx-auto'>
      {/* Timer bar */}
      <div className='mb-4 relative'>
        <div className='flex items-center justify-between mb-1'>
          <div className='flex items-center space-x-2'>
            <Clock className='h-4 w-4 text-gray-500' />
            <span className='text-sm font-medium text-gray-700'>
              Thời gian còn lại
            </span>
          </div>
          <span
            className={`text-sm font-bold ${
              timeLeft <= 10 ? 'text-red-500' : 'text-green-500'
            }`}
          >
            {formattedTime()}
          </span>
        </div>
        <div className='w-full bg-gray-200 rounded-full h-2 overflow-hidden'>
          <motion.div
            className={`h-full rounded-full ${
              timeLeft <= 10 ? 'bg-red-500' : 'bg-green-500'
            }`}
            initial={{ width: '100%' }}
            animate={{
              width: `${(timeLeft / activity.quiz.timeLimitSeconds) * 100}%`,
            }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className='bg-white rounded-xl shadow-lg overflow-hidden'
      >
        {/* Header */}
        <div className='bg-gradient-to-r from-indigo-500 to-indigo-600 p-6 text-white'>
          <h2 className='text-xl md:text-2xl font-bold'>{activity.title}</h2>
          {activity.description && (
            <p className='mt-2 text-white/80'>{activity.description}</p>
          )}
        </div>

        {/* Content */}
        <div className='p-6'>
          <div className='mb-8'>
            <h3 className='text-xl font-bold text-gray-800 mb-4'>
              {activity.quiz.questionText}
            </h3>
          </div>

          {error && (
            <Alert variant='destructive' className='mb-6'>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <AnimatePresence>
            {isAnswered && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className='mb-6'
              >
                <div
                  className={`p-4 rounded-lg ${
                    isCorrect ? 'bg-green-50' : 'bg-red-50'
                  }`}
                >
                  <div className='flex items-center gap-3 mb-2'>
                    {isCorrect ? (
                      <>
                        <CheckCircle2 className='h-6 w-6 text-green-500' />
                        <span className='text-green-700 font-medium text-lg'>
                          Chính xác!
                        </span>
                      </>
                    ) : (
                      <>
                        <XCircle className='h-6 w-6 text-red-500' />
                        <span className='text-red-700 font-medium text-lg'>
                          Chưa chính xác
                        </span>
                      </>
                    )}
                  </div>
                  <div className='ml-9'>
                    <p className='text-sm text-gray-600'>Đáp án đúng là:</p>
                    <p className='font-medium text-gray-900'>
                      {
                        activity.quiz.quizAnswers.find((a) => a.isCorrect)
                          ?.answerText
                      }
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className='space-y-6'>
            <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
              {activity.quiz.quizAnswers.map((answer) => (
                <motion.div
                  key={answer.quizAnswerId}
                  whileHover={{ scale: !isAnswered ? 1.02 : 1 }}
                  whileTap={{ scale: !isAnswered ? 0.98 : 1 }}
                >
                  <Button
                    variant={
                      selectedAnswer === answer.quizAnswerId
                        ? 'default'
                        : 'outline'
                    }
                    className={`w-full h-16 text-lg relative overflow-hidden group ${
                      isAnswered && answer.isCorrect
                        ? 'border-green-500 border-2 text-green-700'
                        : isAnswered &&
                          selectedAnswer === answer.quizAnswerId &&
                          !answer.isCorrect
                        ? 'border-red-500 border-2 text-red-700'
                        : selectedAnswer === answer.quizAnswerId
                        ? 'bg-indigo-600 text-white'
                        : 'hover:border-indigo-300'
                    }`}
                    onClick={() =>
                      !isAnswered && setSelectedAnswer(answer.quizAnswerId)
                    }
                    disabled={isSubmitting || isAnswered}
                  >
                    {isAnswered && answer.isCorrect && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className='absolute right-3'
                      >
                        <CheckCircle2 className='h-5 w-5 text-green-500' />
                      </motion.div>
                    )}
                    {isAnswered &&
                      selectedAnswer === answer.quizAnswerId &&
                      !answer.isCorrect && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className='absolute right-3'
                        >
                          <XCircle className='h-5 w-5 text-red-500' />
                        </motion.div>
                      )}
                    <span
                      className={`${
                        isAnswered &&
                        (answer.isCorrect ||
                          selectedAnswer === answer.quizAnswerId)
                          ? 'mr-8'
                          : ''
                      }`}
                    >
                      {answer.answerText}
                    </span>
                  </Button>
                </motion.div>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <Button
                onClick={handleSubmit}
                disabled={
                  isSubmitting ||
                  isAnswered ||
                  timeLeft === 0 ||
                  !selectedAnswer
                }
                className={`w-full h-14 text-lg mt-4 ${
                  isSubmitting ||
                  isAnswered ||
                  timeLeft === 0 ||
                  !selectedAnswer
                    ? 'bg-gray-400'
                    : 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className='mr-2 h-5 w-5 animate-spin' />
                    Đang gửi...
                  </>
                ) : isAnswered ? (
                  'Đã gửi câu trả lời'
                ) : timeLeft === 0 ? (
                  'Hết thời gian'
                ) : (
                  'Gửi câu trả lời'
                )}
              </Button>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
