'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock,
  CheckCircle,
  XCircle,
  Users,
  Link,
  Loader2,
  AlertCircle,
  RotateCcw,
  Trophy,
  Target,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
  DragOverlay,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Mock WebSocket interface for demo purposes
export interface SessionWebSocket {
  getParticipantsEventRatio: () => {
    count: number;
    total: number;
    percentage: number;
  };
  onParticipantsUpdateHandler: (handler: () => void) => void;
  submitActivity: (data: {
    sessionId: string;
    activityId: string;
    answerContent: string;
  }) => Promise<void>;
}

export interface QuizMatchingPairViewerProps {
  activity: {
    activityId: string;
    title: string;
    description: string;
    backgroundColor?: string;
    backgroundImage?: string;
    hostShowAnswer?: boolean;
    quiz: {
      questionText: string;
      timeLimitSeconds: number;
      options: {
        id: string;
        option_text: string;
        type: 'left' | 'right';
        pair_id?: string;
        display_order?: number;
      }[];
    };
  };
  sessionId: string;
  sessionWebSocket?: SessionWebSocket;
  isParticipating?: boolean;
  isDemoMode?: boolean;
}

const PAIR_COLORS = [
  '#3b82f6', // blue
  '#a855f7', // purple
  '#eab308', // yellow
  '#f97316', // orange
  '#06b6d4', // cyan
  '#ec4899', // pink
  '#6366f1', // indigo
  '#10b981', // emerald
];

interface QuizResult {
  correct: boolean;
  message: string;
  correctPairs: { leftId: string; rightId: string }[];
  score: number;
  totalPairs: number;
}

