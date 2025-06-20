'use client';

import type React from 'react';
import { useState, useRef, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';
import { SessionWebSocket } from '@/websocket/sessionWebSocket';

// Define types based on WebSocket data structure
interface MatchingPairItem {
  quizMatchingPairItemId: string;
  content: string;
  isLeftColumn: boolean;
  displayOrder: number;
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
    };
  };
  backgroundImage?: string;
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
  '#3b82f6',
  '#a855f7',
  '#eab308',
  '#f97316',
  '#06b6d4',
  '#ec4899',
  '#6366f1',
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

  const { quiz, backgroundImage } = activity;
  const { quizMatchingPairAnswer } = quiz;
  const { leftColumnName, rightColumnName, items } = quizMatchingPairAnswer;

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
      className='flex flex-col h-full w-full'
      style={{
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className='flex-grow p-4 md:p-8 flex items-center justify-center'>
        <div className='matching-pair-preview relative p-4 md:p-8 rounded-xl bg-white/80 dark:bg-black/70 backdrop-blur-sm shadow-2xl w-full max-w-4xl'>
          <div className='flex justify-between items-start gap-4 md:gap-8'>
            <div className='w-1/2 flex flex-col items-center gap-2 md:gap-3'>
              <h3 className='font-bold text-lg text-center text-gray-700 dark:text-gray-200'>
                {leftColumnName}
              </h3>
              <div className='w-full space-y-2'>
                {shuffledLeftColumn.map((item) => {
                  const connectionColor = colorMap.get(
                    item.quizMatchingPairItemId
                  );
                  return (
                    <motion.div
                      key={item.quizMatchingPairItemId}
                      id={`item-${item.quizMatchingPairItemId}`}
                      className={cn(
                        'p-2 md:p-3 rounded-lg text-center transition-all duration-200 w-full border-2',
                        isParticipating && 'cursor-pointer',
                        selectedItem?.id === item.quizMatchingPairItemId
                          ? 'ring-2 ring-blue-500'
                          : '',
                        connectionColor
                          ? 'text-white'
                          : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-600'
                      )}
                      style={
                        connectionColor
                          ? {
                              backgroundColor: connectionColor,
                              borderColor: connectionColor,
                            }
                          : {}
                      }
                      onClick={() =>
                        handleItemClick('left', item.quizMatchingPairItemId)
                      }
                      whileHover={{ scale: isParticipating ? 1.03 : 1 }}
                      layout
                    >
                      <p className='text-sm md:text-base'>{item.content}</p>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            <div className='w-1/2 flex flex-col items-center gap-2 md:gap-3'>
              <h3 className='font-bold text-lg text-center text-gray-700 dark:text-gray-200'>
                {rightColumnName}
              </h3>
              <div className='w-full space-y-2'>
                {shuffledRightColumn.map((item) => {
                  const connectionColor = colorMap.get(
                    item.quizMatchingPairItemId
                  );
                  return (
                    <motion.div
                      key={item.quizMatchingPairItemId}
                      id={`item-${item.quizMatchingPairItemId}`}
                      className={cn(
                        'p-2 md:p-3 rounded-lg text-center transition-all duration-200 w-full border-2',
                        isParticipating && 'cursor-pointer',
                        selectedItem?.id === item.quizMatchingPairItemId
                          ? 'ring-2 ring-purple-500'
                          : '',
                        connectionColor
                          ? 'text-white'
                          : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-600'
                      )}
                      style={
                        connectionColor
                          ? {
                              backgroundColor: connectionColor,
                              borderColor: connectionColor,
                            }
                          : {}
                      }
                      onClick={() =>
                        handleItemClick('right', item.quizMatchingPairItemId)
                      }
                      whileHover={{ scale: isParticipating ? 1.03 : 1 }}
                      layout
                    >
                      <p className='text-sm md:text-base'>{item.content}</p>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>

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
                  markerWidth='8'
                  markerHeight='8'
                  refX='4'
                  refY='4'
                  orient='auto'
                >
                  <circle cx='4' cy='4' r='3' fill={color} />
                </marker>
              ))}
            </defs>
            <g>
              <AnimatePresence>
                {userConnections.map((conn, index) => {
                  const pathColor = colorMap.get(conn.leftId) || PAIR_COLORS[0];
                  return (
                    <motion.path
                      key={`${conn.leftId}-${conn.rightId}`}
                      d={getConnectionPath(conn.leftId, conn.rightId)}
                      stroke={pathColor}
                      strokeWidth='2.5'
                      fill='none'
                      initial={{ pathLength: 0, opacity: 0 }}
                      animate={{ pathLength: 1, opacity: 1 }}
                      exit={{ pathLength: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      markerStart={`url(#marker-${pathColor.replace('#', '')})`}
                      markerEnd={`url(#marker-${pathColor.replace('#', '')})`}
                    />
                  );
                })}
              </AnimatePresence>
            </g>
          </svg>
        </div>
      </div>

      {isParticipating && (
        <div className='w-full px-4 pb-4 md:px-8 md:pb-8'>
          <Button
            onClick={handleSubmit}
            disabled={
              isSubmitting || isSubmitted || userConnections.length === 0
            }
            className='w-full text-lg font-bold py-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg transition-transform transform hover:scale-105'
          >
            {isSubmitting ? (
              <Loader2 className='mr-2 h-6 w-6 animate-spin' />
            ) : null}
            {isSubmitted
              ? t('Đã gửi câu trả lời')
              : isSubmitting
              ? t('Đang gửi...')
              : t('Gửi câu trả lời')}
          </Button>
          {submitError && (
            <div className='mt-2 text-red-500 text-sm'>{submitError}</div>
          )}
        </div>
      )}
    </div>
  );
}
