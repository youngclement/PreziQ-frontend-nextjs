'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  AlertCircle,
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  Users,
  ArrowRight,
  ArrowUpDown,
} from 'lucide-react';
import { SessionWebSocket } from '@/websocket/sessionWebSocket';
import { motion, AnimatePresence } from 'framer-motion';
import { SortableList, Item } from './SortableList';

interface QuizReorderViewerProps {
  activity: {
    activityId: string;
    title: string;
    description?: string;
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
        orderIndex: number;
      }[];
    };
  };
  sessionId: string;
  sessionWebSocket: SessionWebSocket;
  isParticipating?: boolean;
}

export const QuizReorderViewer = ({
  activity,
  sessionId,
  sessionWebSocket,
  isParticipating = true,
}: QuizReorderViewerProps) => {
  const [items, setItems] = useState<Item[]>([]);
  const [timeLeft, setTimeLeft] = useState(activity.quiz.timeLimitSeconds);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [totalParticipants, setTotalParticipants] = useState(0);
  const [isQuizEnded, setIsQuizEnded] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showCorrectOrder, setShowCorrectOrder] = useState(false);
  const [chainReactionIndex, setChainReactionIndex] = useState(-1);
  const [isChainReactionActive, setIsChainReactionActive] = useState(false);

  // Đáp án đúng
  const correctOrder = useMemo(() => {
    return activity.quiz.quizAnswers
      .sort((a, b) => a.orderIndex - b.orderIndex)
      .map((a) => a.quizAnswerId);
  }, [activity.quiz.quizAnswers]);

  // Thuật toán shuffle phức tạp để đảm bảo không trùng với đáp án đúng
  const createComplexShuffle = useCallback(
    (answers: typeof activity.quiz.quizAnswers) => {
      const correctOrderIds = answers
        .sort((a, b) => a.orderIndex - b.orderIndex)
        .map((a) => a.quizAnswerId);

      let shuffled: Item[];
      let attempts = 0;
      const maxAttempts = 100;
      const minDifferencePercentage = Math.max(
        70,
        Math.floor(((answers.length - 1) / answers.length) * 100)
      );

      // Các chiến lược shuffle khác nhau
      const shuffleStrategies = [
        // Chiến lược 1: Reverse + Multiple Fisher-Yates
        () => {
          const reversed = [...answers]
            .sort((a, b) => b.orderIndex - a.orderIndex)
            .map((a) => ({ id: a.quizAnswerId, text: a.answerText }));

          let result = [...reversed];
          for (let round = 0; round < 3; round++) {
            for (let i = result.length - 1; i > 0; i--) {
              const j = Math.floor(Math.random() * (i + 1));
              [result[i], result[j]] = [result[j], result[i]];
            }
          }
          return result;
        },

        // Chiến lược 2: Block rotation
        () => {
          const items = [...answers].map((a) => ({
            id: a.quizAnswerId,
            text: a.answerText,
          }));
          const blockSize = Math.max(2, Math.floor(items.length / 3));

          // Chia thành các block và xoay vòng
          for (let i = 0; i < items.length; i += blockSize) {
            const block = items.slice(i, i + blockSize);
            const rotateBy = Math.floor(Math.random() * block.length);
            const rotated = [
              ...block.slice(rotateBy),
              ...block.slice(0, rotateBy),
            ];
            items.splice(i, blockSize, ...rotated);
          }

          // Shuffle toàn bộ một lần nữa
          for (let i = items.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [items[i], items[j]] = [items[j], items[i]];
          }

          return items;
        },

        // Chiến lược 3: Interleaving pattern
        () => {
          const items = [...answers].map((a) => ({
            id: a.quizAnswerId,
            text: a.answerText,
          }));
          const result: Item[] = [];
          const odds: Item[] = [];
          const evens: Item[] = [];

          // Tách thành chẵn lẻ
          items.forEach((item, index) => {
            if (index % 2 === 0) evens.push(item);
            else odds.push(item);
          });

          // Shuffle từng nhóm
          [odds, evens].forEach((group) => {
            for (let i = group.length - 1; i > 0; i--) {
              const j = Math.floor(Math.random() * (i + 1));
              [group[i], group[j]] = [group[j], group[i]];
            }
          });

          // Interleave ngẫu nhiên
          while (odds.length > 0 || evens.length > 0) {
            if (Math.random() > 0.5 && odds.length > 0) {
              result.push(odds.pop()!);
            } else if (evens.length > 0) {
              result.push(evens.pop()!);
            } else if (odds.length > 0) {
              result.push(odds.pop()!);
            }
          }

          return result;
        },

        // Chiến lược 4: Spiral shuffle
        () => {
          const items = [...answers].map((a) => ({
            id: a.quizAnswerId,
            text: a.answerText,
          }));
          const result: Item[] = new Array(items.length);
          const indices = Array.from({ length: items.length }, (_, i) => i);

          // Tạo pattern spiral
          let left = 0,
            right = items.length - 1;
          let itemIndex = 0;

          while (left <= right) {
            // Từ trái sang phải
            if (itemIndex < items.length) {
              result[left] = items[itemIndex++];
              left++;
            }
            // Từ phải sang trái
            if (itemIndex < items.length && left <= right) {
              result[right] = items[itemIndex++];
              right--;
            }
          }

          // Shuffle thêm một lần
          for (let i = result.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [result[i], result[j]] = [result[j], result[i]];
          }

          return result;
        },
      ];

      do {
        // Chọn ngẫu nhiên một chiến lược
        const strategyIndex = Math.floor(
          Math.random() * shuffleStrategies.length
        );
        shuffled = shuffleStrategies[strategyIndex]();

        // Kiểm tra độ khác biệt
        const shuffledIds = shuffled.map((item) => item.id);
        let differentPositions = 0;
        for (let i = 0; i < shuffledIds.length; i++) {
          if (shuffledIds[i] !== correctOrderIds[i]) {
            differentPositions++;
          }
        }

        const differencePercentage =
          (differentPositions / shuffledIds.length) * 100;

        console.log(
          `[QuizReorder] Attempt ${attempts + 1}, Strategy ${
            strategyIndex + 1
          }, Difference: ${differencePercentage.toFixed(1)}%`
        );

        // Nếu đủ khác biệt hoặc đã thử quá nhiều lần, dừng lại
        if (
          differencePercentage >= minDifferencePercentage ||
          attempts >= maxAttempts
        ) {
          break;
        }

        attempts++;
      } while (attempts < maxAttempts);

      // Bước cuối: Nếu vẫn chưa đủ khác biệt, áp dụng thuật toán hoán vị cưỡng bức
      if (attempts >= maxAttempts) {
        console.log('[QuizReorder] Applying forced permutation...');
        shuffled = [...answers].map((a) => ({
          id: a.quizAnswerId,
          text: a.answerText,
        }));

        // Hoán đổi cặp đầu-cuối, giữa với các vị trí khác
        const length = shuffled.length;
        if (length >= 2) {
          // Hoán đổi phần tử đầu và cuối
          [shuffled[0], shuffled[length - 1]] = [
            shuffled[length - 1],
            shuffled[0],
          ];
        }
        if (length >= 4) {
          // Hoán đổi phần tử thứ 2 với phần tử áp cuối
          [shuffled[1], shuffled[length - 2]] = [
            shuffled[length - 2],
            shuffled[1],
          ];
        }
        if (length >= 3) {
          // Xoay vòng các phần tử ở giữa
          const middle = Math.floor(length / 2);
          for (let i = 2; i < middle; i++) {
            const targetIndex = (i + middle) % length;
            if (targetIndex !== i && targetIndex < length - 2) {
              [shuffled[i], shuffled[targetIndex]] = [
                shuffled[targetIndex],
                shuffled[i],
              ];
            }
          }
        }

        // Thêm một vài hoán đổi ngẫu nhiên nữa
        for (let i = 0; i < Math.min(5, length); i++) {
          const idx1 = Math.floor(Math.random() * length);
          const idx2 = Math.floor(Math.random() * length);
          if (idx1 !== idx2) {
            [shuffled[idx1], shuffled[idx2]] = [shuffled[idx2], shuffled[idx1]];
          }
        }
      }

      // Validation cuối cùng
      const finalShuffledIds = shuffled.map((item) => item.id);
      let finalDifferentPositions = 0;
      for (let i = 0; i < finalShuffledIds.length; i++) {
        if (finalShuffledIds[i] !== correctOrderIds[i]) {
          finalDifferentPositions++;
        }
      }
      const finalDifferencePercentage =
        (finalDifferentPositions / finalShuffledIds.length) * 100;

      console.log(
        '[QuizReorder] Shuffle completed after',
        attempts,
        'attempts'
      );
      console.log(
        '[QuizReorder] Final difference:',
        finalDifferencePercentage.toFixed(1) + '%'
      );
      console.log('[QuizReorder] Original order:', correctOrderIds);
      console.log('[QuizReorder] Shuffled order:', finalShuffledIds);

      return shuffled;
    },
    []
  );

  // Khởi tạo items với thuật toán shuffle phức tạp
  useEffect(() => {
    const shuffled = createComplexShuffle(activity.quiz.quizAnswers);
    setItems(shuffled);
  }, [activity.quiz.quizAnswers, createComplexShuffle]);

  // Đếm ngược thời gian
  useEffect(() => {
    if (timeLeft > 0 && !isAnswered) {
      const t = setInterval(() => setTimeLeft((t) => t - 1), 1000);
      return () => clearInterval(t);
    }
  }, [timeLeft, isAnswered]);

  // Thêm useEffect để kiểm tra khi nào quiz kết thúc
  useEffect(() => {
    // Quiz kết thúc khi hết thời gian hoặc tất cả đã trả lời
    if (
      timeLeft <= 0 ||
      (answeredCount > 0 && answeredCount >= totalParticipants)
    ) {
      setIsQuizEnded(true);

      // Nếu đã submit rồi và quiz vừa mới kết thúc, hiển thị kết quả
      if (isSubmitted && !isQuizEnded) {
        // Đã submit và vừa kết thúc, hiển thị kết quả
        const userOrder = items.map((i) => i.id);
        const correct =
          JSON.stringify(userOrder) === JSON.stringify(correctOrder);
        setIsCorrect(correct);
      }
    }
  }, [
    timeLeft,
    answeredCount,
    totalParticipants,
    isSubmitted,
    isQuizEnded,
    items,
    correctOrder,
  ]);

  // Thêm useEffect để tự động sắp xếp lại items khi cần hiển thị đáp án
  useEffect(() => {
    const shouldShowAnswer =
      (isSubmitted && isQuizEnded) ||
      activity.hostShowAnswer ||
      (isQuizEnded && !isSubmitted);

    if (shouldShowAnswer && !showCorrectOrder) {
      setShowCorrectOrder(true);
      setIsChainReactionActive(true);

      // Delay một chút rồi bắt đầu chain reaction
      setTimeout(() => {
        const correctItems = correctOrder.map((id) => {
          const answer = activity.quiz.quizAnswers.find(
            (a) => a.quizAnswerId === id
          );
          return { id, text: answer?.answerText || '' };
        });

        // Tạo hiệu ứng chain reaction - di chuyển từng phần tử một cách tuần tự
        let currentItems = [...items];

        correctItems.forEach((correctItem, targetIndex) => {
          setTimeout(() => {
            // Cập nhật index hiện tại đang di chuyển
            setChainReactionIndex(targetIndex);

            // Tìm vị trí hiện tại của phần tử cần di chuyển
            const currentIndex = currentItems.findIndex(
              (item) => item.id === correctItem.id
            );

            if (currentIndex !== -1 && currentIndex !== targetIndex) {
              // Di chuyển phần tử từ vị trí hiện tại đến vị trí đúng
              const [movedItem] = currentItems.splice(currentIndex, 1);
              currentItems.splice(targetIndex, 0, movedItem);

              // Cập nhật state
              setItems([...currentItems]);

              console.log(
                `[Chain Reaction] Moving item ${targetIndex + 1}/${
                  correctItems.length
                }: "${correctItem.text}" from position ${currentIndex + 1} to ${
                  targetIndex + 1
                }`
              );
            }

            // Nếu là phần tử cuối cùng, kết thúc chain reaction
            if (targetIndex === correctItems.length - 1) {
              setTimeout(() => {
                setIsChainReactionActive(false);
                setChainReactionIndex(-1);
                console.log('[Chain Reaction] Completed!');
              }, 500);
            }
          }, targetIndex * 300); // Tăng delay lên 300ms để hiệu ứng rõ ràng hơn
        });
      }, 800); // Tăng delay ban đầu để người dùng có thời gian quan sát
    }
  }, [
    isSubmitted,
    isQuizEnded,
    activity.hostShowAnswer,
    correctOrder,
    activity.quiz.quizAnswers,
    showCorrectOrder,
    items,
  ]);

  // Cập nhật participants từ WebSocket
  useEffect(() => {
    if (!sessionWebSocket) return;

    console.log('[QuizReorder] Khởi tạo cập nhật số người tham gia');

    // Hàm cập nhật responseRatio - lấy trực tiếp từ WebSocket
    const updateResponseRatio = () => {
      // Lấy giá trị từ WebSocket
      const participantsRatio = sessionWebSocket.getParticipantsEventRatio();

      console.log(
        `[QuizReorder] Số người tham gia đã trả lời: ${participantsRatio.count}/${participantsRatio.total} (${participantsRatio.percentage}%)`
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
      console.log('[QuizReorder] Dọn dẹp cập nhật số người tham gia');
      clearInterval(intervalId);
    };
  }, [sessionWebSocket]);

  // Chuyển handleSubmit thành useCallback
  const handleSubmit = useCallback(async () => {
    if (isSubmitting || isAnswered || isQuizEnded) return;
    setIsSubmitting(true);
    setError(null);

    try {
      const answerContent = items.map((i) => i.id).join(',');
      await sessionWebSocket.submitActivity({
        sessionId,
        activityId: activity.activityId,
        answerContent,
      });

      const userOrder = items.map((i) => i.id);
      const correct =
        JSON.stringify(userOrder) === JSON.stringify(correctOrder);
      setIsCorrect(correct);
      setIsAnswered(true);
      setIsSubmitted(true);
    } catch (e) {
      setError('Không thể gửi câu trả lời. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  }, [
    isSubmitting,
    isAnswered,
    isQuizEnded,
    items,
    sessionWebSocket,
    sessionId,
    activity.activityId,
    correctOrder,
  ]);

  // Cải thiện logic đếm ngược và tự động submit khi hết thời gian
  useEffect(() => {
    if (timeLeft <= 0) {
      // Khi hết thời gian, đánh dấu quiz kết thúc
      setIsQuizEnded(true);

      // Tự động submit câu trả lời nếu đã sắp xếp nhưng chưa gửi
      if (items.length > 0 && !isSubmitted && !isSubmitting) {
        console.log('[QuizReorderViewer] Tự động gửi đáp án khi hết thời gian');
        handleSubmit();
      }

      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, items, isSubmitted, isSubmitting, handleSubmit]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <div className='min-h-full bg-transparent'>
      <Card className='bg-black bg-opacity-30 backdrop-blur-md shadow-xl border border-white/5 text-white overflow-hidden'>
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
          <div className='sticky top-0 left-0 right-0 h-12 bg-black bg-opacity-40 backdrop-blur-sm border-b border-white/5 flex items-center justify-between px-3 md:px-5 text-white z-20'>
            <div className='flex items-center gap-2 md:gap-3'>
              <div className='h-6 w-6 md:h-7 md:w-7 rounded-full bg-[rgb(198,234,132)] flex items-center justify-center shadow-md'>
                <ArrowUpDown className='h-3 w-3 md:h-4 md:w-4 text-black' />
              </div>
              <div className='text-xs capitalize font-medium text-white/80'>
                Reorder
              </div>
            </div>
            <div className='flex items-center gap-1 md:gap-2'>
              <motion.div
                className='flex items-center gap-1 md:gap-1.5 bg-black bg-opacity-30 border border-white/10 px-2 py-1 rounded-full text-[10px] md:text-xs font-medium'
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
                <Clock className='h-3 w-3 md:h-3.5 md:w-3.5 text-[rgb(198,234,132)]' />
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
                    flex items-center gap-1 md:gap-1.5 mr-1 md:mr-2 ${
                      answeredCount >= totalParticipants
                        ? 'bg-black bg-opacity-30 border-[rgb(198,234,132)]/30 shadow-[rgb(198,234,132)]/10'
                        : 'bg-black bg-opacity-30 border-[rgb(255,198,121)]/30 shadow-[rgb(255,198,121)]/10'
                    } border border-white/10 px-2 py-1 rounded-full text-[10px] md:text-xs font-medium`}
                  animate={{
                    scale: answeredCount > 0 ? [1, 1.15, 1] : 1,
                    transition: { duration: 0.5 },
                  }}
                >
                  <Users className='h-3 w-3 md:h-3.5 md:w-3.5 text-[rgb(198,234,132)]' />
                  <span
                    className={
                      answeredCount >= totalParticipants
                        ? 'text-[rgb(198,234,132)]'
                        : 'text-[rgb(255,198,121)]'
                    }
                  >
                    {answeredCount}
                  </span>
                  <span className='text-white/50'>/{totalParticipants}</span>
                  <span className='ml-1 text-[9px] md:text-xs opacity-75'>
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
          <div className='flex flex-col items-center z-10 px-3 md:px-5 py-5 md:py-7'>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className='w-full flex flex-col items-center justify-center'
            >
              <h2 className='text-sm md:text-lg lg:text-xl font-bold text-center text-white drop-shadow-lg'>
                {activity.quiz.questionText}
              </h2>
              {/* {activity.description && (
                <p className='mt-1 text-xs md:text-sm text-white/80 text-center'>
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
                Math.max(0, (timeLeft / activity.quiz.timeLimitSeconds) * 100)
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

        {/* Content */}
        <div className='p-3 md:p-6 bg-black bg-opacity-20'>
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

          {/* Thông báo đã gửi câu trả lời khi submit nhưng chưa kết thúc quiz */}
          {isAnswered && !isQuizEnded && (
            <motion.div
              className='mt-6 p-4 rounded-xl bg-black bg-opacity-30 border border-[rgb(198,234,132)]/30 text-white/90'
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

          {/* Results */}
          <AnimatePresence>
            {(isSubmitted && isQuizEnded) ||
            activity.hostShowAnswer ||
            isQuizEnded ? (
              <motion.div
                className='mt-6 p-4 rounded-xl bg-black bg-opacity-30 border border-white/10'
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              >
                {activity.hostShowAnswer && !isSubmitted ? (
                  <motion.div
                    className='flex items-center gap-2 mb-3 text-[rgb(198,234,132)]'
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2, type: 'spring', stiffness: 400 }}
                  >
                    <motion.div
                      animate={{ rotate: [0, 360] }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: 'linear',
                      }}
                    >
                      <CheckCircle className='h-5 w-5' />
                    </motion.div>
                    <span className='font-semibold'>
                      {isChainReactionActive
                        ? `Đáp án chính xác (đang di chuyển phần tử ${
                            chainReactionIndex + 1
                          }/${correctOrder.length}):`
                        : 'Đáp án chính xác (các phần tử đã di chuyển về vị trí đúng):'}
                    </span>
                  </motion.div>
                ) : isQuizEnded && !isSubmitted ? (
                  <motion.div
                    className='flex items-center gap-2 mb-3 text-[rgb(198,234,132)]'
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2, type: 'spring', stiffness: 400 }}
                  >
                    <motion.div
                      animate={{ rotate: [0, 360] }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: 'linear',
                      }}
                    >
                      <CheckCircle className='h-5 w-5' />
                    </motion.div>
                    <span className='font-semibold'>
                      {isChainReactionActive
                        ? `Thứ tự đúng (đang di chuyển phần tử ${
                            chainReactionIndex + 1
                          }/${correctOrder.length}):`
                        : 'Thứ tự đúng (các phần tử đã di chuyển về vị trí đúng):'}
                    </span>
                  </motion.div>
                ) : (
                  <motion.div
                    className='flex items-center gap-2 mb-3'
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2, type: 'spring', stiffness: 400 }}
                  >
                    <div className='flex items-center gap-2'>
                      {isCorrect ? (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{
                            delay: 0.3,
                            type: 'spring',
                            stiffness: 500,
                          }}
                        >
                          <CheckCircle className='h-5 w-5 text-[rgb(198,234,132)]' />
                        </motion.div>
                      ) : (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{
                            delay: 0.3,
                            type: 'spring',
                            stiffness: 500,
                          }}
                        >
                          <XCircle className='h-5 w-5 text-[rgb(255,182,193)]' />
                        </motion.div>
                      )}
                      <span
                        className={`font-semibold ${
                          isCorrect
                            ? 'text-[rgb(198,234,132)]'
                            : 'text-[rgb(255,182,193)]'
                        }`}
                      >
                        {isCorrect ? 'Đúng' : 'Sai'}
                      </span>
                    </div>
                    {!isCorrect && (
                      <motion.span
                        className='text-white/70 ml-2'
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 }}
                      >
                        {isChainReactionActive
                          ? `(Đang di chuyển phần tử ${
                              chainReactionIndex + 1
                            }/${correctOrder.length} về vị trí đúng)`
                          : '(Các phần tử đã di chuyển về vị trí đúng)'}
                      </motion.span>
                    )}
                  </motion.div>
                )}
              </motion.div>
            ) : null}
          </AnimatePresence>

          <motion.div
            className='space-y-3 md:space-y-4'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {/* DnD list */}
            <motion.div
              className={`bg-black bg-opacity-30 p-1 md:p-2 rounded-xl border ${
                showCorrectOrder
                  ? 'border-[rgb(198,234,132)]/30 shadow-lg shadow-[rgb(198,234,132)]/10'
                  : 'border-white/5'
              }`}
              animate={
                showCorrectOrder
                  ? {
                      boxShadow: [
                        '0 0 0 rgba(198,234,132,0.1)',
                        '0 0 20px rgba(198,234,132,0.3)',
                        '0 0 0 rgba(198,234,132,0.1)',
                      ],
                    }
                  : {}
              }
              transition={{
                duration: 2,
                repeat: showCorrectOrder ? Infinity : 0,
              }}
            >
              <SortableList
                items={items}
                onChange={setItems}
                disabled={isAnswered || isQuizEnded || showCorrectOrder}
                showAnimation={showCorrectOrder}
                chainReactionIndex={chainReactionIndex}
                isChainReactionActive={isChainReactionActive}
              />
            </motion.div>

            {/* Submit Button */}
            {!isSubmitted && isParticipating && (
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
                      <span>Gửi câu trả lời</span>
                      <ArrowRight className='h-5 w-5' />
                    </>
                  )}
                </Button>
              </motion.div>
            )}
          </motion.div>
        </div>
      </Card>
    </div>
  );
};
