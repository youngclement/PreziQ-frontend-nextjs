'use client';

import type React from 'react';
import { useState, useRef, useEffect, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import type { QuizQuestion } from '../types';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useTranslation } from 'react-i18next';

// Add this shuffle function
const shuffleArray = <T,>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

const PAIR_COLORS = [
  '#3b82f6', // blue
  '#a855f7', // purple
  '#eab308', // yellow
  '#f97316', // orange
  '#06b6d4', // cyan
  '#ec4899', // pink
  '#6366f1', // indigo
];

interface Connection {
  columnA: string;
  columnB: string;
}

interface MatchingPairPreviewProps {
  question: QuizQuestion;
  questionIndex: number;
  isActive: boolean;
  viewMode: 'desktop' | 'tablet' | 'mobile';
  onCorrectAnswerChange?: (value: string) => void;
  editMode: string | null;
  setEditMode: (mode: string | null) => void;
  editingText: string;
  setEditingText: (text: string) => void;
  editingOptionIndex: number | null;
  setEditingOptionIndex: (index: number | null) => void;
  onQuestionTextChange: (value: string, questionIndex: number) => void;
  onOptionChange: (
    questionIndex: number,
    optionIndex: number,
    field: string,
    value: any
  ) => void;
  onChangeQuestion: (index: number) => void;
  backgroundImage?: string;
  leftColumnName?: string;
  rightColumnName?: string;
  previewMode?: boolean;
}

