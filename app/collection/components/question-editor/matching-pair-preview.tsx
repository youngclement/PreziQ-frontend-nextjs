'use client';

import type React from 'react';
import { useState, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trophy, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import type { QuizQuestion } from '../types';

interface Connection {
  columnA: string;
  columnB: string;
}

interface MatchingPair {
  left: {
    id: string;
    text: string;
    pairId: string;
  };
  right: {
    id: string;
    text: string;
    pairId: string;
  };
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

  // Get column data from question
  const columnA = question.options.filter((item) => item.type === 'left');
  const columnB = question.options.filter((item) => item.type === 'right');

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

    // Remove existing connections for both items
    const newConnections = connections.filter(
      (conn) =>
        conn.columnA !== dragged &&
        conn.columnB !== targetId &&
        conn.columnA !== targetId &&
        conn.columnB !== dragged
    );

    // Add new connection
    if (dragged.startsWith('a') && targetId.startsWith('b')) {
      newConnections.push({ columnA: dragged, columnB: targetId });
    } else if (dragged.startsWith('b') && targetId.startsWith('a')) {
      newConnections.push({ columnA: targetId, columnB: dragged });
    }

    setConnections(newConnections);
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

  // Check answers
  const checkAnswers = () => {
    let correct = 0;
    connections.forEach((conn) => {
      const left = columnA.find((i) => i.id === conn.columnA);
      const right = columnB.find((i) => i.id === conn.columnB);
      if (left?.pair_id === right?.pair_id) correct++;
    });
    setScore(correct);
    setShowResults(true);
    onCorrectAnswerChange?.(correct.toString());
  };

  // Reset quiz
  const resetQuiz = () => {
    setConnections([]);
    setShowResults(false);
    setScore(0);
  };

  // Check if item is connected
  const isConnected = (itemId: string) => {
    return connections.some(
      (conn) => conn.columnA === itemId || conn.columnB === itemId
    );
  };

  // Create matching pairs from options
  const matchingPairs: MatchingPair[] = columnA.map((leftItem) => {
    const rightItem = columnB.find((item) => item.pair_id === leftItem.pair_id);
    return {
      left: {
        id: leftItem.id!,
        text: leftItem.option_text,
        pairId: leftItem.pair_id!,
      },
      right: {
        id: rightItem!.id!,
        text: rightItem!.option_text,
        pairId: rightItem!.pair_id!,
      },
    };
  });

  // Check if a connection is correct
  const getConnectionResult = (aId: string, bId: string): boolean => {
    const pair = matchingPairs.find(
      (p) =>
        (p.left.id === aId && p.right.id === bId) ||
        (p.left.id === bId && p.right.id === aId)
    );
    return !!pair;
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
          <div className="text-gray-600 dark:text-gray-300 text-sm">
            Drag and drop to match items from Column A with their corresponding
            items in Column B
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
                      isConnected(item.id!)
                        ? 'border-blue-500 dark:border-blue-400'
                        : 'border-gray-200 dark:border-gray-700',
                      'hover:shadow-lg transition-all duration-200'
                    )}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <span className="font-medium text-gray-800 dark:text-gray-200">
                      {item.option_text}
                    </span>
                  </motion.div>
                ))
              ) : (
                <div>Không có dữ liệu cột A</div>
              )}
            </div>

            {/* Column B */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-center mb-4 text-purple-700 dark:text-purple-300">
                Column B
              </h3>
              {columnB.map((item) => (
                <motion.div
                  key={item.id}
                  id={`item-${item.id}`}
                  draggable
                  onDragStart={(e) => handleDragStart(e, item.id!)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => item.id && handleDrop(e, item.id)}
                  className={cn(
                    'p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md border-2 cursor-move',
                    isConnected(item.id!)
                      ? 'border-purple-500 dark:border-purple-400'
                      : 'border-gray-200 dark:border-gray-700',
                    'hover:shadow-lg transition-all duration-200'
                  )}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span className="font-medium text-gray-800 dark:text-gray-200">
                    {item.option_text}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>

          {/* SVG connections */}
          <svg
            ref={svgRef}
            className="absolute inset-0 pointer-events-none w-full h-full"
            style={{ zIndex: 1 }}
          >
            {connections.map((conn, index) => {
              const isCorrect = getConnectionResult(conn.columnA, conn.columnB);
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
            disabled={connections.length !== columnA.length}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transition-all"
          >
            <Trophy className="w-4 h-4 mr-2" />
            Check Answers
          </Button>
          <Button
            onClick={resetQuiz}
            variant="outline"
            className="px-6 py-2 border-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 shadow-sm hover:shadow-md transition-all"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset
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
                      Results
                    </h3>
                  </div>
                  <div className="flex justify-center gap-4 mb-4">
                    <Badge
                      variant="outline"
                      className="text-lg px-4 py-2 bg-blue-50 dark:bg-blue-900/50"
                    >
                      Score: {score}/{columnA.length}
                    </Badge>
                    <Badge
                      variant={
                        score === columnA.length ? 'default' : 'secondary'
                      }
                      className="text-lg px-4 py-2"
                    >
                      {score === columnA.length
                        ? 'Perfect!'
                        : `${Math.round((score / columnA.length) * 100)}%`}
                    </Badge>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300">
                    {score === columnA.length
                      ? 'Congratulations! You matched all pairs correctly!'
                      : 'Try again to get a better score!'}
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
