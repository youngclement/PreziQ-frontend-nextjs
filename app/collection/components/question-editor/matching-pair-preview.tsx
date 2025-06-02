'use client';

import type React from 'react';
import { useState, useRef, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trophy, RotateCcw, Info } from 'lucide-react';
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
}: MatchingPairPreviewProps) {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [dragged, setDragged] = useState<string | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);
  const svgRef = useRef<SVGSVGElement>(null);

  // Add new state for shuffled columns
  const [shuffledColumnA, setShuffledColumnA] = useState<
    typeof question.options
  >([]);
  const [shuffledColumnB, setShuffledColumnB] = useState<
    typeof question.options
  >([]);

  // Add useEffect to handle initial shuffle and reset
  useEffect(() => {
    const columnA = question.options.filter((item) => item.type === 'left');
    const columnB = question.options.filter((item) => item.type === 'right');

    setShuffledColumnA(shuffleArray(columnA));
    setShuffledColumnB(shuffleArray(columnB));
  }, [question.options, showResults]); // Re-shuffle when question changes or quiz is reset

  // Replace the direct column assignments with state values
  const columnA = shuffledColumnA;
  const columnB = shuffledColumnB;

  // Handle drag and drop
  const handleDragStart = (e: React.DragEvent, itemId: string) => {
    setDragged(itemId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!dragged) return;

    // Check if we're trying to connect items from the same column
    const draggedIsColumnA = dragged.startsWith('a');
    const targetIsColumnA = targetId.startsWith('a');

    if (draggedIsColumnA === targetIsColumnA) {
      // Both items are from the same column, don't allow connection
      return;
    }

    // Determine which is columnA and which is columnB
    const columnAId = draggedIsColumnA ? dragged : targetId;
    const columnBId = draggedIsColumnA ? targetId : dragged;

    // Check if this connection already exists
    const connectionExists = connections.some(
      (conn) => conn.columnA === columnAId && conn.columnB === columnBId
    );

    if (connectionExists) {
      // Connection already exists, remove it (toggle behavior)
      const newConnections = connections.filter(
        (conn) => !(conn.columnA === columnAId && conn.columnB === columnBId)
      );
      setConnections(newConnections);
    } else {
      // Add new connection
      setConnections([
        ...connections,
        { columnA: columnAId, columnB: columnBId },
      ]);
    }

    setDragged(null);
  };

  // Calculate connection path between items
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

    const controlX1 = startX + (endX - startX) * 0.3;
    const controlX2 = startX + (endX - startX) * 0.7;

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

  // Check answers
  const checkAnswers = () => {
    let correctCount = 0;
    let totalPossibleCorrect = 0;

    // Count total possible correct connections
    columnA.forEach((leftItem) => {
      const leftPairIds = leftItem.pair_id?.split(',') || [];
      leftPairIds.forEach((pairId) => {
        if (
          columnB.some((rightItem) =>
            rightItem.pair_id?.split(',').includes(pairId)
          )
        ) {
          totalPossibleCorrect++;
        }
      });
    });

    // Count correct connections made by user
    connections.forEach((conn) => {
      if (isConnectionCorrect(conn.columnA, conn.columnB)) {
        correctCount++;
      }
    });

    // Calculate score - can be more than the number of items in either column
    setScore(correctCount);
    setShowResults(true);
    onCorrectAnswerChange?.(correctCount.toString());
  };

  // Reset quiz
  const resetQuiz = () => {
    setConnections([]);
    setShowResults(false);
    setScore(0);
    // The useEffect will handle re-shuffling when showResults changes
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
        'border-none rounded-xl shadow-lg overflow-hidden transition-all duration-300 mx-auto',
        isActive
          ? 'ring-2 ring-primary/20 scale-100'
          : 'scale-[0.98] opacity-90 hover:opacity-100 hover:scale-[0.99]',
        viewMode === 'desktop' && 'max-w-4xl',
        viewMode === 'tablet' && 'max-w-2xl',
        viewMode === 'mobile' && 'max-w-sm'
      )}
    >
      <CardContent className="p-6 bg-gradient-to-br from-blue-50 to-purple-100 dark:from-blue-950 dark:to-purple-950">
        <div className="mb-6 text-center">
          <h2 className="text-xl font-bold mb-2 text-gray-800 dark:text-white">
            {question.question_text}
          </h2>
          <div className="flex items-center justify-center gap-2 text-gray-600 dark:text-gray-300 text-sm">
            <span>
              Kéo và thả để nối các mục phù hợp. Một mục có thể có nhiều đáp án
              đúng.
            </span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6">
                    <Info className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    Kéo từ một cột sang cột còn lại để tạo kết nối.
                    <br />
                    Kéo lại để xóa kết nối.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        <div className="relative">
          <div className="grid grid-cols-2 gap-8">
            {/* Column A */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-center mb-4 text-blue-700 dark:text-blue-300">
                Column A
              </h3>
              {columnA.length > 0 ? (
                columnA.map((item) => (
                  <motion.div
                    key={item.id}
                    id={`item-${item.id}`}
                    draggable
                    onDragStart={(e) => handleDragStart(e, item.id!)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => item.id && handleDrop(e, item.id)}
                    className={cn(
                      'p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md border-2 cursor-move',
                      connectionCount(item.id!) > 0
                        ? 'border-blue-500 dark:border-blue-400'
                        : 'border-gray-200 dark:border-gray-700',
                      'hover:shadow-lg transition-all duration-200'
                    )}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-gray-800 dark:text-gray-200">
                        {item.option_text}
                      </span>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="p-4 bg-white/80 dark:bg-gray-800/80 rounded-lg text-center">
                  Không có dữ liệu cột A
                </div>
              )}
            </div>

            {/* Column B */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-center mb-4 text-purple-700 dark:text-purple-300">
                Column B
              </h3>
              {columnB.length > 0 ? (
                columnB.map((item) => (
                  <motion.div
                    key={item.id}
                    id={`item-${item.id}`}
                    draggable
                    onDragStart={(e) => handleDragStart(e, item.id!)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => item.id && handleDrop(e, item.id)}
                    className={cn(
                      'p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md border-2 cursor-move',
                      connectionCount(item.id!) > 0
                        ? 'border-purple-500 dark:border-purple-400'
                        : 'border-gray-200 dark:border-gray-700',
                      'hover:shadow-lg transition-all duration-200'
                    )}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-gray-800 dark:text-gray-200">
                        {item.option_text}
                      </span>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="p-4 bg-white/80 dark:bg-gray-800/80 rounded-lg text-center">
                  Không có dữ liệu cột B
                </div>
              )}
            </div>
          </div>

          {/* SVG connections */}
          <svg
            ref={svgRef}
            className="absolute inset-0 pointer-events-none w-full h-full"
            style={{ zIndex: 1 }}
          >
            {connections.map((conn, index) => {
              const isCorrect = isConnectionCorrect(conn.columnA, conn.columnB);
              return (
                <path
                  key={index}
                  d={getConnectionPath(conn.columnA, conn.columnB)}
                  stroke={
                    showResults
                      ? isCorrect
                        ? '#10b981'
                        : '#ef4444'
                      : '#6366f1'
                  }
                  strokeWidth="3"
                  fill="none"
                  strokeDasharray={showResults && !isCorrect ? '5,5' : 'none'}
                  className="transition-all duration-300"
                />
              );
            })}
          </svg>
        </div>

        {/* Control buttons */}
        <div className="flex justify-center gap-4 mt-8">
          <Button
            onClick={checkAnswers}
            disabled={connections.length === 0}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transition-all"
          >
            <Trophy className="w-4 h-4 mr-2" />
            Kiểm tra đáp án
          </Button>
          <Button
            onClick={resetQuiz}
            variant="outline"
            className="px-6 py-2 border-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 shadow-sm hover:shadow-md transition-all"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Làm lại
          </Button>
        </div>

        {/* Results card */}
        {showResults && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="mt-6 border-2 border-blue-100 dark:border-blue-800 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-4">
                    <Trophy className="w-8 h-8 text-yellow-500" />
                    <h3 className="text-2xl font-bold text-gray-800 dark:text-white">
                      Kết quả
                    </h3>
                  </div>
                  <div className="flex justify-center gap-4 mb-4">
                    <Badge
                      variant="outline"
                      className="text-lg px-4 py-2 bg-blue-50 dark:bg-blue-900/50"
                    >
                      Điểm: {score}/{connections.length}
                    </Badge>
                    <Badge
                      variant={
                        score === connections.length ? 'default' : 'secondary'
                      }
                      className="text-lg px-4 py-2"
                    >
                      {score === connections.length && score > 0
                        ? 'Hoàn hảo!'
                        : `${Math.round(
                            (score / Math.max(connections.length, 1)) * 100
                          )}%`}
                    </Badge>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300">
                    {score === connections.length && score > 0
                      ? 'Chúc mừng! Bạn đã nối tất cả các cặp chính xác!'
                      : 'Hãy thử lại để đạt điểm cao hơn!'}
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}
