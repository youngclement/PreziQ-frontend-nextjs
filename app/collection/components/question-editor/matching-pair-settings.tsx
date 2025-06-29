'use client';

import type React from 'react';
import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  useDroppable,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { QuizMatchingPairQuestion } from '../types';
import { Label } from '@/components/ui/label';
import { activitiesApi } from '@/api-client/activities-api';
import { toast } from '@/hooks/use-toast';
import type {
  MatchingPairQuizPayload,
  QuizMatchingPairAnswer,
  QuizMatchingPairItem,
  QuizMatchingPairConnection,
} from '@/api-client/activities-api';

interface MatchingPairSettingsProps {
  question: QuizMatchingPairQuestion;
  activityId: string;
  onOptionsChange: (options: any[]) => void;
  onAddPair: () => void;
  onDeletePair: (pairId: string) => void;
  onReorderPairs: (startIndex: number, endIndex: number) => void;
  leftColumnName?: string;
  rightColumnName?: string;
  onColumnNamesChange?: (left: string, right: string) => void;
  onMatchingDataUpdate?: (matchingData: QuizMatchingPairAnswer) => void;
  onRefreshActivity?: () => Promise<void>;
  settingsUpdateTrigger?: number;
}

// Global state management (tương tự location quiz)
declare global {
  interface Window {
    lastMatchingPairUpdate?: {
      timestamp: number;
      activityId: string;
      matchingData: any;
      source?: string;
    };
    matchingPairUpdateTimer?: ReturnType<typeof setTimeout>;
  }
}

// Event system cho matching pair
const createMatchingPairEventSystem = () => {
  const listeners: { [key: string]: Set<(data: any) => void> } = {};

  return {
    subscribe: (event: string, callback: (data: any) => void) => {
      if (!listeners[event]) {
        listeners[event] = new Set();
      }
      listeners[event].add(callback);
      return () => {
        listeners[event]?.delete(callback);
      };
    },

    publish: (event: string, data: any) => {
      listeners[event]?.forEach((callback) => callback(data));
    },
  };
};

const matchingPairEventSystem = createMatchingPairEventSystem();

// Shared state management
const sharedMatchingPairState: { [activityId: string]: any } = {};

// Optimized SortableItem component
function SortableItem({
  item,
  index,
  onOptionChange,
  onDelete,
  columnName,
  isUpdating = false,
  side,
  isSelected = false,
  onSelect,
  isConnected = false,
  connectionColor = '',
}: {
  item: QuizMatchingPairItem;
  index: number;
  onOptionChange: (itemId: string, value: string) => void;
  onDelete: () => void;
  columnName: string;
  isUpdating?: boolean;
  side: 'left' | 'right';
  isSelected?: boolean;
  onSelect: () => void;
  isConnected?: boolean;
  connectionColor?: string;
}) {
  const [inputValue, setInputValue] = useState(item.content || '');
  const lastSavedValueRef = useRef(item.content || '');
  const isUserTypingRef = useRef(false);
  const itemIdRef = useRef(item.quizMatchingPairItemId);

  // Update input value when item content changes, but only if:
  // 1. User is not typing
  // 2. The item ID hasn't changed (same item, different content)
  // 3. The content is actually different from current input
  useEffect(() => {
    if (
      !isUserTypingRef.current &&
      itemIdRef.current === item.quizMatchingPairItemId &&
      item.content !== inputValue
    ) {
      setInputValue(item.content || '');
      lastSavedValueRef.current = item.content || '';
    }

    // Update item ID reference
    itemIdRef.current = item.quizMatchingPairItemId;
  }, [item.content, item.quizMatchingPairItemId, inputValue]);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      isUserTypingRef.current = true;
      setInputValue(value);
    },
    []
  );

  const handleInputBlur = useCallback(() => {
    isUserTypingRef.current = false;
    if (inputValue !== lastSavedValueRef.current) {
      if (item.quizMatchingPairItemId) {
        onOptionChange(item.quizMatchingPairItemId, inputValue);
        lastSavedValueRef.current = inputValue;
      }
    }
  }, [inputValue, item.quizMatchingPairItemId, onOptionChange]);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: `${side}-${item.quizMatchingPairItemId}`,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group relative flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer',
        isDragging
          ? 'bg-white dark:bg-gray-800 shadow-lg border-primary z-50'
          : 'bg-white dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600',
        isUpdating && 'opacity-50 pointer-events-none',
        isSelected && 'ring-2 ring-primary bg-primary/5',
        connectionColor && `${connectionColor} border-2`
      )}
      onClick={onSelect}
    >
      <div
        {...attributes}
        {...listeners}
        className="flex-shrink-0 w-8 h-8 rounded-md flex items-center justify-center bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 cursor-grab hover:bg-gray-200 dark:hover:bg-gray-700 active:cursor-grabbing"
        onClick={(e) => e.stopPropagation()}
      >
        <GripVertical className="h-4 w-4" />
      </div>

      <div className="flex-1 space-y-1">
        <Label className="text-xs text-gray-500 dark:text-gray-400">
          {columnName}
        </Label>
        <Input
          id={`${side}-item-${index}`}
          placeholder={`Enter ${columnName.toLowerCase()}`}
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          className="w-full"
          disabled={isUpdating}
          onClick={(e) => e.stopPropagation()}
        />
      </div>

      <Button
        variant="ghost"
        size="icon"
        className="flex-shrink-0 w-8 h-8 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-100 dark:hover:bg-red-900/20"
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        disabled={isUpdating}
      >
        <Trash2 className="h-4 w-4 text-red-500" />
      </Button>

      {isConnected && (
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
          <span className="text-white text-xs font-bold">✓</span>
        </div>
      )}
    </div>
  );
}

