'use client';

import type React from 'react';
import { useState, useRef, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  Loader2,
  CheckCircle,
  XCircle,
  Link,
  Clock,
  Users,
} from 'lucide-react';
import { SessionWebSocket } from '@/websocket/sessionWebSocket';

// Define types based on WebSocket data structure
interface MatchingPairItem {
  quizMatchingPairItemId: string;
  content: string;
  isLeftColumn: boolean;
  displayOrder: number;
}

interface MatchingPairConnection {
  quizMatchingPairConnectionId: string;
  leftItem: MatchingPairItem;
  rightItem: MatchingPairItem;
}

export interface ActivityData {
  activityId: string;
  activityType: 'QUIZ_MATCHING_PAIRS';
  title: string;
  description: string;
  quiz: {
    quizId: string;
    questionText: string;
    timeLimitSeconds: number;
    pointType: string;
    quizMatchingPairAnswer: {
      leftColumnName: string;
      rightColumnName: string;
      items: MatchingPairItem[];
      connections?: MatchingPairConnection[];
    };
  };
  backgroundImage?: string;
  hostShowAnswer?: boolean;
}

interface QuizMatchingPairViewerProps {
  activity: ActivityData;
  sessionWebSocket: SessionWebSocket;
  sessionCode: string;
  sessionId?: string;
  isParticipating?: boolean;
}

const shuffleArray = <T,>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

const PAIR_COLORS = [
  '#3b82f6', // Blue
  '#8b5cf6', // Purple
  '#06b6d4', // Cyan
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#ef4444', // Red
  '#ec4899', // Pink
];

interface UserConnection {
  leftId: string;
  rightId: string;
}