// Answer reveal effects component
function AnswerRevealEffects({
  isRevealing,
  currentIndex,
  totalCount,
  onComplete,
}: {
  isRevealing: boolean;
  currentIndex: number;
  totalCount: number;
  onComplete?: () => void;
}) {
  if (!isRevealing) return null;

  return (
    <>
      {/* Floating particles effect */}
      <div className="fixed inset-0 pointer-events-none z-40">
        {Array.from({ length: 6 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-green-400 rounded-full"
            initial={{
              x: Math.random() * window.innerWidth,
              y: window.innerHeight + 20,
              opacity: 0,
            }}
            animate={{
              y: -20,
              opacity: [0, 1, 0],
              scale: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 3,
              delay: i * 0.2,
              repeat: Number.POSITIVE_INFINITY,
              repeatDelay: 2,
            }}
          />
        ))}
      </div>

      {/* Progress indicator */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-2xl border z-50"
      >
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{
              duration: 2,
              repeat: Number.POSITIVE_INFINITY,
              ease: 'linear',
            }}
            className="mb-4"
          >
            <Sparkles className="h-8 w-8 text-green-500 mx-auto" />
          </motion.div>

          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">
            Đang hiển thị đáp án
          </h3>

          <div className="flex items-center justify-center gap-2 mb-3">
            <span className="text-2xl font-bold text-green-600">
              {currentIndex}
            </span>
            <span className="text-gray-400">/</span>
            <span className="text-2xl font-bold text-gray-600">
              {totalCount}
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-green-400 to-green-600"
              initial={{ width: 0 }}
              animate={{ width: `${(currentIndex / totalCount) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>
      </motion.div>

      {/* Completion celebration */}
      {currentIndex === totalCount && (
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: [0, 1.2, 1] }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="bg-gradient-to-r from-green-400 to-green-600 text-white p-8 rounded-full"
          >
            <Trophy className="h-16 w-16" />
          </motion.div>

          {/* Confetti effect */}
          {Array.from({ length: 20 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-3 h-3 rounded-full"
              style={{
                backgroundColor: ['#22c55e', '#3b82f6', '#a855f7', '#eab308'][
                  i % 4
                ],
              }}
              initial={{
                x: 0,
                y: 0,
                scale: 0,
                opacity: 1,
              }}
              animate={{
                x: (Math.random() - 0.5) * 400,
                y: (Math.random() - 0.5) * 400,
                scale: [0, 1, 0],
                opacity: [1, 1, 0],
              }}
              transition={{
                duration: 1.5,
                delay: 0.8 + i * 0.05,
                ease: 'easeOut',
              }}
            />
          ))}
        </motion.div>
      )}
    </>
  );
}

export default function QuizMatchingPairViewer({
  activity,
  sessionId,
  sessionWebSocket,
  isParticipating = true,
  isDemoMode = false,
}: QuizMatchingPairViewerProps) {
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
  const [selectedRight, setSelectedRight] = useState<string | null>(null);
  const [connections, setConnections] = useState<
    { leftId: string; rightId: string; id: string; isCorrect?: boolean }[]
  >([]);
  const [timeLeft, setTimeLeft] = useState(activity.quiz.timeLimitSeconds);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [answeredCount, setAnsweredCount] = useState(isDemoMode ? 3 : 0);
  const [totalParticipants, setTotalParticipants] = useState(
    isDemoMode ? 5 : 0
  );
  const [isQuizEnded, setIsQuizEnded] = useState(false);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showCorrectAnswers, setShowCorrectAnswers] = useState(false);
  const [correctConnectionsRevealed, setCorrectConnectionsRevealed] = useState<
    string[]
  >([]);
  const [isRevealingAnswers, setIsRevealingAnswers] = useState(false);
  const [revealIndex, setRevealIndex] = useState(0);
  const [skipReveal, setSkipReveal] = useState(false);
  // Add state to force re-render of connections
  const [connectionKey, setConnectionKey] = useState(0);

  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Create a mock WebSocket for demo mode
  const mockWebSocket = useRef<SessionWebSocket>({
    getParticipantsEventRatio: () => ({
      count: answeredCount,
      total: totalParticipants,
      percentage: (answeredCount / totalParticipants) * 100,
    }),
    onParticipantsUpdateHandler: () => {},
    submitActivity: async () => {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return;
    },
  });

  // Use either the provided WebSocket or the mock one
  const effectiveWebSocket =
    sessionWebSocket || (isDemoMode ? mockWebSocket.current : undefined);

  // Get correct pairs from activity data
  const getCorrectPairs = useCallback(() => {
    const leftItems = activity.quiz.options.filter(
      (opt) => opt.type === 'left'
    );
    return leftItems
      .map((leftItem) => {
        const rightItem = activity.quiz.options.find(
          (opt) => opt.type === 'right' && opt.pair_id === leftItem.pair_id
        );
        return {
          leftId: leftItem.id,
          rightId: rightItem?.id || '',
          leftText: leftItem.option_text,
          rightText: rightItem?.option_text || '',
        };
      })
      .filter((pair) => pair.rightId);
  }, [activity.quiz.options]);

  const revealCorrectAnswers = useCallback(async () => {
    setIsRevealingAnswers(true);
    const correctPairs = getCorrectPairs();

    if (skipReveal) {
      // Reveal all at once
      setCorrectConnectionsRevealed(
        correctPairs.map((pair) => `${pair.leftId}-${pair.rightId}`)
      );
      setRevealIndex(correctPairs.length);
      await new Promise((resolve) => setTimeout(resolve, 500));
      setIsRevealingAnswers(false);
      return;
    }

    for (let i = 0; i < correctPairs.length; i++) {
      await new Promise((resolve) => setTimeout(resolve, 1200)); // Increased delay for better effect

      setCorrectConnectionsRevealed((prev) => [
        ...prev,
        `${correctPairs[i].leftId}-${correctPairs[i].rightId}`,
      ]);
      setRevealIndex(i + 1);
    }

    await new Promise((resolve) => setTimeout(resolve, 800));
    setIsRevealingAnswers(false);
  }, [getCorrectPairs, skipReveal]);

  // Auto-end quiz when time runs out or all participants answered
  useEffect(() => {
    if (
      (timeLeft <= 0 ||
        (answeredCount >= totalParticipants && totalParticipants > 0)) &&
      !isQuizEnded
    ) {
      setIsQuizEnded(true);
      setShowResults(true);

      // Calculate results first
      const correctPairs = getCorrectPairs();
      const userCorrectCount = connections.filter((conn) =>
        isConnectionCorrect(conn.leftId, conn.rightId)
      ).length;

      setQuizResult({
        correct: userCorrectCount === correctPairs.length,
        message:
          userCorrectCount === correctPairs.length
            ? 'Chúc mừng! Bạn đã hoàn thành xuất sắc!'
            : `Bạn đã kết nối đúng ${userCorrectCount}/${correctPairs.length} cặp`,
        correctPairs: correctPairs.map((pair) => ({
          leftId: pair.leftId,
          rightId: pair.rightId,
        })),
        score: userCorrectCount,
        totalPairs: correctPairs.length,
      });

      // Start revealing correct answers after a delay
      setTimeout(() => {
        setShowCorrectAnswers(true);
        setTimeout(() => {
          revealCorrectAnswers();
        }, 1000);
      }, 2000);
    }
  }, [
    timeLeft,
    answeredCount,
    totalParticipants,
    isQuizEnded,
    connections,
    getCorrectPairs,
    revealCorrectAnswers,
  ]);

  // Reset state when activity changes
  useEffect(() => {
    setSelectedLeft(null);
    setSelectedRight(null);
    setConnections([]);
    setTimeLeft(activity.quiz.timeLimitSeconds);
    setIsSubmitted(false);
    setShowResults(false);
    setIsSubmitting(false);
    setError(null);
    setIsQuizEnded(false);
    setShowCorrectAnswers(false);
    setQuizResult(null);
    setCorrectConnectionsRevealed([]);
    setIsRevealingAnswers(false);
    setRevealIndex(0);
    setSkipReveal(false);
  }, [activity.activityId]);

  // Timer effect
  useEffect(() => {
    if (timeLeft <= 0 || isSubmitted || isQuizEnded) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, isSubmitted, isQuizEnded]);

  // WebSocket participants update effect
  useEffect(() => {
    if (!effectiveWebSocket) return;

    const updateResponseRatio = () => {
      const participantsRatio = effectiveWebSocket.getParticipantsEventRatio();
      setAnsweredCount(participantsRatio.count);
      setTotalParticipants(participantsRatio.total);
    };

    updateResponseRatio();
    const intervalId = setInterval(updateResponseRatio, 2000);
    effectiveWebSocket.onParticipantsUpdateHandler(updateResponseRatio);

    return () => {
      clearInterval(intervalId);
    };
  }, [effectiveWebSocket]);

  // Demo mode: Simulate participants answering
  useEffect(() => {
    if (!isDemoMode || isQuizEnded) return;

    const intervalId = setInterval(() => {
      setAnsweredCount((prev) => Math.min(prev + 1, totalParticipants));
    }, 5000);

    return () => clearInterval(intervalId);
  }, [isDemoMode, isQuizEnded, totalParticipants]);

  // Auto-connect when both items are selected
  useEffect(() => {
    if (selectedLeft && selectedRight && !isSubmitted && !isQuizEnded) {
      const existingConnection = connections.find(
        (conn) => conn.leftId === selectedLeft && conn.rightId === selectedRight
      );

      if (!existingConnection) {
        const newConnection = {
          leftId: selectedLeft,
          rightId: selectedRight,
          id: `${selectedLeft}-${selectedRight}`,
        };
        setConnections((prev) => [...prev, newConnection]);
      }

      setSelectedLeft(null);
      setSelectedRight(null);
    }
  }, [selectedLeft, selectedRight, connections, isSubmitted, isQuizEnded]);

  // Add resize listener to update connection paths
  useEffect(() => {
    const handleResize = () => {
      // Force re-render of connections by updating key
      setConnectionKey((prev) => prev + 1);
    };

    // Add resize listener
    window.addEventListener('resize', handleResize);

    // Also listen for orientation changes on mobile
    window.addEventListener('orientationchange', () => {
      setTimeout(handleResize, 100); // Small delay for orientation change
    });

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  // Add observer for container size changes
  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver(() => {
      setConnectionKey((prev) => prev + 1);
    });

    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    if (isSubmitted || isQuizEnded || !isParticipating) return;
    setActiveDragId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    if (isSubmitted || isQuizEnded || !isParticipating) return;
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const activeItem = activity.quiz.options.find(
        (opt) => opt.id === active.id
      );
      const overItem = activity.quiz.options.find((opt) => opt.id === over.id);

      if (activeItem && overItem && activeItem.type !== overItem.type) {
        const isActiveConnected = connections.some(
          (conn) => conn.leftId === active.id || conn.rightId === active.id
        );
        const isOverConnected = connections.some(
          (conn) => conn.leftId === over.id || conn.rightId === over.id
        );

        if (!isActiveConnected && !isOverConnected) {
          const leftId = activeItem.type === 'left' ? active.id : over.id;
          const rightId = activeItem.type === 'right' ? active.id : over.id;

          const newConnection = {
            leftId: String(leftId),
            rightId: String(rightId),
            id: `${leftId}-${rightId}`,
          };

          setConnections((prev) => [...prev, newConnection]);
        }
      }
    }
    setActiveDragId(null);
  };

  const getConnectionPath = useCallback(
    (leftId: string, rightId: string) => {
      const leftElement = document.getElementById(`item-${leftId}`);
      const rightElement = document.getElementById(`item-${rightId}`);
      const svgElement = svgRef.current;

      if (!leftElement || !rightElement || !svgElement) return '';

      const svgRect = svgElement.getBoundingClientRect();
      const leftRect = leftElement.getBoundingClientRect();
      const rightRect = rightElement.getBoundingClientRect();

      const startX = leftRect.right - svgRect.left;
      const startY = leftRect.top + leftRect.height / 2 - svgRect.top;
      const endX = rightRect.left - svgRect.left;
      const endY = rightRect.top + rightRect.height / 2 - svgRect.top;

      const controlX1 = startX + (endX - startX) * 0.3;
      const controlX2 = startX + (endX - startX) * 0.7;

      return `M ${startX} ${startY} C ${controlX1} ${startY}, ${controlX2} ${endY}, ${endX} ${endY}`;
    },
    [connectionKey]
  );

  const isConnectionCorrect = (leftId: string, rightId: string): boolean => {
    const leftItem = activity.quiz.options.find((item) => item.id === leftId);
    const rightItem = activity.quiz.options.find((item) => item.id === rightId);

    if (!leftItem || !rightItem) return false;
    return !!(
      leftItem.pair_id &&
      rightItem.pair_id &&
      leftItem.pair_id === rightItem.pair_id
    );
  };

  const handleItemClick = (itemId: string, type: 'left' | 'right') => {
    if (isSubmitted || isQuizEnded || !isParticipating) return;

    // Kiểm tra xem item đã được kết nối chưa
    const existingConnection = connections.find((conn) =>
      type === 'left' ? conn.leftId === itemId : conn.rightId === itemId
    );

    if (existingConnection) {
      // Nếu item đã được kết nối, xóa kết nối đó
      removeConnection(existingConnection.id);
      return;
    }

    if (type === 'left') {
      // Nếu đã chọn một item bên trái khác, xóa kết nối cũ
      if (selectedLeft && selectedLeft !== itemId) {
        const oldConnection = connections.find(
          (conn) => conn.leftId === selectedLeft
        );
        if (oldConnection) {
          removeConnection(oldConnection.id);
        }
      }

      setSelectedLeft(selectedLeft === itemId ? null : itemId);

      // Tự động kết nối nếu đã chọn item bên phải
      if (selectedRight && selectedLeft !== itemId) {
        const newConnection = {
          leftId: itemId,
          rightId: selectedRight,
          id: `${itemId}-${selectedRight}`,
        };
        setConnections((prev) => [...prev, newConnection]);
        setSelectedLeft(null);
        setSelectedRight(null);
      }
    } else {
      // Nếu đã chọn một item bên phải khác, xóa kết nối cũ
      if (selectedRight && selectedRight !== itemId) {
        const oldConnection = connections.find(
          (conn) => conn.rightId === selectedRight
        );
        if (oldConnection) {
          removeConnection(oldConnection.id);
        }
      }

      setSelectedRight(selectedRight === itemId ? null : itemId);

      // Tự động kết nối nếu đã chọn item bên trái
      if (selectedLeft && selectedRight !== itemId) {
        const newConnection = {
          leftId: selectedLeft,
          rightId: itemId,
          id: `${selectedLeft}-${itemId}`,
        };
        setConnections((prev) => [...prev, newConnection]);
        setSelectedLeft(null);
        setSelectedRight(null);
      }
    }
  };

  const removeConnection = (connectionId: string) => {
    if (isSubmitted || isQuizEnded || !isParticipating) return;

    const connectionToRemove = connections.find(
      (conn) => conn.id === connectionId
    );
    if (!connectionToRemove) return;

    setConnections((prev) => prev.filter((conn) => conn.id !== connectionId));

    if (selectedLeft === connectionToRemove.leftId) {
      setSelectedLeft(null);
    }
    if (selectedRight === connectionToRemove.rightId) {
      setSelectedRight(null);
    }
  };

  const clearAllConnections = () => {
    if (isSubmitted || isQuizEnded || !isParticipating) return;
    setConnections([]);
    setSelectedLeft(null);
    setSelectedRight(null);
  };

  const calculateScore = () => {
    const correctPairs = getCorrectPairs();
    const userCorrectCount = connections.filter((conn) =>
      isConnectionCorrect(conn.leftId, conn.rightId)
    ).length;

    // Tính điểm: (số cặp đúng / tổng số cặp) * 100
    const score = Math.round((userCorrectCount / correctPairs.length) * 100);
    return score;
  };

  const handleSubmit = async () => {
    if (isSubmitted || isSubmitting || !isParticipating) return;

    setIsSubmitting(true);
    setError(null);
    setIsLoading(true);

    try {
      const answerContent = JSON.stringify(
        connections.map((conn) => ({
          columnA: conn.leftId,
          columnB: conn.rightId,
        }))
      );

      if (effectiveWebSocket) {
        await effectiveWebSocket.submitActivity({
          sessionId,
          activityId: activity.activityId,
          answerContent,
        });
      }

      setIsSubmitted(true);
      setShowResults(true);

      // Nếu chưa hết thời gian và chưa có đủ người trả lời
      if (
        timeLeft > 0 &&
        (answeredCount < totalParticipants || totalParticipants === 0)
      ) {
        setQuizResult({
          correct: false, // Chưa check đáp án
          message:
            'Câu trả lời của bạn đã được gửi đi. Vui lòng đợi kết quả...',
          correctPairs: [],
          score: 0,
          totalPairs: getCorrectPairs().length,
        });
      } else {
        // Nếu đã hết thời gian hoặc tất cả đã trả lời
        const correctPairs = getCorrectPairs();
        const userCorrectCount = connections.filter((conn) =>
          isConnectionCorrect(conn.leftId, conn.rightId)
        ).length;
        const score = calculateScore();

        setQuizResult({
          correct: userCorrectCount === correctPairs.length,
          message:
            score === 100
              ? 'Chúc mừng! Bạn đã hoàn thành xuất sắc!'
              : score >= 50
              ? `Khá tốt! Bạn đã kết nối đúng ${userCorrectCount}/${correctPairs.length} cặp.`
              : `Bạn đã kết nối đúng ${userCorrectCount}/${correctPairs.length} cặp. Cần cải thiện thêm!`,
          correctPairs: correctPairs.map((pair) => ({
            leftId: pair.leftId,
            rightId: pair.rightId,
          })),
          score: score,
          totalPairs: correctPairs.length,
        });

        // Hiển thị đáp án
        setTimeout(() => {
          setShowCorrectAnswers(true);
          setTimeout(() => {
            revealCorrectAnswers();
          }, 1000);
        }, 2000);
      }
    } catch (err) {
      setError('Không thể gửi câu trả lời. Vui lòng thử lại.');
      console.error('Error submitting answer:', err);
    } finally {
      setIsSubmitting(false);
      setIsLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getItemText = (itemId: string) => {
    const item = activity.quiz.options.find((opt) => opt.id === itemId);
    return item?.option_text || '';
  };

  const isItemConnected = (itemId: string, type: 'left' | 'right') => {
    return connections.some((conn) =>
      type === 'left' ? conn.leftId === itemId : conn.rightId === itemId
    );
  };

  const getConnectedItemId = (
    itemId: string,
    type: 'left' | 'right'
  ): string | null => {
    const connection = connections.find((conn) =>
      type === 'left' ? conn.leftId === itemId : conn.rightId === itemId
    );
    return connection
      ? type === 'left'
        ? connection.rightId
        : connection.leftId
      : null;
  };

  // Filter and sort options
  const leftColumn = activity.quiz.options
    .filter((item) => item.type === 'left')
    .sort((a, b) => (a.display_order || 0) - (b.display_order || 0));

  const rightColumn = activity.quiz.options
    .filter((item) => item.type === 'right')
    .sort((a, b) => (a.display_order || 0) - (b.display_order || 0));

  const SortableItem = ({
    id,
    text,
    type,
    isConnected,
    isCorrect,
    disabled,
  }: {
    id: string;
    text: string;
    type: 'left' | 'right';
    isConnected: boolean;
    isCorrect?: boolean;
    disabled: boolean;
  }) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({
      id,
      disabled,
    });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
    };

    const isSelected =
      (type === 'left' && selectedLeft === id) ||
      (type === 'right' && selectedRight === id);

    // Tìm connection hiện tại của item này
    const currentConnection = connections.find((conn) =>
      type === 'left' ? conn.leftId === id : conn.rightId === id
    );

    return (
      <motion.div
        ref={setNodeRef}
        style={style}
        className={cn(
          'relative p-2 sm:p-3 md:p-4 rounded-lg sm:rounded-xl border-2 transition-all duration-200 min-h-[50px] sm:min-h-[60px] flex items-center justify-center text-center',
          !disabled &&
            !isConnected &&
            'cursor-pointer hover:scale-[1.02] hover:shadow-md',
          isDragging && 'opacity-50 scale-105 shadow-lg',
          isSelected && 'ring-2 ring-blue-500 ring-offset-2',
          isConnected &&
            'bg-blue-50 dark:bg-blue-900/20 border-blue-300 text-blue-700 dark:text-blue-300',
          showCorrectAnswers &&
            isCorrect === true &&
            'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700',
          showCorrectAnswers &&
            isCorrect === false &&
            'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700',
          !isConnected &&
            !showCorrectAnswers &&
            'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-600',
          type === 'left' && 'border-l-4 border-l-blue-500',
          type === 'right' && 'border-r-4 border-r-purple-500'
        )}
        onClick={() => handleItemClick(id, type)}
        {...attributes}
        {...listeners}
        id={`item-${id}`}
        whileHover={!disabled && !isConnected ? { scale: 1.02 } : {}}
        whileTap={!disabled && !isConnected ? { scale: 0.98 } : {}}
      >
        <p className="text-xs sm:text-sm md:text-base font-medium leading-tight">
          {text}
        </p>

        {/* Status Icons */}
        {isConnected && !showCorrectAnswers && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (currentConnection) {
                removeConnection(currentConnection.id);
              }
            }}
            className="absolute top-1 sm:top-2 right-1 sm:right-2 p-0.5 sm:p-1 rounded-full hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors"
          >
            <XCircle className="h-3 w-3 sm:h-4 sm:w-4 text-red-500" />
          </button>
        )}
        {showCorrectAnswers && isCorrect === true && (
          <CheckCircle className="absolute top-2 right-2 h-4 w-4 text-green-500" />
        )}
        {showCorrectAnswers && isCorrect === false && (
          <XCircle className="absolute top-2 right-2 h-4 w-4 text-red-500" />
        )}

        {/* Selection Indicator */}
        {isSelected && (
          <motion.div
            className="absolute inset-0 rounded-xl border-2 border-blue-500"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.2 }}
          />
        )}
      </motion.div>
    );
  };

  // For demo mode: End quiz button
  const handleEndQuiz = () => {
    setTimeLeft(0);
  };

  return (
    <div
      className="w-full mx-auto p-2 sm:p-4 md:p-6 space-y-4 sm:space-y-6 max-w-full"
      ref={containerRef}
    >
      <Card className="relative overflow-hidden shadow-lg">
        {/* Header */}
        <motion.div
          className="rounded-t-xl flex flex-col shadow-md relative overflow-hidden"
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
          <div className="absolute inset-0 bg-black bg-opacity-30" />

          {/* Status Bar */}
          <div className="sticky top-0 left-0 right-0 h-10 sm:h-12 bg-black bg-opacity-40 backdrop-blur-sm border-b border-white/5 flex items-center justify-between px-2 sm:px-3 md:px-5 text-white z-20">
            <div className="flex items-center gap-1 sm:gap-2 md:gap-3">
              <div className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 rounded-full bg-[rgb(198,234,132)] flex items-center justify-center shadow-md">
                <Link className="h-2.5 w-2.5 sm:h-3 sm:w-3 md:h-4 md:w-4 text-black" />
              </div>
              <div className="text-[10px] sm:text-xs md:text-sm capitalize font-medium text-white/80">
                Reorder Quiz
              </div>
            </div>
            <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2">
              <motion.div className="flex items-center gap-1 sm:gap-1.5 bg-black bg-opacity-30 border border-white/10 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-[9px] sm:text-[10px] md:text-xs font-medium">
                <Clock className="h-2.5 w-2.5 sm:h-3 sm:w-3 md:h-3.5 md:w-3.5 text-[rgb(198,234,132)]" />
                <span
                  className={timeLeft < 10 ? 'text-red-300' : 'text-white/90'}
                >
                  {formatTime(timeLeft)}
                </span>
              </motion.div>

              {/* Participants counter */}
              <motion.div className="flex items-center gap-1 sm:gap-1.5 mr-1 sm:mr-2 bg-black bg-opacity-30 border border-white/10 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-[9px] sm:text-[10px] md:text-xs font-medium">
                <Users className="h-2.5 w-2.5 sm:h-3 sm:w-3 md:h-3.5 md:w-3.5 text-[rgb(198,234,132)]" />
                <span>{answeredCount}</span>
                <span className="text-white/50">/{totalParticipants}</span>
                <span className="ml-0.5 sm:ml-1 text-[8px] sm:text-[9px] md:text-xs opacity-75">
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
          <div className="flex flex-col items-center z-10 px-2 sm:px-3 md:px-5 py-3 sm:py-5 md:py-7">
            <motion.div className="w-full flex flex-col items-center justify-center">
              <h2 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-center text-white drop-shadow-lg">
                {activity.quiz.questionText}
              </h2>
              {activity.description && (
                <p className="mt-1 text-[11px] sm:text-xs md:text-sm text-white/80 text-center">
                  {activity.description}
                </p>
              )}
            </motion.div>
          </div>
        </motion.div>

        {/* Progress Bars */}
        <div className="relative">
          <motion.div
            className="h-2 bg-gradient-to-r from-green-400 to-blue-500"
            initial={{ width: '100%' }}
            animate={{
              width: `${(timeLeft / activity.quiz.timeLimitSeconds) * 100}%`,
            }}
            transition={{ duration: 0.1 }}
          />
          <motion.div
            className="absolute top-0 h-2 bg-gradient-to-r from-blue-400 to-purple-500 opacity-60"
            initial={{ width: '0%' }}
            animate={{
              width: `${
                (answeredCount / Math.max(1, totalParticipants)) * 100
              }%`,
            }}
            transition={{ duration: 0.3 }}
          />
        </div>

        {/* Content */}
        <div className="p-6">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div className="flex justify-center px-4">
              <div className="w-full max-w-6xl">
                <div className="grid grid-cols-2 gap-6 sm:gap-8 md:gap-10 lg:gap-16">
                  {/* Left Column */}
                  <div className="space-y-4 max-w-md w-full mx-auto">
                    <div className="flex items-center justify-center gap-2 mb-6">
                      <div className="w-4 h-4 bg-blue-500 rounded"></div>
                      <h3 className="text-lg md:text-xl font-bold text-gray-700 dark:text-gray-300">
                        Cột A
                      </h3>
                    </div>
                    <SortableContext
                      items={leftColumn.map((item) => item.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="space-y-3">
                        {leftColumn.map((item) => (
                          <SortableItem
                            key={item.id}
                            id={item.id}
                            text={item.option_text}
                            type="left"
                            isConnected={isItemConnected(item.id, 'left')}
                            isCorrect={
                              showCorrectAnswers &&
                              (() => {
                                const connectedId = getConnectedItemId(
                                  item.id,
                                  'left'
                                );
                                return connectedId
                                  ? isConnectionCorrect(item.id, connectedId)
                                  : false;
                              })()
                            }
                            disabled={
                              isSubmitted || isQuizEnded || !isParticipating
                            }
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </div>

                  {/* Right Column */}
                  <div className="space-y-4 max-w-md w-full mx-auto">
                    <div className="flex items-center justify-center gap-2 mb-6">
                      <div className="w-4 h-4 bg-purple-500 rounded"></div>
                      <h3 className="text-lg md:text-xl font-bold text-gray-700 dark:text-gray-300">
                        Cột B
                      </h3>
                    </div>
                    <SortableContext
                      items={rightColumn.map((item) => item.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="space-y-3">
                        {rightColumn.map((item) => (
                          <SortableItem
                            key={item.id}
                            id={item.id}
                            text={item.option_text}
                            type="right"
                            isConnected={isItemConnected(item.id, 'right')}
                            isCorrect={
                              showCorrectAnswers &&
                              (() => {
                                const connectedId = getConnectedItemId(
                                  item.id,
                                  'right'
                                );
                                return connectedId
                                  ? isConnectionCorrect(connectedId, item.id)
                                  : false;
                              })()
                            }
                            disabled={
                              isSubmitted || isQuizEnded || !isParticipating
                            }
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </div>
                </div>
              </div>
            </div>

            {/* SVG for drawing connection lines */}
            <svg
              ref={svgRef}
              className="absolute inset-0 w-full h-full pointer-events-none z-10"
              key={connectionKey} // Add this to force re-render
            >
              <defs>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* User connections */}
              {connections.map((conn, index) => {
                const isCorrect =
                  showCorrectAnswers &&
                  isConnectionCorrect(conn.leftId, conn.rightId);
                const color = showCorrectAnswers
                  ? isCorrect
                    ? '#22c55e'
                    : '#ef4444'
                  : PAIR_COLORS[index % PAIR_COLORS.length];

                return (
                  <motion.path
                    key={conn.id}
                    d={getConnectionPath(conn.leftId, conn.rightId)}
                    stroke={color}
                    strokeWidth="3"
                    fill="none"
                    className="drop-shadow-sm"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 0.8 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    filter="url(#glow)"
                  />
                );
              })}

              {/* Correct answer connections (revealed sequentially) */}
              {showCorrectAnswers &&
                getCorrectPairs().map((pair, index) => {
                  const connectionId = `${pair.leftId}-${pair.rightId}`;
                  const userHasThisConnection = connections.some(
                    (conn) =>
                      conn.leftId === pair.leftId &&
                      conn.rightId === pair.rightId
                  );
                  const isRevealed =
                    correctConnectionsRevealed.includes(connectionId);
                  const isCurrentlyRevealing =
                    revealIndex === index + 1 && isRevealingAnswers;

                  if (userHasThisConnection) return null;

                  return (
                    <g key={`correct-${pair.leftId}-${pair.rightId}`}>
                      {/* Glow effect for currently revealing connection */}
                      {isCurrentlyRevealing && (
                        <motion.path
                          d={getConnectionPath(pair.leftId, pair.rightId)}
                          stroke="#22c55e"
                          strokeWidth="8"
                          fill="none"
                          className="opacity-30"
                          initial={{ pathLength: 0 }}
                          animate={{ pathLength: 1 }}
                          transition={{ duration: 0.6, ease: 'easeInOut' }}
                          filter="url(#glow)"
                        />
                      )}

                      {/* Main connection line */}
                      <motion.path
                        d={getConnectionPath(pair.leftId, pair.rightId)}
                        stroke="#22c55e"
                        strokeWidth="3"
                        strokeDasharray="8,4"
                        fill="none"
                        className={cn(
                          'transition-opacity duration-300',
                          isRevealed ? 'opacity-80' : 'opacity-0'
                        )}
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: isRevealed ? 1 : 0 }}
                        transition={{
                          duration: 0.8,
                          ease: 'easeInOut',
                          delay: isCurrentlyRevealing ? 0.2 : 0,
                        }}
                      />

                      {/* Animated dots along the path */}
                      {isCurrentlyRevealing && (
                        <motion.circle
                          r="4"
                          fill="#22c55e"
                          className="opacity-80"
                          initial={{ opacity: 0 }}
                          animate={{
                            opacity: [0, 1, 0],
                            offsetDistance: ['0%', '100%'],
                          }}
                          transition={{
                            duration: 0.8,
                            ease: 'easeInOut',
                          }}
                          style={{
                            offsetPath: `path('${getConnectionPath(
                              pair.leftId,
                              pair.rightId
                            )}')`,
                            offsetRotate: '0deg',
                          }}
                        />
                      )}
                    </g>
                  );
                })}
            </svg>

            <DragOverlay>
              {activeDragId ? (
                <div className="p-4 rounded-xl bg-white dark:bg-gray-700 shadow-lg border-2 border-blue-500 text-center">
                  <p className="font-medium">{getItemText(activeDragId)}</p>
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>

          {/* Action Buttons */}
          {isParticipating && !isSubmitted && !isQuizEnded && (
            <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row gap-2 sm:gap-3 justify-center">
              <Button
                onClick={clearAllConnections}
                variant="outline"
                className="text-red-600 hover:text-red-700 hover:bg-red-50 text-xs sm:text-sm md:text-base"
              >
                <RotateCcw className="mr-1.5 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                Xóa tất cả
              </Button>

              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || connections.length === 0}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-4 sm:px-6 md:px-8 py-2 sm:py-2.5 md:py-3 text-xs sm:text-sm md:text-base"
                size="lg"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-1.5 sm:mr-2 h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                    Đang gửi...
                  </>
                ) : (
                  <>
                    <Target className="mr-1.5 sm:mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                    Gửi câu trả lời ({connections.length})
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <Alert variant="destructive" className="mt-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Answer Reveal Effects */}
          <AnswerRevealEffects
            isRevealing={isRevealingAnswers}
            currentIndex={revealIndex}
            totalCount={getCorrectPairs().length}
          />

          {/* Answer Reveal Progress */}
          {isRevealingAnswers && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-white dark:bg-gray-800 px-6 py-3 rounded-full shadow-lg border z-50"
            >
              <div className="flex items-center gap-3">
                <motion.div
                  className="w-4 h-4 bg-green-500 rounded-full"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{
                    duration: 0.6,
                    repeat: Number.POSITIVE_INFINITY,
                  }}
                />
                <span className="text-sm font-medium">
                  Đang hiển thị đáp án... {revealIndex}/
                  {getCorrectPairs().length}
                </span>
              </div>
            </motion.div>
          )}

          {/* Results */}
          <AnimatePresence>
            {showResults && quizResult && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="mt-6 sm:mt-8 p-4 sm:p-5 md:p-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg sm:rounded-xl border"
              >
                <div className="text-center">
                  {timeLeft <= 0 ||
                  (answeredCount >= totalParticipants &&
                    totalParticipants > 0) ? (
                    <>
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: 'spring' }}
                      >
                        {quizResult.correct ? (
                          <Trophy className="h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16 text-yellow-500 mx-auto mb-3 sm:mb-4" />
                        ) : (
                          <Target className="h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16 text-blue-500 mx-auto mb-3 sm:mb-4" />
                        )}
                      </motion.div>

                      <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                        {quizResult.message}
                      </h3>

                      <div className="flex items-center justify-center gap-3 sm:gap-4 mb-3 sm:mb-4">
                        <div className="text-center">
                          <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-green-600">
                            {quizResult.score}
                          </div>
                          <div className="text-xs sm:text-sm text-gray-600">
                            Đúng
                          </div>
                        </div>
                        <div className="text-xl sm:text-2xl text-gray-400">
                          /
                        </div>
                        <div className="text-center">
                          <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-600">
                            {quizResult.totalPairs}
                          </div>
                          <div className="text-xs sm:text-sm text-gray-600">
                            Tổng
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: 'spring' }}
                      >
                        <Loader2 className="h-16 w-16 text-blue-500 mx-auto mb-4 animate-spin" />
                      </motion.div>

                      <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                        {quizResult.message}
                      </h3>

                      <div className="flex items-center justify-center gap-2 text-gray-600">
                        <Users className="h-5 w-5" />
                        <span>
                          Đã trả lời: {answeredCount}/{totalParticipants}
                        </span>
                      </div>
                    </>
                  )}

                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    {timeLeft <= 0 ||
                    (answeredCount >= totalParticipants &&
                      totalParticipants > 0)
                      ? isRevealingAnswers
                        ? `Đang hiển thị đáp án đúng... (${revealIndex}/${quizResult.totalPairs})`
                        : showCorrectAnswers
                        ? 'Các đường nét đứt màu xanh hiển thị đáp án chính xác'
                        : 'Kết quả đã được ghi nhận'
                      : 'Vui lòng đợi tất cả người chơi hoàn thành...'}
                  </p>

                  {timeLeft <= 0 ||
                  (answeredCount >= totalParticipants && totalParticipants > 0)
                    ? quizResult.score === quizResult.totalPairs && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.5 }}
                          className="text-yellow-600 font-medium"
                        >
                          🎉 Hoàn hảo! Bạn đã kết nối đúng tất cả các cặp!
                        </motion.div>
                      )
                    : null}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Card>
    </div>
  );
}