export function MatchingPairSettings({
  question,
  activityId,
  onOptionsChange,
  onAddPair,
  onDeletePair,
  onReorderPairs,
  leftColumnName = 'Left Item',
  rightColumnName = 'Right Item',
  onColumnNamesChange,
  onMatchingDataUpdate,
  onRefreshActivity,
  settingsUpdateTrigger = 0,
}: MatchingPairSettingsProps) {
  // Core state management
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
  const [selectedRight, setSelectedRight] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [matchingData, setMatchingData] =
    useState<QuizMatchingPairAnswer | null>(
      question.quizMatchingPairAnswer || question.matching_data || null
    );

  // Refs for optimization
  const updateTimeoutRef = useRef<NodeJS.Timeout>();
  const isDraggingRef = useRef(false);

  // Memoized computed values
  const leftItems = useMemo(() => {
    if (!matchingData?.items) return [];
    return matchingData.items
      .filter((item) => item.isLeftColumn)
      .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
  }, [matchingData?.items]);

  const rightItems = useMemo(() => {
    if (!matchingData?.items) return [];
    return matchingData.items
      .filter((item) => !item.isLeftColumn)
      .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
  }, [matchingData?.items]);

  const connectedLeftIds = useMemo(
    () =>
      new Set(
        matchingData?.connections
          ?.filter((conn) => conn && conn.leftItem)
          .map((conn) => conn.leftItem.quizMatchingPairItemId)
      ),
    [matchingData?.connections]
  );

  const connectedRightIds = useMemo(
    () =>
      new Set(
        matchingData?.connections
          ?.filter((conn) => conn && conn.rightItem)
          .map((conn) => conn.rightItem.quizMatchingPairItemId)
      ),
    [matchingData?.connections]
  );

  const connectionColors = useMemo(
    () => [
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
    ],
    []
  );

  const itemIdToColor = useMemo(() => {
    const map: Record<string, string> = {};
    (matchingData?.connections ?? [])
      .filter(
        (conn): conn is QuizMatchingPairConnection =>
          !!conn && !!conn.leftItem && !!conn.rightItem
      )
      .forEach((conn, idx) => {
        const color = connectionColors[idx % connectionColors.length];
        if (conn.leftItem?.quizMatchingPairItemId)
          map[
            conn.leftItem.quizMatchingPairItemId
          ] = `${color.light} ${color.dark}`;
        if (conn.rightItem?.quizMatchingPairItemId)
          map[
            conn.rightItem.quizMatchingPairItemId
          ] = `${color.light} ${color.dark}`;
      });
    return map;
  }, [matchingData?.connections, connectionColors]);

  // Column names state
  const [leftColumnTitle, setLeftColumnTitle] = useState(
    question.quizMatchingPairAnswer?.leftColumnName ||
      question.matching_data?.leftColumnName ||
      leftColumnName
  );
  const [rightColumnTitle, setRightColumnTitle] = useState(
    question.quizMatchingPairAnswer?.rightColumnName ||
      question.matching_data?.rightColumnName ||
      rightColumnName
  );

  const [leftColumnError, setLeftColumnError] = useState('');
  const [rightColumnError, setRightColumnError] = useState('');

  // Update matching data when props change
  useEffect(() => {
    const newData =
      question.quizMatchingPairAnswer || question.matching_data || null;
    setMatchingData(newData);
    setSelectedLeft(null);
    setSelectedRight(null);
  }, [
    question.quizMatchingPairAnswer,
    question.matching_data,
    settingsUpdateTrigger,
  ]);

  // Update column titles when matching data changes
  useEffect(() => {
    const newLeftColumnName = matchingData?.leftColumnName || leftColumnName;
    const newRightColumnName = matchingData?.rightColumnName || rightColumnName;

    setLeftColumnTitle((prev) =>
      prev !== newLeftColumnName ? newLeftColumnName : prev
    );
    setRightColumnTitle((prev) =>
      prev !== newRightColumnName ? newRightColumnName : prev
    );
  }, [matchingData, leftColumnName, rightColumnName]);

  // Optimized column name update handler
  const debouncedUpdateColumnNames = useCallback(
    (left: string, right: string) => {
      let hasError = false;
      if (!left.trim()) {
        setLeftColumnError('Vui lòng nhập tên cột bên trái');
        hasError = true;
      } else {
        setLeftColumnError('');
      }
      if (!right.trim()) {
        setRightColumnError('Vui lòng nhập tên cột bên phải');
        hasError = true;
      } else {
        setRightColumnError('');
      }
      if (hasError) return;

      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
      updateTimeoutRef.current = setTimeout(async () => {
        setIsUpdating(true);
        try {
          const fullMatchingData = (matchingData || {
            items: [],
            connections: [],
          }) as QuizMatchingPairAnswer;

          const payload: MatchingPairQuizPayload = {
            type: 'MATCHING_PAIRS',
            questionText: question.question_text || '',
            timeLimitSeconds: question.time_limit_seconds || 30,
            pointType:
              (question.pointType as
                | 'STANDARD'
                | 'NO_POINTS'
                | 'DOUBLE_POINTS') || 'STANDARD',
            leftColumnName: left,
            rightColumnName: right,
            quizMatchingPairAnswer: {
              ...fullMatchingData,
              leftColumnName: left,
              rightColumnName: right,
            },
          };

          if (!activityId) {
            toast({
              title: 'Error',
              description:
                'Activity ID is missing. Please save the question first.',
              variant: 'destructive',
            });
            return;
          }

          await activitiesApi.updateMatchingPairQuiz(activityId, payload);

          if (onColumnNamesChange) {
            onColumnNamesChange(left, right);
          }

          if (onRefreshActivity) {
            await onRefreshActivity();
          }

          toast({
            title: 'Success',
            description: 'Column names updated successfully.',
          });
        } catch (error) {
          console.error('Failed to update column names', error);
          toast({
            title: 'Error',
            description: 'Could not update column names.',
            variant: 'destructive',
          });
        } finally {
          setIsUpdating(false);
        }
      }, 500);
    },
    [activityId, onColumnNamesChange, onRefreshActivity, question, matchingData]
  );

  const handleColumnNameChange = useCallback(
    (side: 'left' | 'right', value: string) => {
      if (side === 'left') {
        setLeftColumnTitle(value);
        if (value.trim()) setLeftColumnError('');
        debouncedUpdateColumnNames(value, rightColumnTitle);
      } else {
        setRightColumnTitle(value);
        if (value.trim()) setRightColumnError('');
        debouncedUpdateColumnNames(leftColumnTitle, value);
      }
    },
    [debouncedUpdateColumnNames, leftColumnTitle, rightColumnTitle]
  );

  // Optimized connection management
  const handleConnectionOperation = useCallback(
    async (
      operation: 'add' | 'delete',
      leftItem: QuizMatchingPairItem,
      rightItem: QuizMatchingPairItem,
      connectionId?: string
    ) => {
      if (isConnecting || isUpdating) return;

      setIsConnecting(true);

      try {
        if (operation === 'delete' && connectionId) {
          await activitiesApi.deleteMatchingPairConnection(
            activityId,
            connectionId
          );
        } else if (operation === 'add') {
          await activitiesApi.addMatchingPairConnection(activityId, {
            leftItemId: leftItem.quizMatchingPairItemId!,
            rightItemId: rightItem.quizMatchingPairItemId!,
          });
        }

        // Single API call to get fresh data
        const response = await activitiesApi.getActivityById(activityId);
        const updatedMatchingData =
          response.data.data.quiz.quizMatchingPairAnswer;

        if (updatedMatchingData) {
          setMatchingData(updatedMatchingData);

          if (onMatchingDataUpdate) {
            onMatchingDataUpdate(updatedMatchingData);
          }
        }

        if (operation === 'add') {
          toast({
            title: 'Success',
            description: 'Items connected successfully',
          });
        }
      } catch (error) {
        console.error(`Failed to ${operation} connection:`, error);
        toast({
          title: 'Error',
          description: `Failed to ${operation} connection.`,
          variant: 'destructive',
        });
      } finally {
        setIsConnecting(false);
      }
    },
    [isConnecting, isUpdating, activityId, onMatchingDataUpdate]
  );

  // Optimized item operations with optimistic updates (no loading)
  const handleOptionChange = useCallback(
    async (itemId: string, value: string) => {
      if (!matchingData?.items) return;

      // Optimistic update - update UI immediately
      const updatedItems = matchingData.items.map((item) =>
        item.quizMatchingPairItemId === itemId
          ? { ...item, content: value }
          : item
      );

      const updatedData: QuizMatchingPairAnswer = {
        ...matchingData,
        items: updatedItems,
      };

      setMatchingData(updatedData);

      if (onMatchingDataUpdate) {
        onMatchingDataUpdate(updatedData);
      }

      // Update server in background without showing loading state
      try {
        const item = matchingData.items.find(
          (item) => item.quizMatchingPairItemId === itemId
        );
        if (item?.quizMatchingPairItemId) {
          await activitiesApi.updateReorderQuizItem(
            activityId,
            item.quizMatchingPairItemId,
            {
              content: value,
              isLeftColumn: item.isLeftColumn,
              displayOrder: item.displayOrder || 0,
            }
          );
        }
      } catch (error) {
        console.error('Failed to update item content:', error);

        // Revert optimistic update on error
        setMatchingData(matchingData);
        if (onMatchingDataUpdate) {
          onMatchingDataUpdate(matchingData);
        }

        toast({
          title: 'Error',
          description: 'Failed to save changes',
          variant: 'destructive',
        });
      }
    },
    [matchingData, activityId, onMatchingDataUpdate]
  );

  const handleAddPair = useCallback(async () => {
    if (isUpdating || isConnecting) return;

    setIsUpdating(true);
    try {
      const response = await activitiesApi.addMatchingPair(activityId);

      if (response?.data?.data) {
        const updatedMatchingData = response.data.data;
        setMatchingData(updatedMatchingData);

        if (onMatchingDataUpdate) {
          onMatchingDataUpdate(updatedMatchingData);
        }

        toast({
          title: 'Success',
          description: 'New pair added successfully',
        });
      }

      if (onRefreshActivity) {
        await onRefreshActivity();
      }
    } catch (error) {
      console.error('Failed to add pair:', error);
      toast({
        title: 'Error',
        description: 'Failed to add new pair',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  }, [
    isUpdating,
    isConnecting,
    activityId,
    onMatchingDataUpdate,
    onRefreshActivity,
  ]);

  const handleDeleteItem = useCallback(
    async (itemId: string, side: 'left' | 'right') => {
      if (isUpdating || isConnecting) return;

      setIsUpdating(true);
      try {
        await activitiesApi.deleteMatchingPairItem(activityId, itemId);

        // Update local state
        const updatedData: QuizMatchingPairAnswer = {
          ...matchingData!,
          items: matchingData!.items.filter(
            (item) => item.quizMatchingPairItemId !== itemId
          ),
          connections: (matchingData?.connections ?? []).filter(
            (conn) =>
              conn.leftItem.quizMatchingPairItemId !== itemId &&
              conn.rightItem.quizMatchingPairItemId !== itemId
          ),
        };

        setMatchingData(updatedData);

        if (onMatchingDataUpdate) {
          onMatchingDataUpdate(updatedData);
        }

        toast({
          title: 'Success',
          description: 'Item deleted successfully',
        });

        if (onRefreshActivity) {
          await onRefreshActivity();
        }
      } catch (error) {
        console.error('Failed to delete item:', error);
        toast({
          title: 'Error',
          description: 'Failed to delete item',
          variant: 'destructive',
        });
      } finally {
        setIsUpdating(false);
      }
    },
    [
      isUpdating,
      isConnecting,
      activityId,
      matchingData,
      onMatchingDataUpdate,
      onRefreshActivity,
    ]
  );

  // Optimized selection handlers
  const handleSelectItem = useCallback(
    (side: 'left' | 'right', itemId: string) => {
      if (isConnecting || isUpdating) return;

      if (side === 'left') {
        setSelectedLeft((prev) => {
          const newValue = prev === itemId ? null : itemId;
          if (newValue === null) {
            setSelectedRight(null);
          }
          return newValue;
        });
      } else {
        setSelectedRight((prev) => {
          const newValue = prev === itemId ? null : itemId;
          if (newValue === null) {
            setSelectedLeft(null);
          }
          return newValue;
        });
      }
    },
    [isConnecting, isUpdating]
  );

  // Handle connection/disconnection when both items are selected
  useEffect(() => {
    const handleConnection = async () => {
      if (!selectedLeft || !selectedRight || isConnecting || isUpdating) return;

      const leftItem = leftItems.find(
        (i) => i.quizMatchingPairItemId === selectedLeft
      );
      const rightItem = rightItems.find(
        (i) => i.quizMatchingPairItemId === selectedRight
      );

      if (!leftItem || !rightItem) {
        setSelectedLeft(null);
        setSelectedRight(null);
        return;
      }

      const existingConnection = matchingData?.connections?.find(
        (conn) =>
          conn.leftItem.quizMatchingPairItemId === selectedLeft &&
          conn.rightItem.quizMatchingPairItemId === selectedRight
      );

      setSelectedLeft(null);
      setSelectedRight(null);

      if (existingConnection) {
        await handleConnectionOperation(
          'delete',
          leftItem,
          rightItem,
          existingConnection.quizMatchingPairConnectionId
        );
      } else {
        const leftAlreadyConnected = matchingData?.connections?.find(
          (conn) => conn.leftItem.quizMatchingPairItemId === selectedLeft
        );
        const rightAlreadyConnected = matchingData?.connections?.find(
          (conn) => conn.rightItem.quizMatchingPairItemId === selectedRight
        );

        if (leftAlreadyConnected || rightAlreadyConnected) {
          toast({
            title: 'Warning',
            description:
              'One or both items are already connected. Disconnect them first.',
            variant: 'destructive',
          });
          return;
        }

        await handleConnectionOperation('add', leftItem, rightItem);
      }
    };

    handleConnection();
  }, [
    selectedLeft,
    selectedRight,
    leftItems,
    rightItems,
    matchingData?.connections,
    isConnecting,
    isUpdating,
    handleConnectionOperation,
  ]);

  // Optimized drag handlers
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

  const handleDragStart = useCallback(() => {
    isDraggingRef.current = true;
  }, []);

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      isDraggingRef.current = false;
      const { active, over } = event;

      if (active.id === over?.id || isUpdating) return;

      setIsUpdating(true);

      try {
        const activeIsLeft = active.id.toString().startsWith('left-');
        const overIsLeft = over?.id.toString().startsWith('left-');

        const fromItems = activeIsLeft ? leftItems : rightItems;
        const fromIndex = fromItems.findIndex(
          (item) =>
            `${activeIsLeft ? 'left' : 'right'}-${
              item.quizMatchingPairItemId
            }` === active.id
        );
        const movedItem = fromItems[fromIndex];

        if (fromIndex === -1 || !movedItem) {
          throw new Error('Moved item not found');
        }

        if (over && activeIsLeft === overIsLeft) {
          // Same column reordering
          const items = activeIsLeft ? leftItems : rightItems;
          const newIndex = items.findIndex(
            (item) =>
              `${activeIsLeft ? 'left' : 'right'}-${
                item.quizMatchingPairItemId
              }` === over.id
          );

          if (newIndex !== -1) {
            const reordered = arrayMove(items, fromIndex, newIndex);
            const updatedItems = reordered.map((item, index) => ({
              ...item,
              displayOrder: index + 1,
            }));
            const otherItems = activeIsLeft ? rightItems : leftItems;

            const updatedData: QuizMatchingPairAnswer = {
              ...matchingData!,
              items: [...otherItems, ...updatedItems],
            };

            setMatchingData(updatedData);

            await activitiesApi.updateReorderQuizItem(
              activityId,
              movedItem.quizMatchingPairItemId!,
              {
                ...movedItem,
                displayOrder: newIndex + 1,
              }
            );

            if (onMatchingDataUpdate) {
              onMatchingDataUpdate(updatedData);
            }
          }
        } else {
          // Cross-column movement
          const toItems = activeIsLeft ? rightItems : leftItems;
          let toIndex = over
            ? toItems.findIndex(
                (item) =>
                  `${!activeIsLeft ? 'left' : 'right'}-${
                    item.quizMatchingPairItemId
                  }` === over.id
              )
            : 0;
          if (toIndex === -1) toIndex = 0;

          const newFromItems = fromItems.filter(
            (i) => i.quizMatchingPairItemId !== movedItem.quizMatchingPairItemId
          );
          const newToItems = [...toItems];
          newToItems.splice(toIndex, 0, {
            ...movedItem,
            isLeftColumn: !activeIsLeft,
            displayOrder: toIndex + 1,
          });

          const updatedFrom = newFromItems.map((item, index) => ({
            ...item,
            displayOrder: index + 1,
          }));
          const updatedTo = newToItems.map((item, index) => ({
            ...item,
            displayOrder: index + 1,
          }));

          const allItems = activeIsLeft
            ? [...updatedFrom, ...updatedTo]
            : [...updatedTo, ...updatedFrom];

          const newConnections = (matchingData?.connections || []).filter(
            (conn) =>
              conn.leftItem.quizMatchingPairItemId !==
                movedItem.quizMatchingPairItemId &&
              conn.rightItem.quizMatchingPairItemId !==
                movedItem.quizMatchingPairItemId
          );

          const updatedData: QuizMatchingPairAnswer = {
            ...matchingData!,
            items: allItems,
            connections: newConnections,
          };

          setMatchingData(updatedData);

          await activitiesApi.updateReorderQuizItem(
            activityId,
            movedItem.quizMatchingPairItemId!,
            {
              ...movedItem,
              isLeftColumn: !activeIsLeft,
              displayOrder: toIndex + 1,
            }
          );

          if (onMatchingDataUpdate) {
            onMatchingDataUpdate(updatedData);
          }
        }

        if (onRefreshActivity) {
          await onRefreshActivity();
        }
      } catch (error) {
        console.error('Failed to update item position', error);
        toast({
          title: 'Error',
          description: 'Failed to move item.',
          variant: 'destructive',
        });
      } finally {
        setIsUpdating(false);
      }
    },
    [
      isUpdating,
      leftItems,
      rightItems,
      matchingData,
      activityId,
      onMatchingDataUpdate,
      onRefreshActivity,
    ]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, []);

  // DroppableColumn component
  function DroppableColumn({
    id,
    children,
  }: {
    id: string;
    children: React.ReactNode;
  }) {
    const { setNodeRef } = useDroppable({ id });
    return (
      <div ref={setNodeRef} className="min-h-[40px] flex flex-col space-y-2">
        {children}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label>Left Column Title</Label>
          <Input
            value={leftColumnTitle}
            onChange={(e) => handleColumnNameChange('left', e.target.value)}
            placeholder="e.g. Countries"
            disabled={isUpdating}
            className={leftColumnError ? 'border-red-500' : ''}
          />
          {leftColumnError && (
            <div className="text-xs text-red-500 mt-1">{leftColumnError}</div>
          )}
        </div>
        <div className="space-y-1">
          <Label>Right Column Title</Label>
          <Input
            value={rightColumnTitle}
            onChange={(e) => handleColumnNameChange('right', e.target.value)}
            placeholder="e.g. Capitals"
            disabled={isUpdating}
            className={rightColumnError ? 'border-red-500' : ''}
          />
          {rightColumnError && (
            <div className="text-xs text-red-500 mt-1">{rightColumnError}</div>
          )}
        </div>
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
        <p className="text-sm text-blue-700 dark:text-blue-300">
          <strong>Instructions:</strong> Click on items from left and right
          columns to connect them. Click on connected items to disconnect them.
          Drag items to reorder or move between columns.
        </p>
      </div>

      {isUpdating ? (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-2">Loading...</span>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="grid grid-cols-2 gap-6">
            <SortableContext
              items={leftItems.map(
                (item) => `left-${item.quizMatchingPairItemId}`
              )}
              strategy={verticalListSortingStrategy}
            >
              <DroppableColumn id="left-column">
                <h3 className="font-medium text-sm text-gray-700 dark:text-gray-300">
                  {leftColumnTitle}
                </h3>
                {leftItems.length === 0 && (
                  <div className="text-gray-400 text-center py-4 border border-dashed rounded-lg">
                    No items yet. Add a pair to get started.
                  </div>
                )}
                {leftItems.map((item, index) => (
                  <SortableItem
                    key={`left-${item.quizMatchingPairItemId}`}
                    item={item}
                    index={index}
                    onOptionChange={handleOptionChange}
                    onDelete={() =>
                      handleDeleteItem(
                        item.quizMatchingPairItemId || '',
                        'left'
                      )
                    }
                    columnName={leftColumnTitle}
                    isUpdating={isUpdating || isConnecting}
                    side="left"
                    isSelected={selectedLeft === item.quizMatchingPairItemId}
                    onSelect={() =>
                      handleSelectItem(
                        'left',
                        item.quizMatchingPairItemId || ''
                      )
                    }
                    isConnected={connectedLeftIds.has(
                      item.quizMatchingPairItemId
                    )}
                    connectionColor={
                      itemIdToColor[item.quizMatchingPairItemId || '']
                    }
                  />
                ))}
              </DroppableColumn>
            </SortableContext>

            <SortableContext
              items={rightItems.map(
                (item) => `right-${item.quizMatchingPairItemId}`
              )}
              strategy={verticalListSortingStrategy}
            >
              <DroppableColumn id="right-column">
                <h3 className="font-medium text-sm text-gray-700 dark:text-gray-300">
                  {rightColumnTitle}
                </h3>
                {rightItems.length === 0 && (
                  <div className="text-gray-400 text-center py-4 border border-dashed rounded-lg">
                    No items yet. Add a pair to get started.
                  </div>
                )}
                {rightItems.map((item, index) => (
                  <SortableItem
                    key={`right-${item.quizMatchingPairItemId}`}
                    item={item}
                    index={index}
                    onOptionChange={handleOptionChange}
                    onDelete={() =>
                      handleDeleteItem(
                        item.quizMatchingPairItemId || '',
                        'right'
                      )
                    }
                    columnName={rightColumnTitle}
                    isUpdating={isUpdating || isConnecting}
                    side="right"
                    isSelected={selectedRight === item.quizMatchingPairItemId}
                    onSelect={() =>
                      handleSelectItem(
                        'right',
                        item.quizMatchingPairItemId || ''
                      )
                    }
                    isConnected={connectedRightIds.has(
                      item.quizMatchingPairItemId
                    )}
                    connectionColor={
                      itemIdToColor[item.quizMatchingPairItemId || '']
                    }
                  />
                ))}
              </DroppableColumn>
            </SortableContext>
          </div>
        </DndContext>
      )}

      <div className="mt-4">
        <Button
          onClick={handleAddPair}
          variant="outline"
          className="w-full"
          disabled={isUpdating || isConnecting}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Pair
        </Button>
      </div>

      {(selectedLeft || selectedRight) && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg">
          <p className="text-sm text-yellow-700 dark:text-yellow-300">
            {selectedLeft && selectedRight
              ? 'Both items selected. They will be connected/disconnected.'
              : selectedLeft
              ? 'Left item selected. Select a right item to connect.'
              : 'Right item selected. Select a left item to connect.'}
          </p>
        </div>
      )}
    </div>
  );
}
