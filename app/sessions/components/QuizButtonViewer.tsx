// Button quiz

'use client';

import { useState, useEffect, useRef } from 'react';
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
  Users,
  Loader2,
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
  isParticipating?: boolean;
}

const QuizButtonViewer: React.FC<QuizActivityProps> = ({
  activity,
  sessionId,
  sessionCode,
  onAnswerSubmit,
  sessionWebSocket,
  isParticipating = true,
}) => {
  // Thêm ref để lưu activityId trước đó
  const prevActivityIdRef = useRef<string | null>(null);
  // Ref để lưu lần cập nhật cuối cùng của responseRatio
  const lastResponseUpdateRef = useRef<number>(0);

  const [selectedAnswerId, setSelectedAnswerId] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(
    activity.quiz.timeLimitSeconds
  );
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  // State để theo dõi khi nào cần hiệu ứng update
  const [hasRecentUpdate, setHasRecentUpdate] = useState(false);

  // Thêm state để lưu trữ tỷ lệ người dùng đã trả lời
  const [responseRatio, setResponseRatio] = useState<{
    count: number;
    total: number;
    percentage: number;
  }>({
    count: 0,
    total: 0,
    percentage: 0,
  });

  // Thêm state để theo dõi khi nào quiz đã kết thúc
  const [isQuizEnded, setIsQuizEnded] = useState(false);

  // Thêm state để kiểm tra xem câu trả lời có đúng không
  const [isCorrect, setIsCorrect] = useState(false);

  // Thêm state để kiểm tra xem có đang submit hay không
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Thiết lập activityId hiện tại khi component mount
  useEffect(() => {
    if (activity?.activityId) {
      prevActivityIdRef.current = activity.activityId;
    }
  }, []);

  // Thêm useEffect để kiểm tra khi nào quiz kết thúc
  useEffect(() => {
    // Quiz kết thúc khi hết thời gian hoặc tất cả đã trả lời
    if (timeLeft <= 0 || responseRatio.percentage >= 100) {
      setIsQuizEnded(true);
    }
  }, [timeLeft, responseRatio.percentage]);

  // Thêm useEffect để phát hiện thay đổi activity và reset state
  useEffect(() => {
    const currentActivityId = activity?.activityId;

    // Nếu activityId đã thay đổi, reset tất cả các state
    if (currentActivityId !== prevActivityIdRef.current && currentActivityId) {
      console.log('[QuizButtonViewer] Phát hiện activity mới, reset state', {
        prev: prevActivityIdRef.current,
        current: currentActivityId,
      });

      // Reset các state về giá trị ban đầu
      setSelectedAnswerId(null);
      setTimeLeft(activity.quiz.timeLimitSeconds);
      setIsSubmitted(false);
      setSubmitError(null);
      setHasRecentUpdate(false);
      setIsQuizEnded(false);
      setIsCorrect(false);
      setIsSubmitting(false);

      // Khởi tạo giá trị ban đầu cho responseRatio từ WebSocket
      if (sessionWebSocket) {
        const participantsRatio = sessionWebSocket.getParticipantsEventRatio();
        setResponseRatio(participantsRatio); // Cập nhật state lưu trữ tỷ lệ

        console.log(
          '[QuizButtonViewer] Khởi tạo giá trị ban đầu cho responseRatio:',
          participantsRatio
        );
      } else {
        // Fallback nếu không có sessionWebSocket
        setResponseRatio({
          count: 0,
          total: 0,
          percentage: 0,
        });
      }

      // Cập nhật ref lưu activityId hiện tại
      prevActivityIdRef.current = currentActivityId;
    }
  }, [activity, sessionWebSocket]);

  // Thêm useEffect để cập nhật số người đã trả lời
  useEffect(() => {
    if (!sessionWebSocket) return;

    console.log('[QuizButtonViewer] Khởi tạo cập nhật số người tham gia');

    // Hàm cập nhật responseRatio - lấy trực tiếp từ WebSocket
    const updateResponseRatio = () => {
      // Lấy giá trị từ WebSocket
      const participantsRatio = sessionWebSocket.getParticipantsEventRatio();
      const now = Date.now();

      console.log(
        `[QuizButtonViewer] Số người tham gia đã trả lời: ${participantsRatio.count}/${participantsRatio.total} (${participantsRatio.percentage}%)`
      );

      // Kiểm tra xem có sự thay đổi trong số lượng người trả lời không
      if (
        participantsRatio.count !== responseRatio.count ||
        participantsRatio.total !== responseRatio.total
      ) {
        console.log(
          '[QuizButtonViewer] Cập nhật tỷ lệ người tham gia:',
          participantsRatio,
          'Thời điểm:',
          new Date(now).toISOString()
        );

        // Nếu số lượng tăng lên, hiển thị hiệu ứng cập nhật
        if (participantsRatio.count > responseRatio.count) {
          setHasRecentUpdate(true);

          // Tắt hiệu ứng sau 2 giây
          setTimeout(() => {
            setHasRecentUpdate(false);
          }, 2000);
        }

        // Cập nhật responseRatio với giá trị mới
        setResponseRatio(participantsRatio);

        // Nếu tất cả người dùng đã trả lời, đánh dấu quiz kết thúc
        if (participantsRatio.percentage >= 100 && !isQuizEnded) {
          console.log(
            '[QuizButtonViewer] Tất cả người dùng đã trả lời, kết thúc quiz'
          );
          setIsQuizEnded(true);
        }
      }

      lastResponseUpdateRef.current = now;
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
      console.log('[QuizButtonViewer] Dọn dẹp cập nhật số người tham gia');
      clearInterval(intervalId);
    };
  }, [sessionWebSocket, activity.activityId, isQuizEnded, responseRatio]);

  // Đếm ngược thời gian
  useEffect(() => {
    if (timeLeft <= 0) {
      // Khi hết thời gian, đánh dấu quiz kết thúc
      setIsQuizEnded(true);

      // Tự động submit câu trả lời nếu đã chọn nhưng chưa gửi
      if (selectedAnswerId && !isSubmitted && !isSubmitting) {
        console.log('[QuizButtonViewer] Tự động gửi đáp án khi hết thời gian');
        handleSubmit();
      }

      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, selectedAnswerId, isSubmitted, isSubmitting]); // Cập nhật dependencies

  // Thêm useEffect để cảnh báo khi sắp hết thời gian
  useEffect(() => {
    // Hiển thị cảnh báo khi còn ít thời gian (10 giây)
    if (timeLeft === 10) {
      console.log('[QuizButtonViewer] Sắp hết thời gian!');
      // Thêm logic cảnh báo khác nếu cần
    }
  }, [timeLeft]);

  const handleSelectAnswer = (answerId: string) => {
    if (isSubmitted || isQuizEnded) return; // Không cho phép chọn nếu đã nộp hoặc hết giờ
    setSelectedAnswerId(answerId);
  };

  const handleSubmit = async () => {
    if (!selectedAnswerId || isSubmitted || isSubmitting) return;

    setIsSubmitting(true);

    try {
      if (sessionWebSocket && sessionCode && activity) {
        await sessionWebSocket.submitActivity({
          sessionCode: sessionCode,
          activityId: activity.activityId,
          answerContent: selectedAnswerId,
        });

        console.log('[QuizButtonViewer] Đã gửi câu trả lời:', selectedAnswerId);
        setIsSubmitted(true);

        // Kiểm tra xem câu trả lời có đúng không
        const correctAnswer = activity.quiz.quizAnswers.find(
          (a) => a.isCorrect
        );

        if (correctAnswer) {
          setIsCorrect(selectedAnswerId === correctAnswer.quizAnswerId);
        }

        if (onAnswerSubmit) {
          onAnswerSubmit(selectedAnswerId);
        }
      }
    } catch (error) {
      console.error('[QuizButtonViewer] Lỗi khi gửi đáp án:', error);
      setSubmitError('Không thể gửi câu trả lời. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
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
    Math.min(100, (timeLeft / activity.quiz.timeLimitSeconds) * 100)
  );

  // Các màu đã được cập nhật theo yêu cầu
  const getOptionStyle = (
    index: number,
    isSelected: boolean,
    isCorrect: boolean,
    isSubmitted: boolean
  ) => {
    const styles = [
      {
        bg: 'rgb(255, 182, 193)', // Hồng phấn pastel
        bgSelected: 'rgb(255, 182, 193)',
        bgCorrect: 'rgb(198, 234, 132)', // Xanh lá nhạt pha vàng
        bgIncorrect: 'rgb(255, 198, 121)', // Cam đào nhạt
        iconBg: 'rgb(255, 182, 193)',
        glow: 'rgb(255, 182, 193)',
      },
      {
        bg: 'rgb(173, 216, 255)', // Xanh da trời nhạt
        bgSelected: 'rgb(173, 216, 255)',
        bgCorrect: 'rgb(198, 234, 132)', // Xanh lá nhạt pha vàng
        bgIncorrect: 'rgb(255, 198, 121)', // Cam đào nhạt
        iconBg: 'rgb(173, 216, 255)',
        glow: 'rgb(173, 216, 255)',
      },
      {
        bg: 'rgb(213, 189, 255)', // Tím lavender nhạt
        bgSelected: 'rgb(213, 189, 255)',
        bgCorrect: 'rgb(198, 234, 132)', // Xanh lá nhạt pha vàng
        bgIncorrect: 'rgb(255, 198, 121)', // Cam đào nhạt
        iconBg: 'rgb(213, 189, 255)',
        glow: 'rgb(213, 189, 255)',
      },
      {
        bg: 'rgb(255, 244, 180)', // Vàng mơ nhạt
        bgSelected: 'rgb(255, 244, 180)',
        bgCorrect: 'rgb(198, 234, 132)', // Xanh lá nhạt pha vàng
        bgIncorrect: 'rgb(255, 198, 121)', // Cam đào nhạt
        iconBg: 'rgb(255, 244, 180)',
        glow: 'rgb(255, 244, 180)',
      },
    ];

    const baseStyle = styles[index % styles.length];

    // Hiển thị đáp án đúng/sai chỉ khi quiz kết thúc (hết giờ hoặc 100% người dùng đã trả lời)
    if (isQuizEnded) {
      if (isCorrect) {
        return {
          bg: baseStyle.bgCorrect,
          glow: baseStyle.bgCorrect,
        };
      } else if (isSelected && isSubmitted) {
        return {
          bg: baseStyle.bgIncorrect,
          glow: baseStyle.bgIncorrect,
        };
      }
    }

    // Nếu đã chọn và đã submit nhưng chưa kết thúc, giữ màu nổi bật
    if (isSelected && isSubmitted) {
      return {
        bg: baseStyle.bgSelected,
        glow: baseStyle.bgSelected,
      };
    }

    // Nếu chỉ đã chọn nhưng chưa submit và chưa kết thúc, chỉ hiển thị hiệu ứng viền sáng
    if (isSelected) {
      return {
        bg: baseStyle.bg,
        glow: baseStyle.glow,
      };
    }

    return {
      bg: 'bg-black bg-opacity-30',
      glow: 'transparent',
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
                <Radio className='h-4 w-4 text-black' />
              </div>
              <div className='text-xs capitalize font-medium text-white/80'>
                Multiple Choice
              </div>
            </div>
            <div className='flex items-center gap-2'>
              {/* Thêm hiển thị số người đã trả lời */}
              {sessionWebSocket && (
                <motion.div
                  key={`${responseRatio.count}-${responseRatio.total}`}
                  className={`
                    flex items-center gap-1.5 mr-2 ${
                      responseRatio.percentage >= 100
                        ? 'bg-black bg-opacity-30 border-white/20'
                        : 'bg-black bg-opacity-30 border-white/20'
                    } border px-2 py-1 rounded-full text-xs font-medium`}
                  animate={{
                    scale: hasRecentUpdate ? [1, 1.15, 1] : 1,
                    transition: { duration: 0.5 },
                  }}
                >
                  <Users className='h-3.5 w-3.5 text-[rgb(198,234,132)]' />
                  <span
                    className={
                      responseRatio.percentage >= 100
                        ? 'text-[rgb(198,234,132)]'
                        : 'text-[rgb(255,244,180)]'
                    }
                  >
                    {responseRatio.count}
                  </span>
                  <span className='text-white/50'>/{responseRatio.total}</span>
                  <span className='ml-1 text-xs opacity-75'>
                    ({responseRatio.percentage}%)
                  </span>
                </motion.div>
              )}

              <motion.div
                className='flex items-center gap-1.5 bg-black bg-opacity-30 border border-white/10 px-2 py-1 rounded-full text-xs font-medium'
                animate={{
                  opacity: timeLeft < 10 ? [0.7, 1] : 1,
                  scale: timeLeft < 10 ? [1, 1.05, 1] : 1,
                  backgroundColor:
                    timeLeft < 10
                      ? [
                          'rgba(0, 0, 0, 0.3)',
                          'rgba(255, 198, 121, 0.3)',
                          'rgba(0, 0, 0, 0.3)',
                        ]
                      : undefined,
                }}
                transition={{
                  duration: timeLeft < 10 ? 0.5 : 0,
                  repeat: timeLeft < 10 ? Infinity : 0,
                  repeatType: 'reverse',
                }}
              >
                <Clock
                  className={`h-3.5 w-3.5 ${
                    timeLeft < 10
                      ? 'text-[rgb(255,198,121)]'
                      : 'text-[rgb(198,234,132)]'
                  }`}
                />
                <span
                  className={
                    timeLeft < 10 ? 'text-[rgb(255,198,121)]' : 'text-white/90'
                  }
                >
                  {formatTime(timeLeft)}
                </span>
              </motion.div>
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
            </motion.div>
          </div>
        </motion.div>

        {/* Progress Bar */}
        <div className='w-full h-1 bg-black bg-opacity-20'>
          <motion.div
            className='h-full bg-[rgb(198,234,132)]'
            initial={{ width: '100%' }}
            animate={{ width: `${progressPercentage}%` }}
            transition={{ duration: 0.1 }}
          />
        </div>

        {/* Options */}
        <div className='p-6 bg-black bg-opacity-20'>
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
                      handleSelectAnswer(answer.quizAnswerId)
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
                  </motion.div>
                );
              })}
          </motion.div>

          {/* Submit Button */}
          {selectedAnswerId && !isSubmitted && isParticipating && (
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
                    <span className='flex items-center gap-2'>
                      Gửi câu trả lời
                    </span>
                    <ArrowRight className='h-5 w-5' />
                  </>
                )}
              </Button>
            </motion.div>
          )}

          {/* Thông báo đã gửi câu trả lời khi submit nhưng chưa kết thúc quiz */}
          {isSubmitted && !isQuizEnded && (
            <motion.div
              className='mt-6 p-4 rounded-xl bg-black bg-opacity-30 border border-white/20 text-white/90'
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

          {/* Show Time Expired Message when quiz has ended but not submitted
          {isQuizEnded && !isSubmitted && (
            <motion.div
              className='mt-6 p-4 rounded-xl bg-[#0e2838]/50 border border-amber-500/30 text-white/90'
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className='flex items-center gap-2 mb-2 text-amber-400'>
                <Clock className='h-5 w-5' />
                <span className='font-semibold'>Hết thời gian!</span>
              </div>
              <p className='text-white/70'>
                Thời gian trả lời đã hết hoặc tất cả người tham gia đã trả lời.
                Bạn không thể nộp câu trả lời nữa.
              </p>
            </motion.div>
          )} */}

          {/* Error Message */}
          <AnimatePresence>
            {submitError && (
              <motion.div
                className='mt-4 p-3 rounded-xl bg-black bg-opacity-30 border border-[rgb(255,198,121)] text-white/90'
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <div className='flex items-center gap-2'>
                  <AlertCircle className='h-5 w-5 text-[rgb(255,198,121)]' />
                  <span>{submitError}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Explanation - Chỉ hiển thị khi quiz đã kết thúc hoặc host hiển thị đáp án */}
          <AnimatePresence>
            {(isQuizEnded || activity.hostShowAnswer) && (
              <motion.div
                className='mt-6 p-4 rounded-xl bg-black bg-opacity-30 border border-white/10'
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              >
                {/* Show correct answer for quiz ended but not submitted */}
                {isQuizEnded && !isSubmitted && (
                  <div className='flex items-center gap-2 mb-2 text-[rgb(198,234,132)]'>
                    <CheckCircle className='h-5 w-5' />
                    <span className='font-semibold'>Đáp án chính xác:</span>
                  </div>
                )}

                {activity.hostShowAnswer && !isQuizEnded && (
                  <div className='flex items-center gap-2 mb-2 text-[rgb(198,234,132)]'>
                    <CheckCircle className='h-5 w-5' />
                    <span className='font-semibold'>Đáp án chính xác:</span>
                  </div>
                )}

                {isSubmitted && isQuizEnded && (
                  <div className='flex items-center gap-2 mb-2'>
                    {isCorrect ? (
                      <div className='flex items-center gap-2 text-[rgb(198,234,132)]'>
                        <CheckCircle className='h-5 w-5' />
                        <span className='font-semibold'>Chính xác!</span>
                      </div>
                    ) : (
                      <div className='flex items-center gap-2 text-[rgb(255,198,121)]'>
                        <AlertCircle className='h-5 w-5' />
                        <span className='font-semibold'>Chưa chính xác</span>
                      </div>
                    )}
                  </div>
                )}

                {(activity.hostShowAnswer || isQuizEnded) && !isSubmitted ? (
                  <div className='space-y-2'>
                    {activity.quiz.quizAnswers
                      .filter((answer) => answer.isCorrect)
                      .map((answer, idx) => (
                        <div
                          key={idx}
                          className='flex items-center gap-2 text-white/80'
                        >
                          <div className='h-2 w-2 rounded-full bg-[rgb(198,234,132)]'></div>
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
                ) : isQuizEnded && isSubmitted ? (
                  <p className='text-white/70'>
                    {
                      activity.quiz.quizAnswers.find(
                        (a) => a.quizAnswerId === selectedAnswerId
                      )?.explanation
                    }
                  </p>
                ) : null}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Card>
    </div>
  );
};

export default QuizButtonViewer;
