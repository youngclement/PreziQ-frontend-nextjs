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
  const [connections, setConnections] = useState<QuizMatchingPairConnection[]>(
    []
  );
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
  const [selectedRight, setSelectedRight] = useState<string | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [dataVersion, setDataVersion] = useState(0);
  const [dragState, setDragState] = useState<{
    isDragging: boolean;
    startItem: { id: string; type: 'left' | 'right' } | null;
    currentMousePos: { x: number; y: number } | null;
  }>({
    isDragging: false,
    startItem: null,
    currentMousePos: null,
  });
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState<string>('');

  // Get matching data from the question with fallback
  const matchingData = useMemo(() => {
    return question.quizMatchingPairAnswer || question.matching_data;
  }, [question.quizMatchingPairAnswer, question.matching_data]);

  // Create color map for pairs based on connection IDs
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

  const connectionColors = [
    {
      light: 'bg-red-100 border-red-400 text-red-700',
      dark: 'dark:bg-rose-500/40 dark:border-rose-300 dark:text-rose-100',
    },
    {
      light: 'bg-blue-100 border-blue-400 text-blue-700',
      dark: 'dark:bg-cyan-500/40 dark:border-cyan-300 dark:text-cyan-100',
    },
    {
      light: 'bg-yellow-100 border-yellow-400 text-yellow-700',
      dark: 'dark:bg-amber-400/30 dark:border-amber-200 dark:text-amber-50',
    },
    {
      light: 'bg-green-100 border-green-400 text-green-700',
      dark: 'dark:bg-lime-500/30 dark:border-lime-300 dark:text-lime-100',
    },
    {
      light: 'bg-purple-100 border-purple-400 text-purple-700',
      dark: 'dark:bg-violet-500/30 dark:border-violet-300 dark:text-violet-100',
    },
    {
      light: 'bg-pink-100 border-pink-400 text-pink-700',
      dark: 'dark:bg-fuchsia-500/30 dark:border-fuchsia-300 dark:text-fuchsia-100',
    },
  ];

  // State for shuffled columns - only shuffle once per data update
  const [shuffledColumnA, setShuffledColumnA] = useState<
    QuizMatchingPairItem[]
  >([]);
  const [shuffledColumnB, setShuffledColumnB] = useState<
    QuizMatchingPairItem[]
  >([]);

  // Update columns when matching data changes
  useEffect(() => {
    if (!matchingData?.items) {
      setShuffledColumnA([]);
      setShuffledColumnB([]);
      return;
    }

    const columnA = matchingData.items
      .filter((item) => item.isLeftColumn)
      .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));

    const columnB = matchingData.items
      .filter((item) => !item.isLeftColumn)
      .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));

    // Only shuffle if in preview mode
    if (previewMode) {
      setShuffledColumnA(shuffleArray(columnA));
      setShuffledColumnB(shuffleArray(columnB));
    } else {
      setShuffledColumnA(columnA);
      setShuffledColumnB(columnB);
    }

    // Update data version to trigger re-render
    setDataVersion((prev) => prev + 1);
  }, [matchingData?.items, previewMode, settingsUpdateTrigger]);

  // Update connections when matching data changes
  useEffect(() => {
    if (matchingData?.connections) {
      setConnections(matchingData.connections);
    }
  }, [matchingData?.connections, settingsUpdateTrigger]);

  // Update container size and handle resize
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        setContainerSize({ width, height });
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);

    const resizeObserver = new ResizeObserver(updateSize);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      window.removeEventListener('resize', updateSize);
      resizeObserver.disconnect();
    };
  }, []);

  // Handle item click for edit mode
  const handleItemClick = useCallback(
    async (type: 'left' | 'right', itemId: string) => {
      if (previewMode || !editMode) return;

      if (selectedLeft && selectedRight) {
        // Kiểm tra nếu đã có connection giữa hai item này
        const leftItemId = type === 'left' ? itemId : selectedLeft;
        const rightItemId = type === 'right' ? itemId : selectedRight;

        const existingConnection = connections.find(
          (c) =>
            c.leftItem.quizMatchingPairItemId === leftItemId &&
            c.rightItem.quizMatchingPairItemId === rightItemId
        );

        if (existingConnection && question.activity_id) {
          // Nếu đã có connection, thì xóa connection này
          if (existingConnection.quizMatchingPairConnectionId) {
            try {
              await activitiesApi.deleteMatchingPairConnection(
                question.activity_id,
                existingConnection.quizMatchingPairConnectionId
              );
              setConnections((prev) =>
                prev.filter(
                  (c) =>
                    c.quizMatchingPairConnectionId !==
                    existingConnection.quizMatchingPairConnectionId
                )
              );
              if (onDeleteConnection) {
                const payload: ConnectionItemPayload = {
                  leftItemId,
                  rightItemId,
                };
                onDeleteConnection(payload);
              }
            } catch (error) {
              console.error('Failed to delete connection:', error);
            }
          }
        } else if (!existingConnection && question.activity_id) {
          // Nếu chưa có connection, thì tạo connection mới
          try {
            const payload: ConnectionItemPayload = {
              leftItemId,
              rightItemId,
            };

            await activitiesApi.addMatchingPairConnection(
              question.activity_id,
              payload
            );

            // Refresh data from server
            const response = await activitiesApi.getActivityById(
              question.activity_id
            );
            const updatedConnections =
              response.data.data.quiz.quizMatchingPairAnswer?.connections ?? [];

            setConnections(updatedConnections);

            // Update parent component
            onOptionChange(
              questionIndex,
              -1,
              'update_connections',
              updatedConnections
            );
          } catch (error) {
            console.error('Failed to create connection:', error);
          }
        }
        setSelectedLeft(null);
        setSelectedRight(null);
      } else {
        // No item selected - select this one
        if (type === 'left') setSelectedLeft(itemId);
        else setSelectedRight(itemId);
      }
    },
    [
      previewMode,
      editMode,
      selectedLeft,
      selectedRight,
      connections,
      question.activity_id,
      questionIndex,
      onOptionChange,
      onDeleteConnection,
    ]
  );

  // Calculate connection path for SVG
  const getConnectionPath = useCallback(
    (leftItemId: string, rightItemId: string) => {
      const leftElement = document.getElementById(`item-${leftItemId}`);
      const rightElement = document.getElementById(`item-${rightItemId}`);
      const svgElement = svgRef.current;

      if (!leftElement || !rightElement || !svgElement) return '';

      const svgRect = svgElement.getBoundingClientRect();
      const leftRect = leftElement.getBoundingClientRect();
      const rightRect = rightElement.getBoundingClientRect();

      const startX = leftRect.right - svgRect.left;
      const startY = leftRect.top + leftRect.height / 2 - svgRect.top;
      const endX = rightRect.left - svgRect.left;
      const endY = rightRect.top + rightRect.height / 2 - svgRect.top;

      // Calculate control points for smooth curve
      const controlY = startY + (endY - startY) / 2;
      const controlX1 = startX + (endX - startX) * 0.25;
      const controlX2 = startX + (endX - startX) * 0.75;

      return `M ${startX} ${startY} C ${controlX1} ${startY}, ${controlX2} ${endY}, ${endX} ${endY}`;
    },
    []
  );

  // Get connections for a specific item
  const getItemConnections = useCallback(
    (itemId: string): QuizMatchingPairConnection[] => {
      return connections.filter(
        (c) =>
          c.leftItem.quizMatchingPairItemId === itemId ||
          c.rightItem.quizMatchingPairItemId === itemId
      );
    },
    [connections]
  );

  // Count connections for a specific item
  const connectionCount = useCallback(
    (itemId: string): number => {
      return connections.filter(
        (c) =>
          c.leftItem.quizMatchingPairItemId === itemId ||
          c.rightItem.quizMatchingPairItemId === itemId
      ).length;
    },
    [connections]
  );

  const handleConnectionClick = useCallback(
    async (conn: QuizMatchingPairConnection) => {
      console.log('Clicked connection:', conn);
      const connectionId = conn.quizMatchingPairConnectionId;
      // const activityId = question.activity_id;
      console.log(activityId);

      if (connectionId && activityId) {
        try {
          // Call API to delete connection
          await activitiesApi.deleteMatchingPairConnection(
            activityId,
            connectionId
          );

          // Update local state immediately
          setConnections((prev) =>
            prev.filter((c) => c.quizMatchingPairConnectionId !== connectionId)
          );

          // Call the callback to update parent component
          if (onDeleteConnection) {
            const payload: ConnectionItemPayload = {
              leftItemId: conn.leftItem.quizMatchingPairItemId!,
              rightItemId: conn.rightItem.quizMatchingPairItemId!,
            };
            onDeleteConnection(payload);
          }
        } catch (error) {
          console.error('Failed to delete connection:', error);
        }
      }
    },
    [previewMode, editMode, question.activity_id, onDeleteConnection]
  );

  const handleMouseDown = useCallback(
    (type: 'left' | 'right', itemId: string, event: React.MouseEvent) => {
      if (previewMode || !editMode) return;

      event.preventDefault();
      setDragState({
        isDragging: true,
        startItem: { id: itemId, type },
        currentMousePos: { x: event.clientX, y: event.clientY },
      });
    },
    [previewMode, editMode]
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
        !editMode
      ) {
        setDragState({
          isDragging: false,
          startItem: null,
          currentMousePos: null,
        });
        return;
      }

      // Only create connection if dragging between different columns
      if (dragState.startItem.type !== type) {
        const leftItemId =
          dragState.startItem.type === 'left' ? dragState.startItem.id : itemId;
        const rightItemId =
          dragState.startItem.type === 'right'
            ? dragState.startItem.id
            : itemId;

        // Check if connection already exists
        const existingConnection = connections.find(
          (c) =>
            c.leftItem.quizMatchingPairItemId === leftItemId &&
            c.rightItem.quizMatchingPairItemId === rightItemId
        );

        if (!existingConnection && question.activity_id) {
          try {
            const payload: ConnectionItemPayload = { leftItemId, rightItemId };
            await activitiesApi.addMatchingPairConnection(
              question.activity_id,
              payload
            );

            // Refresh data
            const response = await activitiesApi.getActivityById(
              question.activity_id
            );
            const updatedConnections =
              response.data.data.quiz.quizMatchingPairAnswer?.connections ?? [];

            setConnections(updatedConnections);
            onOptionChange(
              questionIndex,
              -1,
              'update_connections',
              updatedConnections
            );
          } catch (error) {
            console.error('Failed to create connection:', error);
          }
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
      connections,
      question.activity_id,
      questionIndex,
      onOptionChange,
    ]
  );

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

  const handleAddPair = async () => {
    if (!question.activity_id) return;
    try {
      await activitiesApi.addMatchingPair(question.activity_id);
      // Refresh data
      const response = await activitiesApi.getActivityById(
        question.activity_id
      );
      const updatedItems =
        response.data.data.quiz.quizMatchingPairAnswer?.items ?? [];
      onOptionChange(questionIndex, -1, 'update_items', updatedItems);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!question.activity_id) return;
    try {
      await activitiesApi.deleteMatchingPairItem(question.activity_id, itemId);
      const response = await activitiesApi.getActivityById(
        question.activity_id
      );
      const updatedItems =
        response.data.data.quiz.quizMatchingPairAnswer?.items ?? [];
      onOptionChange(questionIndex, -1, 'update_items', updatedItems);
    } catch (e) {
      console.error(e);
    }
  };

  const handleEditItem = useCallback(
    async (itemId: string, newContent: string) => {
      if (!question.activity_id || !matchingData?.items) return;
      try {
        const item = matchingData.items.find(
          (it) => it.quizMatchingPairItemId === itemId
        );
        if (!item) return;

        const payload = {
          content: newContent,
          isLeftColumn: item.isLeftColumn,
          displayOrder: item.displayOrder,
        };
        await activitiesApi.updateReorderQuizItem(
          question.activity_id,
          itemId,
          payload
        );
        // Fetch lại dữ liệu mới
        const response = await activitiesApi.getActivityById(
          question.activity_id
        );
        const updatedItems =
          response.data.data.quiz.quizMatchingPairAnswer?.items ?? [];
        onOptionChange(questionIndex, -1, 'update_items', updatedItems);
      } catch (e) {
        console.error(e);
      }
    },
    [question.activity_id, matchingData?.items, onOptionChange, questionIndex]
  );

  const handleInputFocus = (itemId: string, value: string) => {
    setEditingItemId(itemId);
    setEditingValue(value);
  };

  const handleInputBlur = async (itemId: string) => {
    if (!question.activity_id || !editingItemId) return;
    if (editingValue.trim() === '') return;
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
      // Refresh data
      const response = await activitiesApi.getActivityById(
        question.activity_id
      );
      const updatedItems =
        response.data.data.quiz.quizMatchingPairAnswer?.items ?? [];
      onOptionChange(questionIndex, -1, 'update_items', updatedItems);
    } catch (e) {
      console.error(e);
    } finally {
      setEditingItemId(null);
      setEditingValue('');
    }
  };

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
      key={`preview-${dataVersion}-${settingsUpdateTrigger}`}
    >
      <div className="flex justify-around items-start gap-4 md:gap-8">
        {/* Column A */}
        <div className="w-1/3 flex flex-col items-center gap-2 md:gap-3">
          <h3 className="font-bold text-lg text-center text-gray-700 dark:text-gray-300">
            {matchingData.leftColumnName || leftColumnName}
          </h3>
          <div className="w-full space-y-2">
            {shuffledColumnA.map((item, index) => {
              const connection = connections.find(
                (c) =>
                  c.leftItem.quizMatchingPairItemId ===
                  item.quizMatchingPairItemId
              );
              const connectionColor = connection?.quizMatchingPairConnectionId
                ? pairColorMap.get(connection.quizMatchingPairConnectionId)
                : undefined;

              const isSelected = selectedLeft === item.quizMatchingPairItemId;
              const isConnected = connections.some(
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
            {shuffledColumnB.map((item, index) => {
              const connection = connections.find(
                (c) =>
                  c.rightItem.quizMatchingPairItemId ===
                  item.quizMatchingPairItemId
              );
              const connectionColor = connection?.quizMatchingPairConnectionId
                ? pairColorMap.get(connection.quizMatchingPairConnectionId)
                : undefined;

              const isSelected = selectedRight === item.quizMatchingPairItemId;
              const isConnected = connections.some(
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
        key={`svg-${dataVersion}-${settingsUpdateTrigger}`}
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
          {connections.map((conn, index) => {
            const pathColor = conn.quizMatchingPairConnectionId
              ? pairColorMap.get(conn.quizMatchingPairConnectionId)
              : '#3b82f6';

            return (
              <g
                key={`${conn.leftItem.quizMatchingPairItemId}-${conn.rightItem.quizMatchingPairItemId}-${index}-${dataVersion}`}
              >
                {/* Path phụ để bắt sự kiện click, stroke trong suốt, strokeWidth lớn */}
                <path
                  d={getConnectionPath(
                    conn.leftItem.quizMatchingPairItemId!,
                    conn.rightItem.quizMatchingPairItemId!
                  )}
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
                {/* Path chính để hiển thị */}
                <motion.path
                  d={getConnectionPath(
                    conn.leftItem.quizMatchingPairItemId!,
                    conn.rightItem.quizMatchingPairItemId!
                  )}
                  className="stroke-2 transition-all duration-300 pointer-events-auto"
                  stroke={pathColor}
                  strokeWidth="2.5"
                  fill="none"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
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
            className="py-2 px-4 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
            onClick={handleAddPair}
          >
            + Add Pair
          </button>
        </div>
      )}
    </div>
  );
}
