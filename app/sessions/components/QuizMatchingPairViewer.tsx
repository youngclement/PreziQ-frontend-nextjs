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
  Link2,
  Image,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';
import { SessionWebSocket } from '@/websocket/sessionWebSocket';
import { Card } from '@/components/ui/card';

// Add shimmer animation styles
const shimmerStyles = `
  @keyframes shimmer {
    0% {
      transform: translateX(-100%) skewX(-12deg);
    }
    100% {
      transform: translateX(200%) skewX(-12deg);
    }
  }
  
  .animate-shimmer {
    animation: shimmer 3s ease-in-out infinite;
  }
  
  /* Mobile text handling improvements */
  .mobile-text-fix {
    word-wrap: break-word;
    overflow-wrap: break-word;
    word-break: break-word;
    hyphens: auto;
    -webkit-hyphens: auto;
    -moz-hyphens: auto;
    line-height: 1.4;
  }
  
  .item-container {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 45px;
    padding: 8px 6px;
    font-size: 0.75rem;
  }
  
  @media (min-width: 640px) {
    .item-container {
      min-height: 55px;
      padding: 10px 8px;
      font-size: 0.875rem;
    }
  }
  
  @media (min-width: 768px) {
    .item-container {
      min-height: 65px;
      padding: 12px 10px;
      font-size: 0.875rem;
    }
  }
  
  @media (min-width: 1024px) {
    .item-container {
      min-height: 70px;
      padding: 16px;
      font-size: 1rem;
    }
  }
`;

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
  backgroundColor?: string;
}

interface QuizMatchingPairViewerProps {
  activity: ActivityData;
  sessionWebSocket: SessionWebSocket;
  sessionCode: string;
  sessionId?: string;
  isParticipating?: boolean;
  isFullscreenMode?: boolean;
}

const shuffleArray = <T,>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