export function QuizMatchingPairViewer({
  activity,
  sessionWebSocket,
  sessionCode,
  sessionId,
  isParticipating = true,
}: QuizMatchingPairViewerProps) {
  const { t } = useTranslation();
  const [userConnections, setUserConnections] = useState<UserConnection[]>([]);
  const [selectedItem, setSelectedItem] = useState<{
    id: string;
    type: 'left' | 'right';
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Thêm states cho hiển thị đáp án
  const [timeLeft, setTimeLeft] = useState(activity.quiz.timeLimitSeconds);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [totalParticipants, setTotalParticipants] = useState(0);
  const [isQuizEnded, setIsQuizEnded] = useState(false);
  const [showCorrectAnswer, setShowCorrectAnswer] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [correctConnections, setCorrectConnections] = useState<
    UserConnection[]
  >([]);
  const [isAnimatingAnswer, setIsAnimatingAnswer] = useState(false);
  const [animationPhase, setAnimationPhase] = useState<
    'hiding_wrong' | 'showing_correct' | 'completed'
  >('completed');

  const { quiz, backgroundImage } = activity;
  const { quizMatchingPairAnswer } = quiz;
  const { leftColumnName, rightColumnName, items, connections } =
    quizMatchingPairAnswer;

  const [shuffledLeftColumn, setShuffledLeftColumn] = useState<
    MatchingPairItem[]
  >([]);
  const [shuffledRightColumn, setShuffledRightColumn] = useState<
    MatchingPairItem[]
  >([]);
  const [previewUpdate, setPreviewUpdate] = useState(0);

  useEffect(() => {
    const leftItems = items.filter((item) => item.isLeftColumn);
    const rightItems = items.filter((item) => !item.isLeftColumn);
    setShuffledLeftColumn(shuffleArray(leftItems));
    setShuffledRightColumn(shuffleArray(rightItems));
    setUserConnections([]); // Reset connections when question changes
    setSelectedItem(null);
  }, [items]);

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setPreviewUpdate((prev) => prev + 1);
      }
    };
    const resizeObserver = new ResizeObserver(updateSize);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }
    return () => resizeObserver.disconnect();
  }, []);

  const colorMap = useMemo(() => {
    const map = new Map<string, string>();
    userConnections.forEach((conn, index) => {
      const color = PAIR_COLORS[index % PAIR_COLORS.length];
      map.set(conn.leftId, color);
      map.set(conn.rightId, color);
    });
    return map;
  }, [userConnections]);

  const handleItemClick = (type: 'left' | 'right', itemId: string) => {
    if (isSubmitting || !isParticipating) return;

    const existingConnection = userConnections.find(
      (c) => c.leftId === itemId || c.rightId === itemId
    );
    if (existingConnection) {
      setUserConnections((prev) =>
        prev.filter((c) => c.leftId !== itemId && c.rightId !== itemId)
      );
      setSelectedItem(null);
      return;
    }

    if (selectedItem) {
      if (selectedItem.type !== type) {
        const newConnection = {
          leftId: type === 'right' ? selectedItem.id : itemId,
          rightId: type === 'left' ? selectedItem.id : itemId,
        };
        setUserConnections((prev) => [...prev, newConnection]);
        setSelectedItem(null);
      } else {
        setSelectedItem({ id: itemId, type });
      }
    } else {
      setSelectedItem({ id: itemId, type });
    }
  };

  // Thêm useEffect để đếm ngược thời gian
  useEffect(() => {
    if (timeLeft > 0 && !isSubmitted) {
      const timer = setInterval(() => setTimeLeft((t) => t - 1), 1000);
      return () => clearInterval(timer);
    }
  }, [timeLeft, isSubmitted]);

  // Thêm useEffect để kiểm tra khi nào quiz kết thúc
  useEffect(() => {
    if (
      timeLeft <= 0 ||
      (answeredCount > 0 && answeredCount >= totalParticipants)
    ) {
      setIsQuizEnded(true);
    }
  }, [timeLeft, answeredCount, totalParticipants]);

  // Thêm useEffect để cập nhật participants từ WebSocket
  useEffect(() => {
    if (!sessionWebSocket) return;

    const updateResponseRatio = () => {
      const participantsRatio = sessionWebSocket.getParticipantsEventRatio();
      setAnsweredCount(participantsRatio.count);
      setTotalParticipants(participantsRatio.total);
    };

    updateResponseRatio();
    const intervalId = setInterval(updateResponseRatio, 2000);

    sessionWebSocket.onParticipantsUpdateHandler(() => {
      updateResponseRatio();
    });

    return () => {
      clearInterval(intervalId);
    };
  }, [sessionWebSocket]);

  // Thêm useEffect để xử lý hiển thị đáp án
  useEffect(() => {
    const shouldShowAnswer =
      (isSubmitted && isQuizEnded) ||
      activity.hostShowAnswer ||
      (isQuizEnded && !isSubmitted);

    if (shouldShowAnswer && !showCorrectAnswer && connections) {
      setShowCorrectAnswer(true);
      setIsAnimatingAnswer(true);

      // Tạo correct connections từ data
      const correctConns = connections.map((conn) => ({
        leftId: conn.leftItem.quizMatchingPairItemId,
        rightId: conn.rightItem.quizMatchingPairItemId,
      }));
      setCorrectConnections(correctConns);

      // Kiểm tra độ chính xác của user
      if (isSubmitted) {
        const userCorrect =
          userConnections.length === correctConns.length &&
          userConnections.every((userConn) =>
            correctConns.some(
              (correctConn) =>
                correctConn.leftId === userConn.leftId &&
                correctConn.rightId === userConn.rightId
            )
          );
        setIsCorrect(userCorrect);
      }

      // Bắt đầu animation sequence
      setTimeout(() => {
        // Phase 1: Ẩn các kết nối sai
        setAnimationPhase('hiding_wrong');

        setTimeout(() => {
          // Phase 2: Hiển thị kết nối đúng
          setAnimationPhase('showing_correct');
          setUserConnections(correctConns);

          setTimeout(() => {
            // Phase 3: Hoàn thành
            setAnimationPhase('completed');
            setIsAnimatingAnswer(false);
          }, 1000);
        }, 800);
      }, 500);
    }
  }, [
    isSubmitted,
    isQuizEnded,
    activity.hostShowAnswer,
    connections,
    showCorrectAnswer,
    userConnections,
  ]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const handleSubmit = async () => {
    if (isSubmitting || isSubmitted || !isParticipating) return;
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const answerArray = userConnections.flatMap((conn) => [
        conn.leftId,
        conn.rightId,
      ]);
      const answerContent = answerArray.join(',');
      await sessionWebSocket.submitActivity({
        sessionId,
        activityId: activity.activityId,
        answerContent,
      });
      setIsSubmitted(true);
    } catch (err) {
      setSubmitError('Không thể gửi câu trả lời. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getConnectionPath = (aId: string, bId: string) => {
    const aElement = document.getElementById(`item-${aId}`);
    const bElement = document.getElementById(`item-${bId}`);
    const svgElement = svgRef.current;

    if (!aElement || !bElement || !svgElement) return '';

    const svgRect = svgElement.getBoundingClientRect();
    const aRect = aElement.getBoundingClientRect();
    const bRect = bElement.getBoundingClientRect();

    const startX = aRect.right - svgRect.left;
    const startY = aRect.top + aRect.height / 2 - svgRect.top;
    const endX = bRect.left - svgRect.left;
    const endY = bRect.top + bRect.height / 2 - svgRect.top;

    const controlX1 = startX + (endX - startX) * 0.25;
    const controlY = startY + (endY - startY) / 2;
    const controlX2 = startX + (endX - startX) * 0.75;

    return `M ${startX} ${startY} C ${controlX1} ${startY}, ${controlX2} ${endY}, ${endX} ${endY}`;
  };

  return (
    <div
      className='flex flex-col h-full w-full relative overflow-hidden'
      style={{
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Background overlay */}
      <div className='absolute inset-0 bg-gradient-to-br from-blue-50/90 via-white/95 to-purple-50/90 dark:from-gray-900/95 dark:via-gray-800/95 dark:to-gray-900/95'></div>

      {/* Header với thời gian và số người tham gia */}
      <div className='relative z-10 p-4 md:p-6'>
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className='flex justify-between items-center mb-4'
        >
          {/* Timer */}
          <motion.div
            className='flex items-center gap-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20'
            animate={{
              scale: timeLeft < 10 ? [1, 1.05, 1] : 1,
            }}
            transition={{
              duration: 0.5,
              repeat: timeLeft < 10 ? Infinity : 0,
              repeatType: 'reverse',
            }}
          >
            <Clock className='h-4 w-4 text-blue-600' />
            <span
              className={`font-mono font-bold ${
                timeLeft < 10
                  ? 'text-red-600'
                  : 'text-gray-700 dark:text-gray-300'
              }`}
            >
              {formatTime(timeLeft)}
            </span>
          </motion.div>

          {/* Participants counter */}
          <motion.div
            className='flex items-center gap-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20'
            animate={{
              scale: answeredCount > 0 ? [1, 1.05, 1] : 1,
            }}
            transition={{ duration: 0.3 }}
          >
            <Users className='h-4 w-4 text-purple-600' />
            <span className='font-semibold text-gray-700 dark:text-gray-300'>
              {answeredCount}/{totalParticipants}
            </span>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className='text-center'
        >
          <h1 className='text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2'>
            {activity.title}
          </h1>
          {activity.description && (
            <p className='text-gray-600 dark:text-gray-300 text-sm md:text-base max-w-2xl mx-auto'>
              {activity.description}
            </p>
          )}
        </motion.div>
      </div>

      {/* Progress bars */}
      <div className='relative z-10 w-full'>
        {/* Time Progress */}
        <motion.div
          className='h-1 bg-gradient-to-r from-blue-500 to-blue-600'
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
          className='h-1 bg-gradient-to-r from-purple-500 to-purple-600'
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

      <div className='flex-grow p-4 md:p-6 flex items-center justify-center relative z-10'>
        <div
          ref={containerRef}
          className='matching-pair-preview relative p-6 md:p-8 rounded-2xl bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl shadow-2xl w-full max-w-6xl border border-white/20'
        >
          {/* Question text */}
          {quiz.questionText && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className='mb-6 text-center'
            >
              <h2 className='text-lg md:text-xl font-semibold text-gray-800 dark:text-gray-200'>
                {quiz.questionText}
              </h2>
            </motion.div>
          )}

          {/* Results display khi có đáp án */}
          <AnimatePresence>
            {showCorrectAnswer && (
              <motion.div
                className='mb-6 p-4 rounded-xl bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-700 dark:to-gray-600 border border-blue-200 dark:border-gray-500'
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              >
                {activity.hostShowAnswer && !isSubmitted ? (
                  <motion.div
                    className='flex items-center gap-2 text-blue-600 dark:text-blue-400'
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2, type: 'spring', stiffness: 400 }}
                  >
                    <CheckCircle className='h-5 w-5' />
                    <span className='font-semibold'>
                      {isAnimatingAnswer
                        ? 'Đang hiển thị đáp án chính xác...'
                        : 'Đáp án chính xác:'}
                    </span>
                  </motion.div>
                ) : isQuizEnded && !isSubmitted ? (
                  <motion.div
                    className='flex items-center gap-2 text-blue-600 dark:text-blue-400'
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2, type: 'spring', stiffness: 400 }}
                  >
                    <CheckCircle className='h-5 w-5' />
                    <span className='font-semibold'>
                      {isAnimatingAnswer
                        ? 'Đang hiển thị đáp án đúng...'
                        : 'Đáp án đúng:'}
                    </span>
                  </motion.div>
                ) : (
                  <motion.div
                    className='flex items-center gap-2'
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2, type: 'spring', stiffness: 400 }}
                  >
                    {isCorrect ? (
                      <CheckCircle className='h-5 w-5 text-green-600' />
                    ) : (
                      <XCircle className='h-5 w-5 text-red-600' />
                    )}
                    <span
                      className={`font-semibold ${
                        isCorrect ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {isCorrect ? 'Chính xác!' : 'Chưa chính xác'}
                    </span>
                    {!isCorrect && (
                      <span className='text-gray-600 dark:text-gray-400 ml-2'>
                        {isAnimatingAnswer
                          ? '(Đang hiển thị đáp án đúng...)'
                          : '(Đáp án đúng đã được hiển thị)'}
                      </span>
                    )}
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Thông báo đã gửi câu trả lời */}
          {isSubmitted && !isQuizEnded && (
            <motion.div
              className='mb-6 p-4 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300'
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className='flex items-center gap-2'>
                <CheckCircle className='h-5 w-5' />
                <span className='font-semibold'>Đã gửi câu trả lời!</span>
              </div>
              <p className='mt-1 text-sm'>
                Câu trả lời của bạn đã được ghi nhận. Kết quả sẽ được hiển thị
                khi quiz kết thúc.
              </p>
            </motion.div>
          )}

          <div className='flex justify-between items-start gap-6 md:gap-12'>
            {/* Left Column - với hiệu ứng khi hiển thị đáp án */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{
                opacity: 1,
                x: 0,
                scale: showCorrectAnswer ? [1, 1.02, 1] : 1,
              }}
              transition={{
                duration: showCorrectAnswer ? 2 : 0.5,
                repeat: showCorrectAnswer ? 3 : 0,
              }}
              className='w-1/2 flex flex-col items-center gap-4'
            >
              <div className='relative'>
                <h3
                  className={`font-bold text-xl text-center text-gray-700 dark:text-gray-200 mb-4 px-6 py-3 text-white rounded-full shadow-lg transition-all duration-500 ${
                    showCorrectAnswer
                      ? 'bg-gradient-to-r from-green-500 to-green-600'
                      : 'bg-gradient-to-r from-blue-500 to-blue-600'
                  }`}
                >
                  {leftColumnName}
                </h3>
                <div
                  className={`absolute -top-2 -left-2 w-4 h-4 rounded-full animate-pulse transition-colors duration-500 ${
                    showCorrectAnswer ? 'bg-green-400' : 'bg-blue-400'
                  }`}
                ></div>
              </div>
              {/* Left column items */}
              <div className='w-full space-y-3'>
                {shuffledLeftColumn.map((item, index) => {
                  const connectionColor = colorMap.get(
                    item.quizMatchingPairItemId
                  );
                  const isSelected =
                    selectedItem?.id === item.quizMatchingPairItemId;
                  const isConnected = connectionColor;

                  return (
                    <motion.div
                      key={item.quizMatchingPairItemId}
                      id={`item-${item.quizMatchingPairItemId}`}
                      initial={{ opacity: 0, x: -30 }}
                      animate={{
                        opacity: 1,
                        x: 0,
                        scale:
                          showCorrectAnswer && isConnected ? [1, 1.05, 1] : 1,
                      }}
                      transition={{
                        delay: index * 0.1,
                        scale: { duration: 0.3, delay: index * 0.1 },
                      }}
                      className={cn(
                        'p-4 rounded-xl text-center transition-all duration-500 w-full border-2 relative overflow-hidden group',
                        isParticipating &&
                          !showCorrectAnswer &&
                          'cursor-pointer hover:shadow-lg',
                        isSelected
                          ? 'ring-4 ring-blue-400 ring-opacity-50 shadow-xl scale-105'
                          : '',
                        isConnected
                          ? 'text-white shadow-xl'
                          : 'bg-gradient-to-r from-white to-gray-50 dark:from-gray-700 dark:to-gray-600 text-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-400'
                      )}
                      style={
                        isConnected
                          ? {
                              backgroundColor: connectionColor,
                              borderColor: connectionColor,
                              boxShadow: `0 10px 25px -5px ${connectionColor}40`,
                            }
                          : {}
                      }
                      onClick={() =>
                        !showCorrectAnswer &&
                        handleItemClick('left', item.quizMatchingPairItemId)
                      }
                      whileHover={{
                        scale: isParticipating && !showCorrectAnswer ? 1.02 : 1,
                        y: isParticipating && !showCorrectAnswer ? -2 : 0,
                      }}
                      whileTap={{ scale: !showCorrectAnswer ? 0.98 : 1 }}
                      layout
                    >
                      {/* Connection indicator */}
                      {/* {isConnected && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className='absolute -top-1 -right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-md'
                        >
                          <Link className='w-3 h-3 text-gray-600' />
                        </motion.div>
                      )} */}

                      {/* Selection indicator */}
                      {isSelected && !showCorrectAnswer && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className='absolute -top-1 -left-1 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center shadow-md'
                        >
                          <CheckCircle className='w-3 h-3 text-white' />
                        </motion.div>
                      )}

                      <p className='text-sm md:text-base font-medium leading-relaxed'>
                        {item.content}
                      </p>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>

            {/* Center divider */}
            <div
              className={`absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-px h-3/4 transition-all duration-500 ${
                showCorrectAnswer
                  ? 'bg-gradient-to-b from-transparent via-green-400 to-transparent'
                  : 'bg-gradient-to-b from-transparent via-gray-300 dark:via-gray-600 to-transparent'
              }`}
            ></div>

            {/* Right Column - với hiệu ứng tương tự */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{
                opacity: 1,
                x: 0,
                scale: showCorrectAnswer ? [1, 1.02, 1] : 1,
              }}
              transition={{
                duration: showCorrectAnswer ? 2 : 0.5,
                repeat: showCorrectAnswer ? 3 : 0,
              }}
              className='w-1/2 flex flex-col items-center gap-4'
            >
              <div className='relative'>
                <h3
                  className={`font-bold text-xl text-center text-gray-700 dark:text-gray-200 mb-4 px-6 py-3 text-white rounded-full shadow-lg transition-all duration-500 ${
                    showCorrectAnswer
                      ? 'bg-gradient-to-r from-green-500 to-green-600'
                      : 'bg-gradient-to-r from-purple-500 to-purple-600'
                  }`}
                >
                  {rightColumnName}
                </h3>
                <div
                  className={`absolute -top-2 -right-2 w-4 h-4 rounded-full animate-pulse transition-colors duration-500 ${
                    showCorrectAnswer ? 'bg-green-400' : 'bg-purple-400'
                  }`}
                ></div>
              </div>
              {/* Right column items */}
              <div className='w-full space-y-3'>
                {shuffledRightColumn.map((item, index) => {
                  const connectionColor = colorMap.get(
                    item.quizMatchingPairItemId
                  );
                  const isSelected =
                    selectedItem?.id === item.quizMatchingPairItemId;
                  const isConnected = connectionColor;

                  return (
                    <motion.div
                      key={item.quizMatchingPairItemId}
                      id={`item-${item.quizMatchingPairItemId}`}
                      initial={{ opacity: 0, x: 30 }}
                      animate={{
                        opacity: 1,
                        x: 0,
                        scale:
                          showCorrectAnswer && isConnected ? [1, 1.05, 1] : 1,
                      }}
                      transition={{
                        delay: index * 0.1,
                        scale: { duration: 0.3, delay: index * 0.1 },
                      }}
                      className={cn(
                        'p-4 rounded-xl text-center transition-all duration-500 w-full border-2 relative overflow-hidden group',
                        isParticipating &&
                          !showCorrectAnswer &&
                          'cursor-pointer hover:shadow-lg',
                        isSelected
                          ? 'ring-4 ring-purple-400 ring-opacity-50 shadow-xl scale-105'
                          : '',
                        isConnected
                          ? 'text-white shadow-xl'
                          : 'bg-gradient-to-r from-white to-gray-50 dark:from-gray-700 dark:to-gray-600 text-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-600 hover:border-purple-300 dark:hover:border-purple-400'
                      )}
                      style={
                        isConnected
                          ? {
                              backgroundColor: connectionColor,
                              borderColor: connectionColor,
                              boxShadow: `0 10px 25px -5px ${connectionColor}40`,
                            }
                          : {}
                      }
                      onClick={() =>
                        !showCorrectAnswer &&
                        handleItemClick('right', item.quizMatchingPairItemId)
                      }
                      whileHover={{
                        scale: isParticipating && !showCorrectAnswer ? 1.02 : 1,
                        y: isParticipating && !showCorrectAnswer ? -2 : 0,
                      }}
                      whileTap={{ scale: !showCorrectAnswer ? 0.98 : 1 }}
                      layout
                    >
                      {/* Connection indicator */}
                      {/* {isConnected && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className='absolute -top-1 -left-1 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-md'
                        >
                          <Link className='w-3 h-3 text-gray-600' />
                        </motion.div>
                      )} */}

                      {/* Selection indicator */}
                      {isSelected && !showCorrectAnswer && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className='absolute -top-1 -right-1 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center shadow-md'
                        >
                          <CheckCircle className='w-3 h-3 text-white' />
                        </motion.div>
                      )}

                      <p className='text-sm md:text-base font-medium leading-relaxed'>
                        {item.content}
                      </p>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          </div>

          {/* Connection lines với animation cải tiến */}
          <svg
            ref={svgRef}
            className='absolute top-0 left-0 w-full h-full pointer-events-none'
            style={{ zIndex: 1 }}
            key={previewUpdate}
          >
            <defs>
              {PAIR_COLORS.map((color) => (
                <marker
                  key={color}
                  id={`marker-${color.replace('#', '')}`}
                  markerWidth='12'
                  markerHeight='12'
                  refX='6'
                  refY='6'
                  orient='auto'
                >
                  <circle
                    cx='6'
                    cy='6'
                    r='5'
                    fill={color}
                    stroke='white'
                    strokeWidth='2'
                  />
                </marker>
              ))}
            </defs>
            <g>
              <AnimatePresence>
                {userConnections.map((conn, index) => {
                  const pathColor = colorMap.get(conn.leftId) || PAIR_COLORS[0];
                  const isCorrectConnection = correctConnections.some(
                    (correctConn) =>
                      correctConn.leftId === conn.leftId &&
                      correctConn.rightId === conn.rightId
                  );

                  // Quyết định hiển thị dựa trên animation phase
                  const shouldShow =
                    !isAnimatingAnswer ||
                    (animationPhase === 'hiding_wrong' &&
                      isCorrectConnection) ||
                    animationPhase === 'showing_correct' ||
                    animationPhase === 'completed';

                  if (!shouldShow) return null;

                  return (
                    <motion.path
                      key={`${conn.leftId}-${conn.rightId}`}
                      d={getConnectionPath(conn.leftId, conn.rightId)}
                      stroke={
                        showCorrectAnswer && isCorrectConnection
                          ? '#10b981'
                          : pathColor
                      }
                      strokeWidth={
                        showCorrectAnswer && isCorrectConnection ? '4' : '3'
                      }
                      fill='none'
                      strokeLinecap='round'
                      initial={{
                        pathLength: 0,
                        opacity: 0,
                        strokeWidth: 3,
                      }}
                      animate={{
                        pathLength: 1,
                        opacity:
                          animationPhase === 'hiding_wrong' &&
                          !isCorrectConnection
                            ? 0
                            : 1,
                        strokeWidth:
                          showCorrectAnswer && isCorrectConnection ? 4 : 3,
                      }}
                      exit={{
                        pathLength: 0,
                        opacity: 0,
                        transition: { duration: 0.3 },
                      }}
                      transition={{
                        pathLength: { duration: 0.5, ease: 'easeOut' },
                        opacity: { duration: 0.3 },
                        strokeWidth: { duration: 0.3 },
                      }}
                      markerStart={`url(#marker-${(showCorrectAnswer &&
                      isCorrectConnection
                        ? '#10b981'
                        : pathColor
                      ).replace('#', '')})`}
                      markerEnd={`url(#marker-${(showCorrectAnswer &&
                      isCorrectConnection
                        ? '#10b981'
                        : pathColor
                      ).replace('#', '')})`}
                      filter='drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
                      style={{
                        filter:
                          showCorrectAnswer && isCorrectConnection
                            ? 'drop-shadow(0 0 8px rgba(16, 185, 129, 0.5))'
                            : 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))',
                      }}
                    />
                  );
                })}
              </AnimatePresence>
            </g>
          </svg>
        </div>
      </div>

      {/* Footer with submit button */}
      {isParticipating && !isSubmitted && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className='w-full px-4 pb-6 md:px-8 md:pb-8 relative z-10'
        >
          <div className='max-w-md mx-auto'>
            <Button
              onClick={handleSubmit}
              disabled={
                isSubmitting ||
                isSubmitted ||
                userConnections.length === 0 ||
                timeLeft <= 0
              }
              className={cn(
                'w-full text-lg font-bold py-6 rounded-2xl shadow-xl transition-all duration-300 transform',
                isSubmitted
                  ? 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700'
                  : 'bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 hover:scale-105',
                (userConnections.length === 0 || timeLeft <= 0) &&
                  'opacity-50 cursor-not-allowed hover:scale-100'
              )}
            >
              {isSubmitting ? (
                <Loader2 className='mr-3 h-6 w-6 animate-spin' />
              ) : isSubmitted ? (
                <CheckCircle className='mr-3 h-6 w-6' />
              ) : (
                <Link className='mr-3 h-6 w-6' />
              )}
              {isSubmitted
                ? t('Đã gửi câu trả lời')
                : isSubmitting
                ? t('Đang gửi...')
                : timeLeft <= 0
                ? t('Hết thời gian')
                : t('Gửi câu trả lời')}
            </Button>

            {/* Progress indicator */}
            <div className='mt-4 text-center'>
              <div className='flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-400'>
                <div className='flex gap-1'>
                  {Array.from({ length: items.length / 2 }).map((_, index) => (
                    <div
                      key={index}
                      className={cn(
                        'w-2 h-2 rounded-full transition-all duration-300',
                        index < userConnections.length
                          ? showCorrectAnswer
                            ? 'bg-green-500'
                            : 'bg-blue-500'
                          : 'bg-gray-300 dark:bg-gray-600'
                      )}
                    />
                  ))}
                </div>
                <span className='ml-2'>
                  {userConnections.length} / {items.length / 2} cặp
                </span>
              </div>
            </div>

            {submitError && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className='mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2 text-red-600 dark:text-red-400 text-sm'
              >
                <XCircle className='w-4 h-4' />
                {submitError}
              </motion.div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}
