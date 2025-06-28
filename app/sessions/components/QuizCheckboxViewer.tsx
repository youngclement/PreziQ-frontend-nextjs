'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Clock,
  CheckCircle,
  XCircle,
  Users,
  CheckSquare,
  AlertCircle,
  ArrowRight,
  Loader2,
} from 'lucide-react';
import { SessionWebSocket } from '@/websocket/sessionWebSocket';
import { motion, AnimatePresence } from 'framer-motion';

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
    hostShowAnswer?: boolean;
    quiz: Quiz;
  };
  sessionId?: string;
  sessionCode?: string;
  onAnswerSubmit?: (selectedAnswers: string[]) => void;
  sessionWebSocket?: SessionWebSocket;
  isParticipating?: boolean;
}

export default function QuizCheckboxViewer({
  activity,
  sessionId,
  sessionCode,
  onAnswerSubmit,
  sessionWebSocket,
  isParticipating = true,
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
  const [isQuizEnded, setIsQuizEnded] = useState(false);

  // Reset state when activity changes
  useEffect(() => {
    setSelectedAnswers([]);
    setTimeLeft(activity?.quiz?.timeLimitSeconds || 60);
    setIsSubmitted(false);
    setShowResults(false);
    setIsSubmitting(false);
    setError(null);
  }, [activity.activityId]);

  // Xử lý submit đáp án dùng useCallback
  const handleSubmit = useCallback(async () => {
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
      setShowResults(isQuizEnded);
    } catch (err) {
      console.error('[QuizCheckbox] Lỗi khi gửi câu trả lời:', err);
      setError('Không thể gửi câu trả lời. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  }, [
    isSubmitting,
    isSubmitted,
    selectedAnswers,
    onAnswerSubmit,
    sessionWebSocket,
    sessionCode,
    sessionId,
    activity.activityId,
    isQuizEnded,
  ]);

  // Cải thiện logic đếm ngược thời gian và tự động submit
  useEffect(() => {
    if (timeLeft <= 0) {
      // Khi hết thời gian, đánh dấu quiz kết thúc
      setIsQuizEnded(true);

      // Tự động submit câu trả lời nếu đã chọn nhưng chưa gửi
      if (selectedAnswers.length > 0 && !isSubmitted && !isSubmitting) {
        console.log('[QuizCheckbox] Tự động gửi đáp án khi hết thời gian');
        handleSubmit();
      }

      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, selectedAnswers, isSubmitted, isSubmitting, handleSubmit]);

  useEffect(() => {
    if (
      timeLeft <= 0 ||
      (answeredCount > 0 && answeredCount >= totalParticipants)
    ) {
      setIsQuizEnded(true);
    }
  }, [timeLeft, answeredCount, totalParticipants]);

  // Lắng nghe cập nhật số người tham gia
  useEffect(() => {
    if (!sessionWebSocket) return;

    console.log('[QuizCheckbox] Khởi tạo cập nhật số người tham gia');

    // Hàm cập nhật responseRatio - lấy trực tiếp từ WebSocket
    const updateResponseRatio = () => {
      // Lấy giá trị từ WebSocket
      const participantsRatio = sessionWebSocket.getParticipantsEventRatio();

      console.log(
        `[QuizCheckbox] Số người tham gia đã trả lời: ${participantsRatio.count}/${participantsRatio.total} (${participantsRatio.percentage}%)`
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
      console.log('[QuizCheckbox] Dọn dẹp cập nhật số người tham gia');
      clearInterval(intervalId);
    };
  }, [sessionWebSocket]);

  const handleAnswerChange = (answerId: string) => {
    if (isSubmitted || isQuizEnded) return;

    setSelectedAnswers((prev) => {
      if (prev.includes(answerId)) {
        return prev.filter((id) => id !== answerId);
      } else {
        return [...prev, answerId];
      }
    });
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
  const getOptionStyle = (
    index: number,
    isSelected: boolean,
    isCorrect: boolean,
    isSubmitted: boolean
  ) => {
    const styles = [
      {
        bg: 'rgb(255, 182, 193)', // Hồng phấn pastel (Cherry)
        bgSelected: 'rgb(255, 182, 193)',
        bgCorrect: 'rgb(198, 234, 132)', // Xanh lá nhạt pha vàng (Banana)
        bgIncorrect: 'rgb(255, 198, 121)', // Cam đào nhạt (Strawberry)
        glow: 'rgb(255, 182, 193)',
      },
      {
        bg: 'rgb(173, 216, 255)', // Xanh da trời nhạt (Blueberry)
        bgSelected: 'rgb(173, 216, 255)',
        bgCorrect: 'rgb(198, 234, 132)', // Xanh lá nhạt pha vàng (Banana)
        bgIncorrect: 'rgb(255, 198, 121)', // Cam đào nhạt (Strawberry)
        glow: 'rgb(173, 216, 255)',
      },
      {
        bg: 'rgb(213, 189, 255)', // Tím lavender nhạt (Grape)
        bgSelected: 'rgb(213, 189, 255)',
        bgCorrect: 'rgb(198, 234, 132)', // Xanh lá nhạt pha vàng (Banana)
        bgIncorrect: 'rgb(255, 198, 121)', // Cam đào nhạt (Strawberry)
        glow: 'rgb(213, 189, 255)',
      },
      {
        bg: 'rgb(255, 244, 180)', // Vàng mơ nhạt (Lemon)
        bgSelected: 'rgb(255, 244, 180)',
        bgCorrect: 'rgb(198, 234, 132)', // Xanh lá nhạt pha vàng (Banana)
        bgIncorrect: 'rgb(255, 198, 121)', // Cam đào nhạt (Strawberry)
        glow: 'rgb(255, 244, 180)',
      },
    ];

    const baseStyle = styles[index % styles.length];

    if (isSubmitted && isQuizEnded) {
      if (isCorrect) {
        return {
          bg: baseStyle.bgCorrect,
          glow: baseStyle.bgCorrect,
        };
      } else if (isSelected) {
        return {
          bg: baseStyle.bgIncorrect,
          glow: baseStyle.bgIncorrect,
        };
      }
    }

    if (isSelected) {
      return {
        bg: baseStyle.bgSelected,
        glow: baseStyle.bgSelected,
      };
    }

    return {
      bg: baseStyle.bg,
      glow: baseStyle.bg,
    };
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
            backgroundColor: activity.backgroundColor || '#AFB2AF',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          {/* Overlay */}
          <div className='absolute inset-0 bg-black bg-opacity-30' />

          {/* Status Bar */}
          <div className='sticky top-0 left-0 right-0 h-12 bg-black bg-opacity-40 backdrop-blur-sm border-b border-white/5 flex items-center justify-between px-5 text-white z-20'>
            <div className='flex items-center gap-3'>
              <div className='h-7 w-7 rounded-full bg-[rgb(198,234,132)] flex items-center justify-center shadow-md'>
                <CheckSquare className='h-4 w-4 text-black' />
              </div>
              <div className='text-xs capitalize font-medium text-white/80'>
                Multiple Choice
              </div>
            </div>
            <div className='flex items-center gap-2'>
              <motion.div
                className='flex items-center gap-1.5 bg-black bg-opacity-30 border border-white/10 px-2 py-1 rounded-full text-xs font-medium'
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
                <Clock className='h-3.5 w-3.5 text-[rgb(198,234,132)]' />
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
              {/* {activity.description && (
                <p className='mt-2 text-xs md:text-sm text-white/80 text-center'>
                  {activity.description}
                </p>
              )} */}
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

        {/* Options */}
        <div className='p-6 bg-black bg-opacity-20'>
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
            className={`grid grid-cols-1 md:grid-cols-2 gap-3`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {activity.quiz.quizAnswers
              .sort((a, b) => a.orderIndex - b.orderIndex)
              .map((answer, index) => {
                const optionLetter = ['A', 'B', 'C', 'D', 'E', 'F'][index];
                const optionStyle = getOptionStyle(
                  index,
                  selectedAnswers.includes(answer.quizAnswerId),
                  answer.isCorrect,
                  isSubmitted
                );
                const isSelected = selectedAnswers.includes(
                  answer.quizAnswerId
                );
                const isCorrect = isSubmitted && answer.isCorrect;

                return (
                  <motion.div
                    key={answer.quizAnswerId}
                    whileHover={{
                      scale: !isSubmitted && !isQuizEnded ? 1.02 : 1,
                    }}
                    whileTap={{
                      scale: !isSubmitted && !isQuizEnded ? 0.98 : 1,
                    }}
                    className={`relative rounded-xl ${
                      isSelected ? 'z-10' : 'z-0'
                    }`}
                    onClick={() =>
                      !isSubmitted &&
                      !isQuizEnded &&
                      handleAnswerChange(answer.quizAnswerId)
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

                        <div className='flex items-center gap-2'>
                          <Checkbox
                            checked={isSelected}
                            className='h-5 w-5 rounded-md border-2 border-white/30 data-[state=checked]:bg-[#aef359] data-[state=checked]:text-[#0e1c26] data-[state=checked]:border-[#aef359]'
                            disabled={isSubmitted}
                          />

                          {/* Hiển thị biểu tượng đáp án đúng khi quiz kết thúc hoặc host hiển thị đáp án */}
                          {(isQuizEnded || activity.hostShowAnswer) &&
                            answer.isCorrect && (
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
                    </div>
                  </motion.div>
                );
              })}
          </motion.div>

          {/* Submit Button */}
          {selectedAnswers.length > 0 && !isSubmitted && isParticipating && (
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
          {isSubmitted && !showResults && !isQuizEnded && (
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
            {(isSubmitted && isQuizEnded) ||
            activity.hostShowAnswer ||
            isQuizEnded ? (
              <motion.div
                className='mt-6 p-4 rounded-xl bg-[#0e2838]/50 border border-white/10'
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              >
                {activity.hostShowAnswer && !isSubmitted ? (
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
                            <p>{answer.answerText}</p>
                          </div>
                        ))}
                    </div>
                  </div>
                ) : isQuizEnded && !isSubmitted ? (
                  <div>
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
                    </div>
                  </div>
                ) : (
                  <>
                    <div className='flex items-center gap-2 mb-3'>
                      <div className='flex items-center gap-2 text-[#aef359]'>
                        <CheckCircle className='h-5 w-5' />
                        <span className='font-semibold'>
                          Điểm số: {calculateScore()}%
                        </span>
                      </div>
                    </div>
                    <p className='text-white/70'>
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
                      {
                        activity.quiz.quizAnswers.filter((a) => a.isCorrect)
                          .length
                      }{' '}
                      đáp án đúng.
                    </p>
                  </>
                )}
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </Card>
    </div>
  );
}
