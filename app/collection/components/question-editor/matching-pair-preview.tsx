'use client';

import type React from 'react';
import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Info, Eye, Trash } from 'lucide-react';
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
import type {
  QuizMatchingPairAnswer,
  QuizMatchingPairItem,
  QuizMatchingPairConnection,
  ConnectionItemPayload,
} from '@/api-client/activities-api';
import { activitiesApi } from '@/api-client';

// Shuffle function for randomizing items in preview mode
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

interface MatchingPairPreviewProps {
  question: QuizQuestion;
  activityId: string;
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
  settingsUpdateTrigger?: number;
  onDeleteConnection?: (payload: ConnectionItemPayload) => void;
}

export function MatchingPairPreview({
  question,
  activityId,
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
  settingsUpdateTrigger = 0,
  onDeleteConnection,
}: MatchingPairPreviewProps) {
  const { t } = useTranslation();

  // Core state management
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
  const [selectedRight, setSelectedRight] = useState<string | null>(null);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState<string>('');
  const [isUpdating, setIsUpdating] = useState(false);

  // Refs for DOM manipulation
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const updateTimeoutRef = useRef<NodeJS.Timeout>();

  // Drag state
  const [dragState, setDragState] = useState<{
    isDragging: boolean;
    startItem: { id: string; type: 'left' | 'right' } | null;
    currentMousePos: { x: number; y: number } | null;
  }>({
    isDragging: false,
    startItem: null,
    currentMousePos: null,
  });

  // Get matching data from the question with fallback
  const matchingData = useMemo(() => {
    return question.quizMatchingPairAnswer || question.matching_data;
  }, [question.quizMatchingPairAnswer, question.matching_data]);

  // Memoized computed values
  const pairColorMap = useMemo(() => {
    const map = new Map<string, string>();
    if (matchingData?.connections) {
      matchingData.connections.forEach((connection, index) => {
        if (connection.quizMatchingPairConnectionId) {
          map.set(
            connection.quizMatchingPairConnectionId,
            PAIR_COLORS[index % PAIR_COLORS.length]
          );
        }
      });
    }
    return map;
  }, [matchingData?.connections]);

  // Memoized column data to prevent unnecessary re-renders
  const { shuffledColumnA, shuffledColumnB } = useMemo(() => {
    if (!matchingData?.items) {
      return { shuffledColumnA: [], shuffledColumnB: [] };
    }

    const columnA = matchingData.items
      .filter((item) => item.isLeftColumn)
      .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));

    const columnB = matchingData.items
      .filter((item) => !item.isLeftColumn)
      .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));

    return {
      shuffledColumnA: previewMode ? shuffleArray(columnA) : columnA,
      shuffledColumnB: previewMode ? shuffleArray(columnB) : columnB,
    };
  }, [matchingData?.items, previewMode, settingsUpdateTrigger]);

  // Memoized valid connections
  const validConnections = useMemo(() => {
    if (!matchingData?.items || !matchingData?.connections) return [];

    const existingItemIds = new Set(
      matchingData.items.map((item) => item.quizMatchingPairItemId)
    );

    return matchingData.connections.filter(
      (conn) =>
        conn.leftItem?.quizMatchingPairItemId &&
        conn.rightItem?.quizMatchingPairItemId &&
        existingItemIds.has(conn.leftItem.quizMatchingPairItemId) &&
        existingItemIds.has(conn.rightItem.quizMatchingPairItemId)
    );
  }, [matchingData?.items, matchingData?.connections]);

  // Optimized connection path calculation
  const getConnectionPath = useCallback(
    (leftItemId: string, rightItemId: string) => {
      const leftElement = document.getElementById(`item-${leftItemId}`);
      const rightElement = document.getElementById(`item-${rightItemId}`);
      const svgElement = svgRef.current;

      if (!leftElement || !rightElement || !svgElement) {
        return '';
      }

      const svgRect = svgElement.getBoundingClientRect();
      const leftRect = leftElement.getBoundingClientRect();
      const rightRect = rightElement.getBoundingClientRect();

      if (
        leftRect.width === 0 ||
        rightRect.width === 0 ||
        svgRect.width === 0
      ) {
        return '';
      }

      const startX = leftRect.right - svgRect.left;
      const startY = leftRect.top + leftRect.height / 2 - svgRect.top;
      const endX = rightRect.left - svgRect.left;
      const endY = rightRect.top + rightRect.height / 2 - svgRect.top;

      if (isNaN(startX) || isNaN(startY) || isNaN(endX) || isNaN(endY)) {
        return '';
      }

      const distance = endX - startX;
      const curveOffset = Math.min(distance * 0.25, 80);

      const controlX1 = startX + curveOffset;
      const controlX2 = endX - curveOffset;
      const controlY1 = startY;
      const controlY2 = endY;

      return `M ${startX} ${startY} C ${controlX1} ${controlY1}, ${controlX2} ${controlY2}, ${endX} ${endY}`;
    },
    []
  );

  // Optimized connection management
  const handleConnectionOperation = useCallback(
    async (
      operation: 'add' | 'delete',
      leftItemId: string,
      rightItemId: string,
      connectionId?: string
    ) => {
      if (isUpdating) return;

      setIsUpdating(true);

      try {
        if (operation === 'delete' && connectionId && activityId) {
          await activitiesApi.deleteMatchingPairConnection(
            activityId,
            connectionId
          );
        } else if (operation === 'add' && activityId) {
          await activitiesApi.addMatchingPairConnection(activityId, {
            leftItemId,
            rightItemId,
          });
        }

        // Single API call to get fresh data
        const response = await activitiesApi.getActivityById(activityId);
        const updatedConnections =
          response.data.data.quiz.quizMatchingPairAnswer?.connections ?? [];

        // Update parent component once
        onOptionChange(
          questionIndex,
          -1,
          'update_connections',
          updatedConnections
        );

        // Call callback if provided
        if (operation === 'delete' && onDeleteConnection) {
          onDeleteConnection({ leftItemId, rightItemId });
        }
      } catch (error) {
        console.error(`Failed to ${operation} connection:`, error);
      } finally {
        setIsUpdating(false);
      }
    },
    [isUpdating, activityId, questionIndex, onOptionChange, onDeleteConnection]
  );

  // Optimized item click handler
  const handleItemClick = useCallback(
    async (type: 'left' | 'right', itemId: string) => {
      if (previewMode || !editMode || isUpdating) return;

      // Handle same type selection
      if (type === 'left' && selectedLeft) {
        setSelectedLeft(itemId);
        return;
      }
      if (type === 'right' && selectedRight) {
        setSelectedRight(itemId);
        return;
      }

      // Handle initial selection
      if (!selectedLeft && !selectedRight) {
        if (type === 'left') setSelectedLeft(itemId);
        else setSelectedRight(itemId);
        return;
      }

      // Handle cross-column selection
      if (
        (selectedLeft && type === 'right') ||
        (selectedRight && type === 'left')
      ) {
        const leftItemId = type === 'left' ? itemId : selectedLeft!;
        const rightItemId = type === 'right' ? itemId : selectedRight!;

        const existingConnection = validConnections.find(
          (c) =>
            c.leftItem.quizMatchingPairItemId === leftItemId &&
            c.rightItem.quizMatchingPairItemId === rightItemId
        );

        if (existingConnection) {
          await handleConnectionOperation(
            'delete',
            leftItemId,
            rightItemId,
            existingConnection.quizMatchingPairConnectionId
          );
        } else {
          await handleConnectionOperation('add', leftItemId, rightItemId);
        }

        setSelectedLeft(null);
        setSelectedRight(null);
      }
    },
    [
      previewMode,
      editMode,
      isUpdating,
      selectedLeft,
      selectedRight,
      validConnections,
      handleConnectionOperation,
    ]
  );

  // Optimized connection click handler
  const handleConnectionClick = useCallback(
    async (conn: QuizMatchingPairConnection) => {
      if (isUpdating) return;

      const connectionId = conn.quizMatchingPairConnectionId;
      const leftItemId = conn.leftItem.quizMatchingPairItemId!;
      const rightItemId = conn.rightItem.quizMatchingPairItemId!;

      if (connectionId && activityId) {
        await handleConnectionOperation(
          'delete',
          leftItemId,
          rightItemId,
          connectionId
        );
      }
    },
    [isUpdating, activityId, handleConnectionOperation]
  );

  // Optimized drag handlers
  const handleMouseDown = useCallback(
    (type: 'left' | 'right', itemId: string, event: React.MouseEvent) => {
      if (previewMode || !editMode || isUpdating) return;

      event.preventDefault();
      setDragState({
        isDragging: true,
        startItem: { id: itemId, type },
        currentMousePos: { x: event.clientX, y: event.clientY },
      });
    },
    [previewMode, editMode, isUpdating]
  );

  const handleMouseMove = useCallback(
    (event: MouseEvent) => {
      if (dragState.isDragging && dragState.startItem) {
        setDragState((prev) => ({
          ...prev,
          currentMousePos: { x: event.clientX, y: event.clientY },
        }));
      }
    },
    [dragState.isDragging, dragState.startItem]
  );

  const handleMouseUp = useCallback(
    async (type: 'left' | 'right', itemId: string) => {
      if (
        !dragState.isDragging ||
        !dragState.startItem ||
        previewMode ||
        !editMode ||
        isUpdating
      ) {
        setDragState({
          isDragging: false,
          startItem: null,
          currentMousePos: null,
        });
        return;
      }

      if (dragState.startItem.type !== type) {
        const leftItemId =
          dragState.startItem.type === 'left' ? dragState.startItem.id : itemId;
        const rightItemId =
          dragState.startItem.type === 'right'
            ? dragState.startItem.id
            : itemId;

        const existingConnection = validConnections.find(
          (c) =>
            c.leftItem.quizMatchingPairItemId === leftItemId &&
            c.rightItem.quizMatchingPairItemId === rightItemId
        );

        if (!existingConnection) {
          await handleConnectionOperation('add', leftItemId, rightItemId);
        }
      }

      setDragState({
        isDragging: false,
        startItem: null,
        currentMousePos: null,
      });
    },
    [
      dragState,
      previewMode,
      editMode,
      isUpdating,
      validConnections,
      handleConnectionOperation,
    ]
  );

  // Mouse event listeners
  useEffect(() => {
    if (dragState.isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', () => {
        setDragState({
          isDragging: false,
          startItem: null,
          currentMousePos: null,
        });
      });

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', () => {
          setDragState({
            isDragging: false,
            startItem: null,
            currentMousePos: null,
          });
        });
      };
    }
  }, [dragState.isDragging, handleMouseMove]);

  // Optimized item operations
  const handleAddPair = useCallback(async () => {
    if (!question.activity_id || isUpdating) return;

    setIsUpdating(true);
    try {
      await activitiesApi.addMatchingPair(question.activity_id);
      const response = await activitiesApi.getActivityById(
        question.activity_id
      );
      const updatedItems =
        response.data.data.quiz.quizMatchingPairAnswer?.items ?? [];
      onOptionChange(questionIndex, -1, 'update_items', updatedItems);
    } catch (error) {
      console.error('Failed to add pair:', error);
    } finally {
      setIsUpdating(false);
    }
  }, [question.activity_id, isUpdating, questionIndex, onOptionChange]);

  const handleDeleteItem = useCallback(
    async (itemId: string) => {
      if (!question.activity_id || isUpdating) return;

      setIsUpdating(true);
      try {
        await activitiesApi.deleteMatchingPairItem(
          question.activity_id,
          itemId
        );
        const response = await activitiesApi.getActivityById(
          question.activity_id
        );
        const updatedItems =
          response.data.data.quiz.quizMatchingPairAnswer?.items ?? [];
        onOptionChange(questionIndex, -1, 'update_items', updatedItems);
      } catch (error) {
        console.error('Failed to delete item:', error);
      } finally {
        setIsUpdating(false);
      }
    },
    [question.activity_id, isUpdating, questionIndex, onOptionChange]
  );

  // Optimized item editing
  const handleInputFocus = useCallback((itemId: string, value: string) => {
    setEditingItemId(itemId);
    setEditingValue(value);
  }, []);

  const handleInputBlur = useCallback(
    async (itemId: string) => {
      if (!question.activity_id || !editingItemId || isUpdating) return;
      if (editingValue.trim() === '') return;

      setIsUpdating(true);
      try {
        const item = matchingData?.items?.find(
          (it) => it.quizMatchingPairItemId === itemId
        );
        if (!item) return;

        const payload = {
          content: editingValue,
          isLeftColumn: item.isLeftColumn,
          displayOrder: item.displayOrder,
        };

        await activitiesApi.updateReorderQuizItem(
          question.activity_id,
          itemId,
          payload
        );

        const response = await activitiesApi.getActivityById(
          question.activity_id
        );
        const updatedItems =
          response.data.data.quiz.quizMatchingPairAnswer?.items ?? [];
        onOptionChange(questionIndex, -1, 'update_items', updatedItems);
      } catch (error) {
        console.error('Failed to update item:', error);
      } finally {
        setIsUpdating(false);
        setEditingItemId(null);
        setEditingValue('');
      }
    },
    [
      question.activity_id,
      editingItemId,
      editingValue,
      isUpdating,
      matchingData?.items,
      questionIndex,
      onOptionChange,
    ]
  );

  // Utility functions
  const toggleExpand = useCallback((itemId: string) => {
    setExpandedItems((prev) => {
      const newSet = new Set(prev);
      if (prev.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  }, []);

  // If no matching data, show empty state
  if (!matchingData) {
    return (
      <div className="flex items-center justify-center h-32 text-gray-500">
        No matching pair data available
      </div>
    );
  }

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
      <div className="flex justify-around items-start gap-4 md:gap-8">
        {/* Column A */}
        <div className="w-1/3 flex flex-col items-center gap-2 md:gap-3">
          <h3 className="font-bold text-lg text-center text-gray-700 dark:text-gray-300">
            {matchingData.leftColumnName || leftColumnName}
          </h3>
          <div className="w-full space-y-2">
            {shuffledColumnA.map((item) => {
              const connection = validConnections.find(
                (c) =>
                  c.leftItem.quizMatchingPairItemId ===
                  item.quizMatchingPairItemId
              );
              const connectionColor = connection?.quizMatchingPairConnectionId
                ? pairColorMap.get(connection.quizMatchingPairConnectionId)
                : undefined;

              const isSelected = selectedLeft === item.quizMatchingPairItemId;
              const isConnected = validConnections.some(
                (conn) =>
                  conn.leftItem.quizMatchingPairItemId ===
                    item.quizMatchingPairItemId ||
                  conn.rightItem.quizMatchingPairItemId ===
                    item.quizMatchingPairItemId
              );

              return (
                <motion.div
                  key={item.quizMatchingPairItemId}
                  id={`item-${item.quizMatchingPairItemId}`}
                  className={cn(
                    'p-2 md:p-3 rounded-lg text-center transition-all duration-200 w-full border-2',
                    !previewMode && editMode && 'cursor-pointer',
                    isSelected && 'ring-2 ring-primary',
                    isConnected && 'bg-green-100',
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
                  onClick={(e) => {
                    if ((e.target as HTMLElement).closest('input')) return;
                    item.quizMatchingPairItemId &&
                      handleItemClick('left', item.quizMatchingPairItemId);
                  }}
                  onMouseDown={(e) => {
                    if ((e.target as HTMLElement).closest('input')) return;
                    item.quizMatchingPairItemId &&
                      handleMouseDown('left', item.quizMatchingPairItemId, e);
                  }}
                  onMouseUp={(e) => {
                    if ((e.target as HTMLElement).closest('input')) return;
                    item.quizMatchingPairItemId &&
                      handleMouseUp('left', item.quizMatchingPairItemId);
                  }}
                  whileHover={{
                    scale: !previewMode && editMode ? 1.03 : 1,
                  }}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="flex items-center justify-between gap-2">
                    {!previewMode && editMode ? (
                      editingItemId === item.quizMatchingPairItemId ? (
                        <input
                          value={editingValue}
                          autoFocus
                          onChange={(e) => setEditingValue(e.target.value)}
                          onBlur={() =>
                            handleInputBlur(item.quizMatchingPairItemId!)
                          }
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              (e.target as HTMLInputElement).blur();
                            }
                          }}
                          className="w-full bg-transparent border-b border-gray-300 focus:outline-none"
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : (
                        <div
                          className="w-full"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleInputFocus(
                              item.quizMatchingPairItemId!,
                              item.content || ''
                            );
                          }}
                        >
                          <input
                            value={item.content}
                            readOnly
                            className="w-full bg-transparent border-b border-gray-300 focus:outline-none cursor-pointer"
                            tabIndex={-1}
                            style={{ pointerEvents: 'none' }}
                          />
                        </div>
                      )
                    ) : (
                      <p
                        className={cn(
                          'text-sm md:text-base max-w-full',
                          expandedItems.has(item.quizMatchingPairItemId ?? '')
                            ? 'whitespace-pre-line break-words'
                            : 'truncate'
                        )}
                        style={
                          expandedItems.has(item.quizMatchingPairItemId ?? '')
                            ? { maxHeight: 300, overflow: 'auto' }
                            : { maxHeight: 24, overflow: 'hidden' }
                        }
                        onClick={() => {
                          if (item.quizMatchingPairItemId)
                            toggleExpand(item.quizMatchingPairItemId);
                        }}
                        title={
                          expandedItems.has(item.quizMatchingPairItemId ?? '')
                            ? ''
                            : item.content
                        }
                      >
                        {item.content}
                      </p>
                    )}
                    <button
                      type="button"
                      className="ml-1 p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (item.quizMatchingPairItemId)
                          toggleExpand(item.quizMatchingPairItemId);
                      }}
                      tabIndex={-1}
                      aria-label={
                        expandedItems.has(item.quizMatchingPairItemId ?? '')
                          ? 'Thu nhỏ'
                          : 'Xem chi tiết'
                      }
                    >
                      <Eye
                        size={16}
                        className={
                          expandedItems.has(item.quizMatchingPairItemId ?? '')
                            ? 'text-blue-500'
                            : ''
                        }
                      />
                    </button>
                    {!previewMode && editMode && (
                      <button
                        className="ml-2 text-red-500 hover:text-red-700"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteItem(item.quizMatchingPairItemId!);
                        }}
                      >
                        <Trash size={16} />
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Column B */}
        <div className="w-1/3 flex flex-col items-center gap-2 md:gap-3">
          <h3 className="font-bold text-lg text-center text-gray-700 dark:text-gray-300">
            {matchingData.rightColumnName || rightColumnName}
          </h3>
          <div className="w-full space-y-2">
            {shuffledColumnB.map((item) => {
              const connection = validConnections.find(
                (c) =>
                  c.rightItem.quizMatchingPairItemId ===
                  item.quizMatchingPairItemId
              );
              const connectionColor = connection?.quizMatchingPairConnectionId
                ? pairColorMap.get(connection.quizMatchingPairConnectionId)
                : undefined;

              const isSelected = selectedRight === item.quizMatchingPairItemId;
              const isConnected = validConnections.some(
                (conn) =>
                  conn.leftItem.quizMatchingPairItemId ===
                    item.quizMatchingPairItemId ||
                  conn.rightItem.quizMatchingPairItemId ===
                    item.quizMatchingPairItemId
              );

              return (
                <motion.div
                  key={item.quizMatchingPairItemId}
                  id={`item-${item.quizMatchingPairItemId}`}
                  className={cn(
                    'p-2 md:p-3 rounded-lg text-center transition-all duration-200 w-full border-2',
                    !previewMode && editMode && 'cursor-pointer',
                    isSelected && 'ring-2 ring-primary',
                    isConnected && 'bg-green-100',
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
                  onClick={(e) => {
                    if ((e.target as HTMLElement).closest('input')) return;
                    item.quizMatchingPairItemId &&
                      handleItemClick('right', item.quizMatchingPairItemId);
                  }}
                  onMouseDown={(e) => {
                    if ((e.target as HTMLElement).closest('input')) return;
                    item.quizMatchingPairItemId &&
                      handleMouseDown('right', item.quizMatchingPairItemId, e);
                  }}
                  onMouseUp={(e) => {
                    if ((e.target as HTMLElement).closest('input')) return;
                    item.quizMatchingPairItemId &&
                      handleMouseUp('right', item.quizMatchingPairItemId);
                  }}
                  whileHover={{
                    scale: !previewMode && editMode ? 1.03 : 1,
                  }}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="flex items-center justify-between gap-2">
                    {!previewMode && editMode ? (
                      editingItemId === item.quizMatchingPairItemId ? (
                        <input
                          value={editingValue}
                          autoFocus
                          onChange={(e) => setEditingValue(e.target.value)}
                          onBlur={() =>
                            handleInputBlur(item.quizMatchingPairItemId!)
                          }
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              (e.target as HTMLInputElement).blur();
                            }
                          }}
                          className="w-full bg-transparent border-b border-gray-300 focus:outline-none"
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : (
                        <div
                          className="w-full"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleInputFocus(
                              item.quizMatchingPairItemId!,
                              item.content || ''
                            );
                          }}
                        >
                          <input
                            value={item.content}
                            readOnly
                            className="w-full bg-transparent border-b border-gray-300 focus:outline-none cursor-pointer"
                            tabIndex={-1}
                            style={{ pointerEvents: 'none' }}
                          />
                        </div>
                      )
                    ) : (
                      <p
                        className={cn(
                          'text-sm md:text-base max-w-full',
                          expandedItems.has(item.quizMatchingPairItemId ?? '')
                            ? 'whitespace-pre-line break-words'
                            : 'truncate'
                        )}
                        style={
                          expandedItems.has(item.quizMatchingPairItemId ?? '')
                            ? { maxHeight: 300, overflow: 'auto' }
                            : { maxHeight: 24, overflow: 'hidden' }
                        }
                        onClick={() => {
                          if (item.quizMatchingPairItemId)
                            toggleExpand(item.quizMatchingPairItemId);
                        }}
                        title={
                          expandedItems.has(item.quizMatchingPairItemId ?? '')
                            ? ''
                            : item.content
                        }
                      >
                        {item.content}
                      </p>
                    )}
                    <button
                      type="button"
                      className="ml-1 p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (item.quizMatchingPairItemId)
                          toggleExpand(item.quizMatchingPairItemId);
                      }}
                      tabIndex={-1}
                      aria-label={
                        expandedItems.has(item.quizMatchingPairItemId ?? '')
                          ? 'Thu nhỏ'
                          : 'Xem chi tiết'
                      }
                    >
                      <Eye
                        size={16}
                        className={
                          expandedItems.has(item.quizMatchingPairItemId ?? '')
                            ? 'text-blue-500'
                            : ''
                        }
                      />
                    </button>
                    {!previewMode && editMode && (
                      <button
                        className="ml-2 text-red-500 hover:text-red-700"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteItem(item.quizMatchingPairItemId!);
                        }}
                      >
                        <Trash size={16} />
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      {/* SVG for drawing connection lines */}
      <svg
        ref={svgRef}
        className="absolute top-0 left-0 w-full h-full pointer-events-none"
        style={{ zIndex: 20 }}
      >
        <defs>
          {PAIR_COLORS.map((color) => (
            <marker
              key={color}
              id={`marker-${color.replace('#', '')}`}
              markerWidth="8"
              markerHeight="8"
              refX="4"
              refY="4"
            >
              <circle
                cx="4"
                cy="4"
                r="3"
                stroke={color}
                className="fill-white"
                strokeWidth="1.5"
              />
            </marker>
          ))}
        </defs>
        <g>
          {validConnections.map((conn, index) => {
            const pathColor = conn.quizMatchingPairConnectionId
              ? pairColorMap.get(conn.quizMatchingPairConnectionId)
              : '#3b82f6';

            const pathData = getConnectionPath(
              conn.leftItem.quizMatchingPairItemId!,
              conn.rightItem.quizMatchingPairItemId!
            );

            if (!pathData) return null;

            return (
              <g
                key={`${conn.leftItem.quizMatchingPairItemId}-${conn.rightItem.quizMatchingPairItemId}-${index}`}
              >
                {/* Invisible path for click detection */}
                <path
                  d={pathData}
                  stroke="transparent"
                  strokeWidth="16"
                  fill="none"
                  style={{
                    cursor: !previewMode && editMode ? 'pointer' : 'default',
                    pointerEvents: !previewMode && editMode ? 'stroke' : 'none',
                  }}
                  onClick={() => {
                    if (!previewMode && editMode) handleConnectionClick(conn);
                  }}
                  className="pointer-events-auto"
                />
                {/* Visible connection path */}
                <motion.path
                  d={pathData}
                  className="stroke-2 transition-all duration-300 pointer-events-auto"
                  stroke={pathColor}
                  strokeWidth="2.5"
                  fill="none"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  markerStart={
                    pathColor
                      ? `url(#marker-${pathColor.replace('#', '')})`
                      : undefined
                  }
                  markerEnd={
                    pathColor
                      ? `url(#marker-${pathColor.replace('#', '')})`
                      : undefined
                  }
                  style={{
                    cursor: !previewMode && editMode ? 'pointer' : 'default',
                    pointerEvents: !previewMode && editMode ? 'stroke' : 'none',
                  }}
                />
              </g>
            );
          })}
        </g>
        {/* Drag preview line */}
        {dragState.isDragging &&
          dragState.startItem &&
          dragState.currentMousePos && (
            <line
              x1={dragState.startItem.type === 'left' ? '25%' : '75%'}
              y1="50%"
              x2={dragState.currentMousePos.x}
              y2={dragState.currentMousePos.y}
              stroke="#10b981"
              strokeWidth="2"
              strokeDasharray="5,5"
              opacity="0.7"
            />
          )}
      </svg>

      {!previewMode && (
        <div className="absolute top-2 right-2">
          <TooltipProvider>
            <Tooltip>
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

      {!previewMode && editMode && (
        <div className="w-full flex justify-center mt-4">
          <button
            className="py-2 px-4 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 disabled:opacity-50"
            onClick={handleAddPair}
            disabled={isUpdating}
          >
            + Add Pair
          </button>
        </div>
      )}
    </div>
  );
}
