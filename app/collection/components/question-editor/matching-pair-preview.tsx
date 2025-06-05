'use client';

import type React from 'react';
import { useState, useRef, useEffect } from 'react';
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

// Add this shuffle function
const shuffleArray = <T,>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

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
}: MatchingPairPreviewProps) {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Add new state for shuffled columns - only shuffle once
  const [shuffledColumnA, setShuffledColumnA] = useState<
    typeof question.options
  >([]);
  const [shuffledColumnB, setShuffledColumnB] = useState<
    typeof question.options
  >([]);

  // Add useEffect to handle initial shuffle only once
  useEffect(() => {
    const columnA = question.options.filter((item) => item.type === 'left');
    const columnB = question.options.filter((item) => item.type === 'right');

    setShuffledColumnA(shuffleArray(columnA));
    setShuffledColumnB(shuffleArray(columnB));
  }, [question.options]); // Only re-shuffle when question changes

  // Replace the direct column assignments with state values
  const columnA = shuffledColumnA;
  const columnB = shuffledColumnB;

  // Auto-connect matching pairs
  useEffect(() => {
    if (columnA.length > 0 && columnB.length > 0) {
      const autoConnections: Connection[] = [];

      // For each item in column A
      columnA.forEach((leftItem) => {
        if (!leftItem.id || !leftItem.pair_id) return;

        const leftPairIds = leftItem.pair_id.split(',');

        // Find matching items in column B
        columnB.forEach((rightItem) => {
          if (!rightItem.id || !rightItem.pair_id) return;

          const rightPairIds = rightItem.pair_id.split(',');

          // Check if any pair_id from left matches any pair_id from right
          const hasMatch = leftPairIds.some((leftId) =>
            rightPairIds.includes(leftId)
          );

          if (hasMatch) {
            autoConnections.push({
              columnA: leftItem.id,
              columnB: rightItem.id,
            });
          }
        });
      });

      setConnections(autoConnections);
    }
  }, [columnA, columnB]);

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

  const handleItemClick = (itemId: string) => {
    if (!selectedItem) {
      // Nếu chưa có item nào được chọn, chọn item này
      setSelectedItem(itemId);
    } else {
      // Nếu đã có item được chọn
      const selectedIsColumnA = selectedItem.startsWith('a');
      const clickedIsColumnA = itemId.startsWith('a');

      // Kiểm tra xem có phải click vào cùng một cột không
      if (selectedIsColumnA === clickedIsColumnA) {
        // Nếu click vào cùng cột, bỏ chọn item hiện tại
        setSelectedItem(itemId);
        return;
      }

      // Xác định item từ cột A và B
      const columnAId = selectedIsColumnA ? selectedItem : itemId;
      const columnBId = selectedIsColumnA ? itemId : selectedItem;

      // Kiểm tra xem kết nối này đã tồn tại chưa
      const connectionExists = connections.some(
        (conn) => conn.columnA === columnAId && conn.columnB === columnBId
      );

      if (connectionExists) {
        // Nếu kết nối đã tồn tại, xóa nó
        setConnections(
          connections.filter(
            (conn) =>
              !(conn.columnA === columnAId && conn.columnB === columnBId)
          )
        );
      } else {
        // Thêm kết nối mới
        setConnections([
          ...connections,
          { columnA: columnAId, columnB: columnBId },
        ]);
      }

      // Reset selected item
      setSelectedItem(null);
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
    const distance = endX - startX;
    const controlX1 = startX + distance * 0.3;
    const controlX2 = startX + distance * 0.7;

    return `M ${startX} ${startY} C ${controlX1} ${startY} ${controlX2} ${endY} ${endX} ${endY}`;
  };

  // Check if a connection is correct
  const isConnectionCorrect = (
    columnAId: string,
    columnBId: string
  ): boolean => {
    const leftItem = columnA.find((item) => item.id === columnAId);
    const rightItem = columnB.find((item) => item.id === columnBId);

    if (!leftItem || !rightItem) return false;

    // Check if this is a valid match based on pair_ids
    // For multi-answer support, pair_id can be a comma-separated string of IDs
    const leftPairIds = leftItem.pair_id?.split(',') || [];
    const rightPairIds = rightItem.pair_id?.split(',') || [];

    // Check if any pair_id from left matches any pair_id from right
    return leftPairIds.some((leftId) => rightPairIds.includes(leftId));
  };

  // Check if item has any connections
  const getItemConnections = (itemId: string): Connection[] => {
    return connections.filter(
      (conn) => conn.columnA === itemId || conn.columnB === itemId
    );
  };

  // Count how many connections an item has
  const connectionCount = (itemId: string): number => {
    return getItemConnections(itemId).length;
  };

  return (
    <Card
      className={cn(
        'border-none rounded-2xl shadow-xl overflow-hidden transition-all duration-300 mx-auto',
        isActive
          ? 'ring-2 ring-primary/30 scale-100'
          : 'scale-[0.98] opacity-90 hover:opacity-100 hover:scale-[0.99]',
        viewMode === 'desktop' && 'max-w-5xl',
        viewMode === 'tablet' && 'max-w-3xl',
        viewMode === 'mobile' && 'max-w-md'
      )}
    >
      <CardContent className="p-4 sm:p-6 md:p-8 bg-gradient-to-br from-blue-50 to-purple-100 dark:from-blue-950 dark:to-purple-950">
        <div className="mb-6 text-center">
          <h2 className="text-lg font-semibold mb-3 text-gray-800 dark:text-white leading-snug">
            {question.question_text}
          </h2>
        </div>

        <div className="relative" ref={containerRef}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-24 gap-y-8 justify-center">
            {/* Column A */}
            <div className="w-full flex flex-col items-center space-y-3">
              <h3 className="text-sm md:text-base font-semibold text-blue-600 dark:text-blue-300 text-center">
                {leftColumnName}
              </h3>
              {columnA.length > 0 ? (
                columnA.map((item) => (
                  <motion.div
                    key={item.id}
                    id={`item-${item.id}`}
                    onClick={() => handleItemClick(item.id!)}
                    className={cn(
                      'w-full max-w-[220px] px-3 py-2 min-h-[44px]',
                      'bg-white dark:bg-gray-800 rounded-lg shadow border-2 cursor-pointer',
                      'flex items-center justify-center text-center',
                      selectedItem === item.id
                        ? 'border-blue-500 dark:border-blue-400 ring-2 ring-blue-500/30'
                        : connectionCount(item.id!) > 0
                        ? 'border-blue-400 dark:border-blue-300'
                        : 'border-gray-200 dark:border-gray-700',
                      'hover:shadow-md transition-all duration-150 ease-in-out'
                    )}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <span className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                      {item.option_text}
                    </span>
                  </motion.div>
                ))
              ) : (
                <div className="px-4 py-3 bg-white/80 dark:bg-gray-800/80 rounded text-xs text-center text-gray-500">
                  Không có dữ liệu {leftColumnName.toLowerCase()}
                </div>
              )}
            </div>

            {/* Column B */}
            <div className="w-full flex flex-col items-center space-y-3">
              <h3 className="text-sm md:text-base font-semibold text-purple-600 dark:text-purple-300 text-center">
                {rightColumnName}
              </h3>
              {columnB.length > 0 ? (
                columnB.map((item) => (
                  <motion.div
                    key={item.id}
                    id={`item-${item.id}`}
                    onClick={() => handleItemClick(item.id!)}
                    className={cn(
                      'w-full max-w-[220px] px-3 py-2 min-h-[44px]',
                      'bg-white dark:bg-gray-800 rounded-lg shadow border-2 cursor-pointer',
                      'flex items-center justify-center text-center',
                      selectedItem === item.id
                        ? 'border-purple-500 dark:border-purple-400 ring-2 ring-purple-500/30'
                        : connectionCount(item.id!) > 0
                        ? 'border-purple-400 dark:border-purple-300'
                        : 'border-gray-200 dark:border-gray-700',
                      'hover:shadow-md transition-all duration-150 ease-in-out'
                    )}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <span className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                      {item.option_text}
                    </span>
                  </motion.div>
                ))
              ) : (
                <div className="px-4 py-3 bg-white/80 dark:bg-gray-800/80 rounded text-xs text-center text-gray-500">
                  Không có dữ liệu {rightColumnName.toLowerCase()}
                </div>
              )}
            </div>
          </div>

          {/* SVG Connections */}
          <svg
            ref={svgRef}
            className="absolute inset-0 pointer-events-none w-full h-full z-0"
            width={containerSize.width}
            height={containerSize.height}
            key={previewUpdate}
          >
            {connections.map((conn, index) => {
              const isCorrect = isConnectionCorrect(conn.columnA, conn.columnB);
              return (
                <path
                  key={`${index}-${previewUpdate}`}
                  d={getConnectionPath(conn.columnA, conn.columnB)}
                  stroke={isCorrect ? '#10b981' : '#ef4444'}
                  strokeWidth="2"
                  fill="none"
                  strokeDasharray={!isCorrect ? '5,5' : 'none'}
                  className="transition-all duration-300"
                  style={{
                    filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.1))',
                  }}
                />
              );
            })}
          </svg>
        </div>
      </CardContent>
    </Card>
  );
}