export function MatchingPairPreview({
  question,
  questionIndex = 0,
  isActive = true,
  viewMode = 'desktop',
  onCorrectAnswerChange,
  editMode,
  setEditMode,
  editingText,
  setEditingText,
  editingOptionIndex,
  setEditingOptionIndex,
  onQuestionTextChange,
  onOptionChange,
  onChangeQuestion,
  backgroundImage,
  leftColumnName = 'Column A',
  rightColumnName = 'Column B',
  previewMode = true,
}: MatchingPairPreviewProps) {
  const { t } = useTranslation();
  const [connections, setConnections] = useState<Connection[]>([]);
  const [selectedItem, setSelectedItem] = useState<{ id: string, type: 'left' | 'right' } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Create a color map for pairs
  const pairColorMap = useMemo(() => {
    const map = new Map<string, string>();
    const pairIds = new Set<string>();
    question.options.forEach(opt => {
      if (opt.pair_id) {
        pairIds.add(opt.pair_id);
      }
    });

    Array.from(pairIds).forEach((pairId, index) => {
      map.set(pairId, PAIR_COLORS[index % PAIR_COLORS.length]);
    });
    return map;
  }, [question.options]);

  // Add new state for shuffled columns - only shuffle once
  const [shuffledColumnA, setShuffledColumnA] = useState<
    typeof question.options
  >([]);
  const [shuffledColumnB, setShuffledColumnB] = useState<
    typeof question.options
  >([]);

  // Add useEffect to handle initial shuffle only once
  useEffect(() => {
    const columnA = question.options.filter((item) => item.type === 'left' && item.id);
    const columnB = question.options.filter((item) => item.type === 'right' && item.id);

    // Sort both columns by display_order to maintain the correct order
    columnA.sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
    columnB.sort((a, b) => (a.display_order || 0) - (b.display_order || 0));

    // Only shuffle if in player mode
    if (previewMode) {
      setShuffledColumnA(shuffleArray(columnA));
      setShuffledColumnB(shuffleArray(columnB));
    } else {
      setShuffledColumnA(columnA);
      setShuffledColumnB(columnB);
    }
  }, [question.options, previewMode]); // Re-evaluate when options or previewMode change

  // Replace the direct column assignments with state values
  const columnA = shuffledColumnA;
  const columnB = shuffledColumnB;

  // Auto-connect matching pairs based on pair_id
  useEffect(() => {
    const newConnections: Connection[] = [];
    if (columnA.length > 0 && columnB.length > 0) {
      const rightOptionsWithPairId = columnB.filter(item => item.pair_id);

      columnA.forEach(leftItem => {
        if (leftItem.pair_id) {
          const matchingRightItem = rightOptionsWithPairId.find(
            rightItem => rightItem.pair_id === leftItem.pair_id
          );
          if (matchingRightItem && leftItem.id && matchingRightItem.id) {
            newConnections.push({
              columnA: leftItem.id,
              columnB: matchingRightItem.id,
            });
          }
        }
      });
    }
    setConnections(newConnections);
  }, [question.options, columnA, columnB]);

  // Thêm state để theo dõi kích thước container
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Thêm state để theo dõi thay đổi của preview
  const [previewUpdate, setPreviewUpdate] = useState(0);

  // Cập nhật useEffect để theo dõi kích thước và cập nhật preview
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        setContainerSize({ width, height });
        // Kích hoạt cập nhật preview
        setPreviewUpdate((prev) => prev + 1);
      }
    };

    // Cập nhật kích thước ban đầu
    updateSize();

    // Thêm event listener cho resize
    window.addEventListener('resize', updateSize);

    // Thêm ResizeObserver để theo dõi thay đổi kích thước của container
    const resizeObserver = new ResizeObserver(() => {
      updateSize();
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    // Cleanup
    return () => {
      window.removeEventListener('resize', updateSize);
      resizeObserver.disconnect();
    };
  }, []);

  const handleItemClick = (type: 'left' | 'right', itemId: string) => {
    // Only allow connections in edit mode, not in player/preview mode
    if (previewMode || !editMode) {
      return;
    }

    // Editor logic
    const clickedOption = question.options.find(opt => opt.id === itemId);
    if (!clickedOption) return;

    if (selectedItem) {
      // An item is already selected
      if (selectedItem.type !== type) {
        // A different column item was clicked, form a pair
        const leftOption = type === 'right' ? question.options.find(o => o.id === selectedItem.id) : clickedOption;
        const rightOption = type === 'left' ? question.options.find(o => o.id === selectedItem.id) : clickedOption;

        if (!leftOption || !rightOption) {
          setSelectedItem(null);
          return;
        }

        const leftOptionIndex = question.options.findIndex(o => o.id === leftOption.id);
        const rightOptionIndex = question.options.findIndex(o => o.id === rightOption.id);

        // If they are already connected, disconnect them
        if (leftOption.pair_id && rightOption.pair_id && leftOption.pair_id === rightOption.pair_id) {
          onOptionChange(questionIndex, leftOptionIndex, 'pair_id', null);
          onOptionChange(questionIndex, rightOptionIndex, 'pair_id', null);
        } else {
          // Check if right option is already paired, if so, break that pair
          if (rightOption.pair_id) {
            const previouslyPairedLeftOption = question.options.find(o => o.pair_id === rightOption.pair_id && o.type === 'left');
            if (previouslyPairedLeftOption) {
              const prevIndex = question.options.findIndex(o => o.id === previouslyPairedLeftOption.id);
              onOptionChange(questionIndex, prevIndex, 'pair_id', null);
            }
          }
          // Check if left option is already paired, if so, break that pair
          if (leftOption.pair_id) {
            const previouslyPairedRightOption = question.options.find(o => o.pair_id === leftOption.pair_id && o.type === 'right');
            if (previouslyPairedRightOption) {
              const prevIndex = question.options.findIndex(o => o.id === previouslyPairedRightOption.id);
              onOptionChange(questionIndex, prevIndex, 'pair_id', null);
            }
          }

          // Create new connection
          const newPairId = crypto.randomUUID();
          onOptionChange(questionIndex, leftOptionIndex, 'pair_id', newPairId);
          onOptionChange(questionIndex, rightOptionIndex, 'pair_id', newPairId);
        }

        setSelectedItem(null);

      } else {
        // Same column item was clicked, change selection
        setSelectedItem({ id: itemId, type });
      }
    } else {
      // No item selected, select this one
      setSelectedItem({ id: itemId, type });
    }
  };

  // Cập nhật hàm getConnectionPath để tạo đường nối đẹp hơn
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

    // Tính toán control points cho đường cong mượt mà hơn
    const controlY = startY + (endY - startY) / 2;
    const controlX1 = startX + (endX - startX) * 0.25;
    const controlX2 = startX + (endX - startX) * 0.75;

    return `M ${startX} ${startY} C ${controlX1} ${startY}, ${controlX2} ${endY}, ${endX} ${endY}`;
  };

  const isConnectionCorrect = (
    columnAId: string,
    columnBId: string
  ): boolean => {
    const itemA = question.options.find((item) => item.id === columnAId);
    const itemB = question.options.find((item) => item.id === columnBId);

    if (!itemA || !itemB) return false;

    // A connection is correct if their pair_ids match and are not null/empty
    return !!(itemA.pair_id && itemB.pair_id && itemA.pair_id === itemB.pair_id);
  };

  const getItemConnections = (itemId: string): Connection[] => {
    return connections.filter(
      (c) => c.columnA === itemId || c.columnB === itemId
    );
  };

  const connectionCount = (itemId: string): number => {
    return connections.filter(
      (c) => c.columnA === itemId || c.columnB === itemId
    ).length;
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        'matching-pair-preview relative',
        viewMode === 'desktop' && 'p-8',
        viewMode === 'tablet' && 'p-6',
        viewMode === 'mobile' && 'p-4'
      )}
    >
      <div className="flex justify-between items-start gap-4 md:gap-8">
        {/* Column A */}
        <div className="w-1/2 flex flex-col items-center gap-2 md:gap-3">
          <h3 className="font-bold text-lg text-center text-gray-700 dark:text-gray-300">
            {leftColumnName}
          </h3>
          <div className="w-full space-y-2">
            {columnA.map((item, index) => {
              const pairId = item.pair_id;
              const connectionColor = pairId ? pairColorMap.get(pairId) : undefined;

              return (
                <motion.div
                  key={item.id || `a-${index}`}
                  id={`item-${item.id}`}
                  className={cn(
                    'p-2 md:p-3 rounded-lg text-center transition-all duration-200 w-full border-2',
                    !previewMode && editMode && 'cursor-pointer',
                    selectedItem?.id === item.id
                      ? 'ring-2 ring-blue-500'
                      : '',
                    connectionColor
                      ? 'text-white'
                      : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-600'
                  )}
                  style={connectionColor ? { backgroundColor: connectionColor, borderColor: connectionColor } : {}}
                  onClick={() => item.id && handleItemClick('left', item.id)}
                  whileHover={{ scale: !previewMode && editMode ? 1.03 : 1 }}
                  layout
                >
                  <p className="text-sm md:text-base">
                    {item.option_text}
                  </p>
                </motion.div>
              )
            })}
          </div>
        </div>

        {/* Column B */}
        <div className="w-1/2 flex flex-col items-center gap-2 md:gap-3">
          <h3 className="font-bold text-lg text-center text-gray-700 dark:text-gray-300">
            {rightColumnName}
          </h3>
          <div className="w-full space-y-2">
            {columnB.map((item, index) => {
              const pairId = item.pair_id;
              const connectionColor = pairId ? pairColorMap.get(pairId) : undefined;

              return (
                <motion.div
                  key={item.id || `b-${index}`}
                  id={`item-${item.id}`}
                  className={cn(
                    'p-2 md:p-3 rounded-lg text-center transition-all duration-200 w-full border-2',
                    !previewMode && editMode && 'cursor-pointer',
                    selectedItem?.id === item.id
                      ? 'ring-2 ring-purple-500'
                      : '',
                    connectionColor
                      ? 'text-white'
                      : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-600'
                  )}
                  style={connectionColor ? { backgroundColor: connectionColor, borderColor: connectionColor } : {}}
                  onClick={() => item.id && handleItemClick('right', item.id)}
                  whileHover={{ scale: !previewMode && editMode ? 1.03 : 1 }}
                  layout
                >
                  <p className="text-sm md:text-base">
                    {item.option_text}
                  </p>
                </motion.div>
              )
            })}
          </div>
        </div>
      </div>

      {/* SVG for drawing lines */}
      <svg
        ref={svgRef}
        className="absolute top-0 left-0 w-full h-full pointer-events-none"
        style={{ zIndex: 1 }}
        key={previewUpdate}
      >
        <defs>
          {PAIR_COLORS.map(color => (
            <marker key={color} id={`marker-${color.replace('#', '')}`} markerWidth="8" markerHeight="8" refX="4" refY="4">
              <circle cx="4" cy="4" r="3" stroke={color} className="fill-white" strokeWidth="1.5" />
            </marker>
          ))}
        </defs>
        <g>
          {connections.map((conn, index) => {
            const leftItem = question.options.find(o => o.id === conn.columnA);
            const pairId = leftItem?.pair_id;
            const pathColor = pairId ? pairColorMap.get(pairId) : '#3b82f6';

            return (
              <motion.path
                key={`${conn.columnA}-${conn.columnB}-${index}`}
                d={getConnectionPath(conn.columnA, conn.columnB)}
                className='stroke-2 transition-all duration-300'
                stroke={pathColor}
                strokeWidth="2.5"
                fill="none"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                markerStart={pathColor ? `url(#marker-${pathColor.replace('#', '')})` : undefined}
                markerEnd={pathColor ? `url(#marker-${pathColor.replace('#', '')})` : undefined}
              />
            )
          })}
        </g>
      </svg>

      {!previewMode && (
        <div className="absolute top-2 right-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge variant="outline" className="flex items-center gap-1.5 py-1 px-2.5 bg-background/80 backdrop-blur-sm">
                  <Info className="h-3.5 w-3.5" />
                  <span>Edit Mode</span>
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <div className="text-left">
                  <p className="font-bold">{t('matchingPair.title')}</p>
                  <ul className="list-disc list-inside">
                    <li>{t('matchingPair.step1')}</li>
                    <li>{t('matchingPair.step2')}</li>
                  </ul>
                  <p>{t('matchingPair.disconnect')}</p>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      )}
    </div>
  );
}