// Updated colors to match question-viewer
const PAIR_COLORS = [
  '#3b82f6', // blue
  '#a855f7', // purple
  '#eab308', // yellow
  '#f97316', // orange
  '#06b6d4', // cyan
  '#ec4899', // pink
  '#6366f1', // indigo
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
  isFullscreenMode = false,
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
  const [error, setError] = useState<string | null>(null);
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
  const [forceUpdate, setForceUpdate] = useState(0);

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

  // Thêm state để theo dõi khi cần redraw connections
  const [shouldRedrawConnections, setShouldRedrawConnections] = useState(false);

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
        setForceUpdate((prev) => prev + 1);
      }
    };
    const resizeObserver = new ResizeObserver(updateSize);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }
    return () => resizeObserver.disconnect();
  }, []);

  // Thêm useEffect để theo dõi thay đổi fullscreen mode
  useEffect(() => {
    // Delay một chút để đảm bảo layout đã hoàn thành
    const timer = setTimeout(() => {
      setForceUpdate((prev) => prev + 1);
      setShouldRedrawConnections(true);
    }, 300); // Tăng delay để đợi animation hoàn thành

    return () => clearTimeout(timer);
  }, [isFullscreenMode]);

  // Thêm useEffect để theo dõi thay đổi kích thước window (bao gồm sidebar)
  useEffect(() => {
    const handleResize = () => {
      // Delay để đảm bảo layout đã hoàn thành
      setTimeout(() => {
        setForceUpdate((prev) => prev + 1);
        setShouldRedrawConnections(true);
      }, 400); // Tăng delay để đợi animation hoàn thành
    };

    // Lắng nghe event từ leaderboard để biết khi nào sidebar thay đổi
    const handleLeaderboardChange = (event: CustomEvent) => {
      console.log(
        '[QuizMatchingPair] Leaderboard layout changed:',
        event.detail
      );
      setTimeout(() => {
        setForceUpdate((prev) => prev + 1);
        setShouldRedrawConnections(true);
      }, 500); // Tăng delay để đảm bảo animation hoàn thành
    };

    // Lắng nghe event từ sidebar toggle
    const handleSidebarChange = (event: CustomEvent) => {
      console.log('[QuizMatchingPair] Sidebar layout changed:', event.detail);
      setTimeout(() => {
        setForceUpdate((prev) => prev + 1);
        setShouldRedrawConnections(true);
      }, 600); // Tăng delay để đảm bảo sidebar animation hoàn thành
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener(
      'leaderboardLayoutChange',
      handleLeaderboardChange as EventListener
    );
    window.addEventListener(
      'sidebarLayoutChange',
      handleSidebarChange as EventListener
    );

    // Theo dõi thay đổi DOM để phát hiện sidebar toggle
    const observer = new MutationObserver(() => {
      setTimeout(() => {
        setShouldRedrawConnections(true);
      }, 300); // Tăng delay để đợi animation
    });

    // Observe changes to the body class (có thể có class cho sidebar state)
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['class'],
      subtree: true,
    });

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener(
        'leaderboardLayoutChange',
        handleLeaderboardChange as EventListener
      );
      window.removeEventListener(
        'sidebarLayoutChange',
        handleSidebarChange as EventListener
      );
      observer.disconnect();
    };
  }, []);

  // Thêm useEffect để redraw connections khi cần thiết
  useEffect(() => {
    if (shouldRedrawConnections) {
      const timer = setTimeout(() => {
        setForceUpdate((prev) => prev + 1);
        setShouldRedrawConnections(false);
      }, 150); // Tăng delay để đợi animation hoàn thành

      return () => clearTimeout(timer);
    }
  }, [shouldRedrawConnections]);

  // Đảm bảo user connections luôn sync với correct connections khi show answer và layout thay đổi
  useEffect(() => {
    if (
      showCorrectAnswer &&
      correctConnections.length > 0 &&
      animationPhase === 'completed'
    ) {
      setUserConnections([...correctConnections]);
    }
  }, [forceUpdate, showCorrectAnswer, correctConnections, animationPhase]);

  // Thêm logic để force redraw khi layout thay đổi trong khi hiển thị đáp án
  useEffect(() => {
    if (showCorrectAnswer && shouldRedrawConnections) {
      // Trigger thêm một lần force update để đảm bảo paths được redraw
      setTimeout(() => {
        setForceUpdate((prev) => prev + 1);
      }, 200); // Tăng delay để đợi animation hoàn thành
    }
  }, [showCorrectAnswer, shouldRedrawConnections]);

  // Create color map for pairs based on connection IDs
  const pairColorMap = useMemo(() => {
    const map = new Map<string, string>();
    userConnections.forEach((connection, index) => {
      if (connection.leftId && connection.rightId) {
        const color = PAIR_COLORS[index % PAIR_COLORS.length];
        map.set(connection.leftId, color);
        map.set(connection.rightId, color);
      }
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

    if (!aElement || !bElement || !svgElement) {
      // Nếu elements chưa sẵn sàng, trigger redraw sau một chút với retry logic
      const retryCount = (window as any).pathRetryCount || 0;
      if (retryCount < 5) {
        // Giới hạn số lần retry
        (window as any).pathRetryCount = retryCount + 1;
        setTimeout(() => {
          setShouldRedrawConnections(true);
          if (retryCount >= 4) {
            (window as any).pathRetryCount = 0; // Reset counter sau khi retry
          }
        }, 200 * (retryCount + 1)); // Tăng delay theo số lần retry để đợi animation
      }
      return '';
    }

    // Reset retry counter khi thành công
    (window as any).pathRetryCount = 0;

    const svgRect = svgElement.getBoundingClientRect();
    const aRect = aElement.getBoundingClientRect();
    const bRect = bElement.getBoundingClientRect();

    // Đảm bảo tính toán chính xác với scroll offset
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollLeft =
      window.pageXOffset || document.documentElement.scrollLeft;

    const startX = aRect.right - svgRect.left;
    const startY = aRect.top + aRect.height / 2 - svgRect.top;
    const endX = bRect.left - svgRect.left;
    const endY = bRect.top + bRect.height / 2 - svgRect.top;

    // Validate coordinates để đảm bảo không có NaN hoặc Infinity
    if (
      !isFinite(startX) ||
      !isFinite(startY) ||
      !isFinite(endX) ||
      !isFinite(endY)
    ) {
      console.warn(
        '[QuizMatchingPair] Invalid coordinates detected, retrying...'
      );
      setTimeout(() => setShouldRedrawConnections(true), 300); // Tăng delay để đợi animation
      return '';
    }

    // Calculate control points for smooth curve
    const controlY = startY + (endY - startY) / 2;
    const controlX1 = startX + (endX - startX) * 0.25;
    const controlX2 = startX + (endX - startX) * 0.75;

    return `M ${startX} ${startY} C ${controlX1} ${startY}, ${controlX2} ${endY}, ${endX} ${endY}`;
  };

  return (
    <div
      className='min-h-full bg-transparent'
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <style>{shimmerStyles}</style>
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
          <div className='sticky top-0 left-0 right-0 h-12 bg-black bg-opacity-40 backdrop-blur-sm border-b border-white/5 flex items-center justify-between px-5 text-white z-20'>
            <div className='flex items-center gap-3'>
              <div className='h-7 w-7 rounded-full bg-[rgb(198,234,132)] flex items-center justify-center shadow-md'>
                <Link2 className='h-4 w-4 text-black' />
              </div>
              <div className='text-xs capitalize font-medium text-white/80'>
                Matching Pairs
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

              {/* Participants counter */}
              <motion.div
                key={`${answeredCount}-${totalParticipants}`}
                className={`
                  flex items-center gap-1.5 mr-2 ${
                    answeredCount >= totalParticipants
                      ? 'bg-black bg-opacity-30 border-[rgb(198,234,132)]/30 shadow-[rgb(198,234,132)]/10'
                      : 'bg-black bg-opacity-30 border-[rgb(255,198,121)]/30 shadow-[rgb(255,198,121)]/10'
                  } border border-white/10 px-2 py-1 rounded-full text-xs font-medium`}
                animate={{
                  scale: answeredCount > 0 ? [1, 1.15, 1] : 1,
                  transition: { duration: 0.5 },
                }}
              >
                <Users className='h-3.5 w-3.5 text-[rgb(198,234,132)]' />
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
                <span className='ml-1 text-xs opacity-75'>
                  (
                  {Math.round(
                    (answeredCount / Math.max(1, totalParticipants)) * 100
                  )}
                  %)
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
                {quiz.questionText ||
                  activity.title ||
                  'Matching Pairs Question'}
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
                Math.max(0, (timeLeft / activity.quiz.timeLimitSeconds) * 100)
              )}%`,
            }}
            transition={{ duration: 0.1 }}
          />
          {/* Participants Progress */}
          <motion.div
            className='h-1 bg-[rgb(173,216,255)]'
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

        {/* Matching Pairs Content */}
        <div className='p-3 sm:p-6 bg-black bg-opacity-20'>
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

          {/* Results display khi có đáp án */}
          <AnimatePresence>
            {showCorrectAnswer && (
              <motion.div
                className='mb-4 p-4 rounded-xl bg-[#0e2838]/50 border border-white/10'
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              >
                {activity.hostShowAnswer && !isSubmitted ? (
                  <motion.div
                    className='flex items-center gap-2 text-[rgb(198,234,132)]'
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
                    className='flex items-center gap-2 text-[rgb(198,234,132)]'
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
                      <span className='text-white/70 ml-2'>
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
              className='mb-4 p-4 rounded-xl bg-[#0e2838]/50 border border-[rgb(198,234,132)]/30 text-white/90'
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
                khi quiz kết thúc.
              </p>
            </motion.div>
          )}

          {/* Matching Pairs Interface */}
          <motion.div
            className='rounded-xl overflow-hidden shadow-xl border border-white/10'
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div
              ref={containerRef}
              className='matching-pair-preview relative p-3 sm:p-4 md:p-6 lg:p-8 bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-800 dark:to-gray-900 min-h-[260px] sm:min-h-[300px] md:min-h-[400px] w-full'
              key={`preview-${forceUpdate}`}
            >
              <div className='flex flex-row justify-between items-start gap-4 sm:gap-6 md:gap-10 lg:gap-12 max-w-6xl mx-auto'>
                {/* Column A */}
                <div className='w-[42%] sm:w-[44%] md:w-[45%] lg:w-1/2 flex flex-col items-center gap-2 sm:gap-3 md:gap-4 lg:gap-6'>
                  <div className='w-full bg-gradient-to-r from-blue-500 to-purple-600 p-2 sm:p-3 md:p-4 rounded-xl shadow-lg'>
                    <h3 className='font-bold text-xs sm:text-base md:text-lg lg:text-xl text-center text-white drop-shadow-sm break-words'>
                      {leftColumnName}
                    </h3>
                  </div>
                  <div className='w-full space-y-1.5 sm:space-y-2 md:space-y-3 lg:space-y-4'>
                    {shuffledLeftColumn.map((item, index) => {
                      // Find the connection for this item
                      const connectionColor = pairColorMap.get(
                        item.quizMatchingPairItemId
                      );
                      const isSelected =
                        selectedItem?.id === item.quizMatchingPairItemId;

                      return (
                        <motion.div
                          key={`${item.quizMatchingPairItemId}-${forceUpdate}`}
                          id={`item-${item.quizMatchingPairItemId}`}
                          className={cn(
                            'item-container rounded-2xl text-center transition-all duration-300 w-full border-2 shadow-lg hover:shadow-xl cursor-pointer relative overflow-hidden',
                            isSelected && 'ring-2 ring-blue-400 ring-offset-2',
                            !connectionColor &&
                              'bg-gradient-to-r from-white to-blue-50 dark:from-gray-700 dark:to-gray-600 text-gray-800 dark:text-gray-200 border-blue-200 dark:border-gray-500 hover:from-blue-50 hover:to-blue-100 dark:hover:from-gray-600 dark:hover:to-gray-500'
                          )}
                          style={
                            connectionColor
                              ? {
                                  background: `linear-gradient(135deg, ${connectionColor}, ${connectionColor}dd)`,
                                  borderColor: connectionColor,
                                  color: 'white',
                                  boxShadow: `0 4px 20px ${connectionColor}40`,
                                }
                              : {}
                          }
                          onClick={() =>
                            !showCorrectAnswer &&
                            handleItemClick('left', item.quizMatchingPairItemId)
                          }
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          {/* Shimmer effect */}
                          <div className='absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 animate-shimmer' />

                          {/* Content */}
                          <div className='relative z-10 w-full'>
                            <p className='mobile-text-fix text-xs sm:text-sm md:text-base lg:text-base font-semibold drop-shadow-sm'>
                              {item.content}
                            </p>
                          </div>

                          {/* Selected indicator */}
                          {isSelected && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className='absolute top-2 right-2 w-3 h-3 bg-blue-400 rounded-full shadow-lg'
                            />
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                </div>

                {/* Column B */}
                <div className='w-[42%] sm:w-[44%] md:w-[45%] lg:w-1/2 flex flex-col items-center gap-2 sm:gap-3 md:gap-4 lg:gap-6'>
                  <div className='w-full bg-gradient-to-r from-purple-600 to-pink-500 p-2 sm:p-3 md:p-4 rounded-xl shadow-lg'>
                    <h3 className='font-bold text-xs sm:text-base md:text-lg lg:text-xl text-center text-white drop-shadow-sm break-words'>
                      {rightColumnName}
                    </h3>
                  </div>
                  <div className='w-full space-y-1.5 sm:space-y-2 md:space-y-3 lg:space-y-4'>
                    {shuffledRightColumn.map((item, index) => {
                      // Find the connection for this item
                      const connectionColor = pairColorMap.get(
                        item.quizMatchingPairItemId
                      );
                      const isSelected =
                        selectedItem?.id === item.quizMatchingPairItemId;

                      return (
                        <motion.div
                          key={`${item.quizMatchingPairItemId}-${forceUpdate}`}
                          id={`item-${item.quizMatchingPairItemId}`}
                          className={cn(
                            'item-container rounded-2xl text-center transition-all duration-300 w-full border-2 shadow-lg hover:shadow-xl cursor-pointer relative overflow-hidden',
                            isSelected &&
                              'ring-2 ring-purple-400 ring-offset-2',
                            !connectionColor &&
                              'bg-gradient-to-r from-white to-purple-50 dark:from-gray-700 dark:to-gray-600 text-gray-800 dark:text-gray-200 border-purple-200 dark:border-gray-500 hover:from-purple-50 hover:to-purple-100 dark:hover:from-gray-600 dark:hover:to-gray-500'
                          )}
                          style={
                            connectionColor
                              ? {
                                  background: `linear-gradient(135deg, ${connectionColor}, ${connectionColor}dd)`,
                                  borderColor: connectionColor,
                                  color: 'white',
                                  boxShadow: `0 4px 20px ${connectionColor}40`,
                                }
                              : {}
                          }
                          onClick={() =>
                            !showCorrectAnswer &&
                            handleItemClick(
                              'right',
                              item.quizMatchingPairItemId
                            )
                          }
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          {/* Shimmer effect */}
                          <div className='absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 animate-shimmer' />

                          {/* Content */}
                          <div className='relative z-10 w-full'>
                            <p className='mobile-text-fix text-xs sm:text-sm md:text-base lg:text-base font-semibold drop-shadow-sm'>
                              {item.content}
                            </p>
                          </div>

                          {/* Selected indicator */}
                          {isSelected && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className='absolute top-2 right-2 w-3 h-3 bg-purple-400 rounded-full shadow-lg'
                            />
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Connection lines*/}
              <svg
                ref={svgRef}
                className='absolute top-0 left-0 w-full h-full pointer-events-none'
                style={{ zIndex: 1 }}
                key={`svg-${forceUpdate}`}
              >
                <defs>
                  {PAIR_COLORS.map((color) => (
                    <marker
                      key={color}
                      id={`marker-${color.replace('#', '')}`}
                      markerWidth='8'
                      markerHeight='8'
                      refX='4'
                      refY='4'
                      orient='auto'
                    >
                      <circle
                        cx='4'
                        cy='4'
                        r='3'
                        fill='white'
                        stroke={color}
                        strokeWidth='1.5'
                      />
                    </marker>
                  ))}
                </defs>
                <g>
                  <AnimatePresence>
                    {userConnections.map((conn, index) => {
                      const pathColor =
                        pairColorMap.get(conn.leftId) || PAIR_COLORS[0];
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

                      // Re-calculate path để đảm bảo vị trí chính xác
                      const pathData = getConnectionPath(
                        conn.leftId,
                        conn.rightId
                      );

                      return (
                        <motion.path
                          key={`${conn.leftId}-${conn.rightId}-${forceUpdate}`}
                          d={pathData}
                          stroke={
                            showCorrectAnswer && isCorrectConnection
                              ? '#10b981'
                              : pathColor
                          }
                          strokeWidth={
                            showCorrectAnswer && isCorrectConnection ? '5' : '4'
                          }
                          fill='none'
                          strokeLinecap='round'
                          initial={{
                            pathLength: 0,
                            opacity: 0,
                            strokeWidth: 4,
                          }}
                          animate={{
                            pathLength: 1,
                            opacity:
                              animationPhase === 'hiding_wrong' &&
                              !isCorrectConnection
                                ? 0
                                : 1,
                            strokeWidth:
                              showCorrectAnswer && isCorrectConnection ? 5 : 4,
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
                                ? 'drop-shadow(0 0 10px rgba(16, 185, 129, 0.6))'
                                : 'drop-shadow(0 2px 6px rgba(0,0,0,0.2))',
                          }}
                        />
                      );
                    })}
                  </AnimatePresence>
                </g>
              </svg>
            </div>
          </motion.div>

          {/* Submit Button */}
          {isParticipating && !isSubmitted && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className='mt-4 sm:mt-6 w-full px-2 sm:px-0'
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
                  className='w-full px-4 sm:px-8 py-4 sm:py-6 text-base sm:text-lg font-bold bg-gradient-to-r from-[rgb(198,234,132)] to-[rgb(228,248,141)] hover:from-[rgb(158,227,72)] hover:to-[rgb(211,232,124)] text-slate-900 shadow-lg flex items-center justify-center gap-2'
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
                        <Loader2 className='h-4 w-4 sm:h-5 sm:w-5' />
                      </motion.div>
                      <span>Đang gửi...</span>
                    </>
                  ) : isSubmitted ? (
                    <>
                      <CheckCircle className='h-4 w-4 sm:h-5 sm:w-5' />
                      <span>Đã gửi câu trả lời</span>
                    </>
                  ) : (
                    <>
                      <span>Gửi câu trả lời</span>
                      <ArrowRight className='h-4 w-4 sm:h-5 sm:w-5' />
                    </>
                  )}
                </Button>

                {/* Progress indicator */}
                <div className='mt-3 sm:mt-4 text-center'>
                  <div className='flex items-center justify-center gap-2 text-xs sm:text-sm text-white/70'>
                    <div className='flex gap-1'>
                      {Array.from({ length: items.length / 2 }).map(
                        (_, index) => (
                          <div
                            key={index}
                            className={cn(
                              'w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full transition-all duration-300',
                              index < userConnections.length
                                ? showCorrectAnswer
                                  ? 'bg-green-500'
                                  : 'bg-[rgb(198,234,132)]'
                                : 'bg-gray-300 dark:bg-gray-600'
                            )}
                          />
                        )
                      )}
                    </div>
                    <span className='ml-2 text-xs sm:text-sm'>
                      {userConnections.length} / {items.length / 2} cặp
                    </span>
                  </div>
                </div>

                {submitError && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className='mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2 text-red-600 dark:text-red-400 text-xs sm:text-sm'
                  >
                    <XCircle className='w-4 h-4 flex-shrink-0' />
                    <span className='mobile-text-fix'>{submitError}</span>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}
        </div>
      </Card>
    </div>
  );
}
