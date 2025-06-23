'use client';

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
  onOptionsChange?: (options: any[]) => void;
  onAddPair?: () => void;
  onDeletePair?: (pairId: string) => void;
  onReorderPairs?: (startIndex: number, endIndex: number) => void;
  leftColumnName?: string;
  rightColumnName?: string;
  onColumnNamesChange?: (left: string, right: string) => void;
  onMatchingDataUpdate?: (matchingData: QuizMatchingPairAnswer) => void;
  onRefreshActivity?: () => Promise<void>;
  settingsUpdateTrigger?: number;
}

interface SortableItemProps {
  item: QuizMatchingPairItem;
  index: number;
  onOptionChange: (itemId: string, value: string) => Promise<void>;
  onDelete: (itemId: string) => Promise<void>;
  columnName: string;
  isUpdating: boolean;
  side: 'left' | 'right';
  isSelected: boolean;
  onSelect: (itemId: string) => void;
  isConnected: boolean;
  connectionColor?: string;
}

function SortableItem({
  item,
  index,
  onOptionChange,
  onDelete,
  columnName,
  isUpdating,
  side,
  isSelected,
  onSelect,
  isConnected,
  connectionColor,
}: SortableItemProps) {
  const [inputValue, setInputValue] = useState(item.content || '');
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isUserTypingRef = useRef(false);

  useEffect(() => {
    if (!isUserTypingRef.current && item.content !== inputValue) {
      setInputValue(item.content || '');
    }
  }, [item.content]);

  const debouncedUpdate = useCallback(
    async (value: string) => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
      updateTimeoutRef.current = setTimeout(async () => {
        if (item.quizMatchingPairItemId) {
          await onOptionChange(item.quizMatchingPairItemId, value);
        }
      }, 500);
    },
    [item.quizMatchingPairItemId, onOptionChange]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    isUserTypingRef.current = true;
    setInputValue(value);
    debouncedUpdate(value);
  };

  const handleInputBlur = () => {
    setTimeout(() => {
      isUserTypingRef.current = false;
    }, 100);
  };

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: `${side}-${item.quizMatchingPairItemId}`,
    disabled: isUpdating,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  useEffect(() => {
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, []);

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
      onClick={() => onSelect(item.quizMatchingPairItemId || '')}
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
          onDelete(item.quizMatchingPairItemId || '');
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
  leftColumnName = 'Left Item',
  rightColumnName = 'Right Item',
  onColumnNamesChange,
  onMatchingDataUpdate,
  onRefreshActivity,
  settingsUpdateTrigger = 0,
}: MatchingPairSettingsProps) {
  const [matchingData, setMatchingData] =
    useState<QuizMatchingPairAnswer | null>(
      question.quizMatchingPairAnswer || question.matching_data || null
    );
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
  const [selectedRight, setSelectedRight] = useState<string | null>(null);
  const [leftColumnTitle, setLeftColumnTitle] = useState(
    matchingData?.leftColumnName || leftColumnName
  );
  const [rightColumnTitle, setRightColumnTitle] = useState(
    matchingData?.rightColumnName || rightColumnName
  );
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const refreshKeyRef = useRef(0);
  const isDraggingRef = useRef(false);

  // Synchronize matchingData with props
  useEffect(() => {
    const newData =
      question.quizMatchingPairAnswer || question.matching_data || null;
    if (newData) {
      setMatchingData(newData);
      setLeftColumnTitle(newData.leftColumnName || leftColumnName);
      setRightColumnTitle(newData.rightColumnName || rightColumnName);
      setSelectedLeft(null);
      setSelectedRight(null);
    }
  }, [
    question.quizMatchingPairAnswer,
    question.matching_data,
    leftColumnName,
    rightColumnName,
  ]);

  // Handle settingsUpdateTrigger
  useEffect(() => {
    if (onRefreshActivity && settingsUpdateTrigger > 0) {
      setIsUpdating(true);
      onRefreshActivity()
        .then(() => {
          refreshKeyRef.current += 1;
        })
        .catch((error) => {
          console.error('Refresh failed:', error);
          toast({
            title: 'Error',
            description: 'Failed to refresh activity',
            variant: 'destructive',
          });
        })
        .finally(() => setIsUpdating(false));
    }
  }, [settingsUpdateTrigger, onRefreshActivity]);

  // Debounced column name update
  const updateColumnNames = useCallback(
    async (left: string, right: string) => {
      if (!activityId) {
        toast({
          title: 'Error',
          description: 'Activity ID is missing',
          variant: 'destructive',
        });
        return;
      }
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
      updateTimeoutRef.current = setTimeout(async () => {
        setIsUpdating(true);
        try {
          const payload: MatchingPairQuizPayload = {
            type: 'MATCHING_PAIRS',
            questionText: question.question_text || '',
            timeLimitSeconds: question.time_limit_seconds,
            pointType: question.pointType as
              | 'STANDARD'
              | 'NO_POINTS'
              | 'DOUBLE_POINTS',
            leftColumnName: left,
            rightColumnName: right,
            quizMatchingPairAnswer: {
              quizMatchingPairAnswerId: '',
              items: [],
              connections: [],
              ...matchingData,
              leftColumnName: left,
              rightColumnName: right,
            },
          };
          await activitiesApi.updateMatchingPairQuiz(activityId, payload);
          if (onColumnNamesChange) {
            onColumnNamesChange(left, right);
          }
          if (onRefreshActivity) {
            await onRefreshActivity();
          }
          toast({
            title: 'Success',
            description: 'Column names updated successfully',
          });
        } catch (error) {
          console.error('Failed to update column names:', error);
          toast({
            title: 'Error',
            description: 'Could not update column names',
            variant: 'destructive',
          });
        } finally {
          setIsUpdating(false);
        }
      }, 500);
    },
    [activityId, question, matchingData, onColumnNamesChange, onRefreshActivity]
  );

  const handleColumnNameChange = useCallback(
    (side: 'left' | 'right', value: string) => {
      if (side === 'left') {
        setLeftColumnTitle(value);
        updateColumnNames(value, rightColumnTitle);
      } else {
        setRightColumnTitle(value);
        updateColumnNames(leftColumnTitle, value);
      }
    },
    [leftColumnTitle, rightColumnTitle, updateColumnNames]
  );

  // Memoized items
  const leftItems = useMemo(
    () =>
      (matchingData?.items || [])
        .filter((item) => item.isLeftColumn)
        .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0)),
    [matchingData?.items]
  );

  const rightItems = useMemo(
    () =>
      (matchingData?.items || [])
        .filter((item) => !item.isLeftColumn)
        .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0)),
    [matchingData?.items]
  );

  const connectedItemIds = useMemo(
    () => ({
      left: new Set(
        (matchingData?.connections || [])
          .filter((conn) => conn?.leftItem)
          .map((conn) => conn.leftItem.quizMatchingPairItemId)
      ),
      right: new Set(
        (matchingData?.connections || [])
          .filter((conn) => conn?.rightItem)
          .map((conn) => conn.rightItem.quizMatchingPairItemId)
      ),
    }),
    [matchingData?.connections]
  );

  const connectionColors = [
    'bg-red-100 border-red-400 text-red-700',
    'bg-blue-100 border-blue-400 text-blue-700',
    'bg-yellow-100 border-yellow-400 text-yellow-700',
    'bg-green-100 border-green-400 text-green-700',
    'bg-purple-100 border-purple-400 text-purple-700',
    'bg-pink-100 border-pink-400 text-pink-700',
  ];

  const itemIdToColor = useMemo(() => {
    const map: Record<string, string> = {};
    (matchingData?.connections || []).forEach((conn, idx) => {
      const color = connectionColors[idx % connectionColors.length];
      if (conn.leftItem?.quizMatchingPairItemId) {
        map[conn.leftItem.quizMatchingPairItemId] = color;
      }
      if (conn.rightItem?.quizMatchingPairItemId) {
        map[conn.rightItem.quizMatchingPairItemId] = color;
      }
    });
    return map;
  }, [matchingData?.connections]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleOptionChange = useCallback(
    async (itemId: string, value: string) => {
      if (!matchingData || isUpdating) return;
      const originalMatchingData = matchingData;

      setMatchingData((prev) => {
        if (!prev) return prev;

        const updatedItems = prev.items.map((item) =>
          item.quizMatchingPairItemId === itemId
            ? { ...item, content: value }
            : item
        );

        // **FIX: Keep connections consistent with updated items**
        const updatedConnections = prev.connections
          .map((conn) => {
            const newLeftItem = updatedItems.find(
              (i) =>
                i.quizMatchingPairItemId ===
                conn.leftItem.quizMatchingPairItemId
            );
            const newRightItem = updatedItems.find(
              (i) =>
                i.quizMatchingPairItemId ===
                conn.rightItem.quizMatchingPairItemId
            );
            if (newLeftItem && newRightItem) {
              return {
                ...conn,
                leftItem: newLeftItem,
                rightItem: newRightItem,
              };
            }
            return null;
          })
          .filter((c): c is QuizMatchingPairConnection => c !== null);

        return {
          ...prev,
          items: updatedItems,
          connections: updatedConnections,
        };
      });

      try {
        const item = originalMatchingData.items.find(
          (i) => i.quizMatchingPairItemId === itemId
        );
        if (!item) throw new Error('Item not found');
        await activitiesApi.updateReorderQuizItem(activityId, itemId, {
          quizMatchingPairItemId: itemId,
          content: value,
          isLeftColumn: item.isLeftColumn,
          displayOrder: item.displayOrder || 0,
        });
      } catch (error) {
        console.error('Failed to update item:', error);
        setMatchingData(originalMatchingData);
        toast({
          title: 'Error',
          description: 'Failed to update item',
          variant: 'destructive',
        });
      }
    },
    [activityId, matchingData, isUpdating]
  );

  const handleAddPair = useCallback(async () => {
    if (isUpdating) return;
    setIsUpdating(true);
    try {
      const response = await activitiesApi.addMatchingPair(activityId);
      if (response?.data?.quizMatchingPairAnswer) {
        setMatchingData(response.data.quizMatchingPairAnswer);
        if (onMatchingDataUpdate) {
          onMatchingDataUpdate(response.data.quizMatchingPairAnswer);
        }
      }
      toast({ title: 'Success', description: 'New pair added successfully' });
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
  }, [activityId, onMatchingDataUpdate, isUpdating]);

  const handleDeleteItem = useCallback(
    async (itemId: string) => {
      if (isUpdating) return;
      const originalMatchingData = matchingData;

      setMatchingData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          items: prev.items.filter(
            (item) => item.quizMatchingPairItemId !== itemId
          ),
          connections: prev.connections.filter(
            (conn) =>
              conn.leftItem.quizMatchingPairItemId !== itemId &&
              conn.rightItem.quizMatchingPairItemId !== itemId
          ),
        };
      });
      setSelectedLeft((prev) => (prev === itemId ? null : prev));
      setSelectedRight((prev) => (prev === itemId ? null : prev));

      setIsUpdating(true);
      try {
        await activitiesApi.deleteMatchingPairItem(activityId, itemId);
        toast({ title: 'Success', description: 'Item deleted successfully' });
      } catch (error) {
        console.error('Failed to delete item:', error);
        setMatchingData(originalMatchingData);
        toast({
          title: 'Error',
          description: 'Failed to delete item',
          variant: 'destructive',
        });
      } finally {
        setIsUpdating(false);
      }
    },
    [activityId, matchingData, isUpdating]
  );

  const handleConnect = useCallback(
    async (leftItem: QuizMatchingPairItem, rightItem: QuizMatchingPairItem) => {
      if (
        !leftItem.quizMatchingPairItemId ||
        !rightItem.quizMatchingPairItemId ||
        isUpdating
      ) {
        toast({
          title: 'Error',
          description: 'Invalid items selected',
          variant: 'destructive',
        });
        return;
      }

      setIsUpdating(true);
      const tempId = `temp-${Date.now()}`;
      const optimisticConnection: QuizMatchingPairConnection = {
        quizMatchingPairConnectionId: tempId,
        leftItem,
        rightItem,
      };

      setMatchingData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          connections: [...prev.connections, optimisticConnection],
        };
      });

      try {
        const response = await activitiesApi.addMatchingPairConnection(
          activityId,
          {
            leftItemId: leftItem.quizMatchingPairItemId,
            rightItemId: rightItem.quizMatchingPairItemId,
          }
        );
        if (response?.data?.quizMatchingPairAnswer) {
          setMatchingData(response.data.quizMatchingPairAnswer);
          if (onMatchingDataUpdate) {
            onMatchingDataUpdate(response.data.quizMatchingPairAnswer);
          }
        } else if (response?.data?.connection) {
          setMatchingData((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              connections: prev.connections.map((c) =>
                c.quizMatchingPairConnectionId === tempId
                  ? response.data.connection
                  : c
              ),
            };
          });
        }
        toast({
          title: 'Success',
          description: 'Connection created successfully',
        });
      } catch (error) {
        console.error('Failed to create connection:', error);
        setMatchingData((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            connections: prev.connections.filter(
              (c) => c.quizMatchingPairConnectionId !== tempId
            ),
          };
        });
        toast({
          title: 'Error',
          description: 'Failed to create connection',
          variant: 'destructive',
        });
      } finally {
        setIsUpdating(false);
      }
    },
    [activityId, onMatchingDataUpdate, isUpdating]
  );

  const handleDisconnect = useCallback(
    async (connection: QuizMatchingPairConnection) => {
      if (!connection.quizMatchingPairConnectionId || isUpdating) {
        toast({
          title: 'Error',
          description: 'Invalid connection',
          variant: 'destructive',
        });
        return;
      }

      setIsUpdating(true);
      const originalConnections = matchingData?.connections || [];

      setMatchingData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          connections: prev.connections.filter(
            (c) =>
              c.quizMatchingPairConnectionId !==
              connection.quizMatchingPairConnectionId
          ),
        };
      });

      try {
        await activitiesApi.deleteMatchingPairConnection(
          activityId,
          connection.quizMatchingPairConnectionId
        );
        toast({
          title: 'Success',
          description: 'Connection removed successfully',
        });
      } catch (error) {
        console.error('Failed to remove connection:', error);
        setMatchingData((prev) => {
          if (!prev) return prev;
          return { ...prev, connections: originalConnections };
        });
        toast({
          title: 'Error',
          description: 'Failed to remove connection',
          variant: 'destructive',
        });
      } finally {
        setIsUpdating(false);
      }
    },
    [activityId, matchingData, isUpdating]
  );

  const handleSelectItem = useCallback(
    (side: 'left' | 'right', itemId: string) => {
      if (isUpdating) return;

      if (side === 'left') {
        setSelectedLeft((prev) => (prev === itemId ? null : itemId));
        if (selectedRight && selectedLeft !== itemId) {
          const leftItem = leftItems.find(
            (i) => i.quizMatchingPairItemId === itemId
          );
          const rightItem = rightItems.find(
            (i) => i.quizMatchingPairItemId === selectedRight
          );
          if (leftItem && rightItem) {
            const existingConnection = matchingData?.connections.find(
              (conn) =>
                conn.leftItem.quizMatchingPairItemId === itemId &&
                conn.rightItem.quizMatchingPairItemId === selectedRight
            );
            if (existingConnection) {
              handleDisconnect(existingConnection);
            } else if (
              !connectedItemIds.left.has(itemId) &&
              !connectedItemIds.right.has(selectedRight)
            ) {
              handleConnect(leftItem, rightItem);
            } else {
              toast({
                title: 'Warning',
                description: 'One or both items are already connected',
                variant: 'destructive',
              });
            }
            setSelectedLeft(null);
            setSelectedRight(null);
          }
        }
      } else {
        setSelectedRight((prev) => (prev === itemId ? null : itemId));
        if (selectedLeft && selectedRight !== itemId) {
          const leftItem = leftItems.find(
            (i) => i.quizMatchingPairItemId === selectedLeft
          );
          const rightItem = rightItems.find(
            (i) => i.quizMatchingPairItemId === itemId
          );
          if (leftItem && rightItem) {
            const existingConnection = matchingData?.connections.find(
              (conn) =>
                conn.leftItem.quizMatchingPairItemId === selectedLeft &&
                conn.rightItem.quizMatchingPairItemId === itemId
            );
            if (existingConnection) {
              handleDisconnect(existingConnection);
            } else if (
              !connectedItemIds.left.has(selectedLeft) &&
              !connectedItemIds.right.has(itemId)
            ) {
              handleConnect(leftItem, rightItem);
            } else {
              toast({
                title: 'Warning',
                description: 'One or both items are already connected',
                variant: 'destructive',
              });
            }
            setSelectedLeft(null);
            setSelectedRight(null);
          }
        }
      }
    },
    [
      isUpdating,
      selectedLeft,
      selectedRight,
      leftItems,
      rightItems,
      matchingData,
      connectedItemIds,
      handleConnect,
      handleDisconnect,
    ]
  );

  const handleDragStart = () => {
    isDraggingRef.current = true;
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    isDraggingRef.current = false;
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeIsLeft = active.id.toString().startsWith('left-');
    const overIsLeft = over.id.toString().startsWith('left-');

    if (activeIsLeft === overIsLeft) {
      // Reorder trong cùng cột
      const items = activeIsLeft ? leftItems : rightItems;
      const oldIndex = items.findIndex(
        (item) =>
          `${activeIsLeft ? 'left' : 'right'}-${
            item.quizMatchingPairItemId
          }` === active.id
      );
      const newIndex = items.findIndex(
        (item) =>
          `${activeIsLeft ? 'left' : 'right'}-${
            item.quizMatchingPairItemId
          }` === over.id
      );
      if (oldIndex !== -1 && newIndex !== -1) {
        const item = items[oldIndex];
        setIsUpdating(true);
        try {
          await activitiesApi.updateReorderQuizItem(
            activityId,
            item.quizMatchingPairItemId!,
            {
              ...item,
              displayOrder: newIndex + 1,
            }
          );
          if (onRefreshActivity) await onRefreshActivity();
          toast({
            title: 'Success',
            description: 'Item reordered successfully',
          });
        } catch (error) {
          toast({
            title: 'Error',
            description: 'Failed to reorder item',
            variant: 'destructive',
          });
        } finally {
          setIsUpdating(false);
        }
      }
    } else {
      // Move sang cột khác
      const fromItems = activeIsLeft ? leftItems : rightItems;
      const toItems = activeIsLeft ? rightItems : leftItems;
      const fromIndex = fromItems.findIndex(
        (item) =>
          `${activeIsLeft ? 'left' : 'right'}-${
            item.quizMatchingPairItemId
          }` === active.id
      );
      const toIndex = toItems.findIndex(
        (item) =>
          `${!activeIsLeft ? 'left' : 'right'}-${
            item.quizMatchingPairItemId
          }` === over.id
      );
      if (fromIndex !== -1) {
        const item = fromItems[fromIndex];
        setIsUpdating(true);
        try {
          await activitiesApi.updateReorderQuizItem(
            activityId,
            item.quizMatchingPairItemId!,
            {
              ...item,
              isLeftColumn: !activeIsLeft,
              displayOrder: (toIndex !== -1 ? toIndex : toItems.length) + 1,
            }
          );
          if (onRefreshActivity) await onRefreshActivity();
          toast({
            title: 'Success',
            description: 'Item moved to other column successfully',
          });
        } catch (error) {
          toast({
            title: 'Error',
            description: 'Failed to move item to other column',
            variant: 'destructive',
          });
        } finally {
          setIsUpdating(false);
        }
      }
    }
  };

  const handleReorderItems = async (
    side: 'left' | 'right',
    startIndex: number,
    endIndex: number
  ) => {
    if (!matchingData?.items) return;

    setIsUpdating(true);
    try {
      const items = side === 'left' ? leftItems : rightItems;
      const reorderedItems = arrayMove(items, startIndex, endIndex);

      // Update API for each item in the reordered column
      for (let i = 0; i < reorderedItems.length; i++) {
        const item = reorderedItems[i];
        if (item.quizMatchingPairItemId) {
          if (!item.quizMatchingPairItemId) return;
          await activitiesApi.updateReorderQuizItem(
            activityId,
            item.quizMatchingPairItemId,
            {
              quizMatchingPairItemId: item.quizMatchingPairItemId,
              content: item.content || '',
              isLeftColumn: item.isLeftColumn,
              displayOrder: i + 1,
            }
          );
        }
      }

      // Refresh data từ server
      if (onRefreshActivity) {
        await onRefreshActivity();
      }

      toast({
        title: 'Success',
        description: 'Items reordered successfully',
      });
    } catch (error) {
      console.error('Error reordering items:', error);
      toast({
        title: 'Error',
        description: 'Failed to reorder items',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };
  useEffect(() => {
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, []);

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
          />
        </div>
        <div className="space-y-1">
          <Label>Right Column Title</Label>
          <Input
            value={rightColumnTitle}
            onChange={(e) => handleColumnNameChange('right', e.target.value)}
            placeholder="e.g. Capitals"
            disabled={isUpdating}
          />
        </div>
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
        <p className="text-sm text-blue-700 dark:text-blue-300">
          <strong>Instructions:</strong> Click items to connect/disconnect. Drag
          to reorder or move between columns.
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
          onDragEnd={handleDragEnd}
        >
          <div className="grid grid-cols-2 gap-6">
            <SortableContext
              items={leftItems.map(
                (item) => `left-${item.quizMatchingPairItemId}`
              )}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-3">
                <h3 className="font-medium text-sm text-gray-700 dark:text-gray-300">
                  {leftColumnTitle}
                </h3>
                <div className="space-y-2 min-h-[40px]">
                  {leftItems.length === 0 && (
                    <div className="text-gray-400 text-center py-4 border border-dashed rounded-lg">
                      No items yet. Add a pair to get started.
                    </div>
                  )}
                  {leftItems.map((item, index) => (
                    <SortableItem
                      key={`left-${item.quizMatchingPairItemId}-${refreshKeyRef.current}`}
                      item={item}
                      index={index}
                      onOptionChange={handleOptionChange}
                      onDelete={handleDeleteItem}
                      columnName={leftColumnTitle}
                      isUpdating={isUpdating}
                      side="left"
                      isSelected={selectedLeft === item.quizMatchingPairItemId}
                      onSelect={(itemId) => handleSelectItem('left', itemId)}
                      isConnected={connectedItemIds.left.has(
                        item.quizMatchingPairItemId || ''
                      )}
                      connectionColor={
                        itemIdToColor[item.quizMatchingPairItemId || '']
                      }
                    />
                  ))}
                </div>
              </div>
            </SortableContext>
            <SortableContext
              items={rightItems.map(
                (item) => `right-${item.quizMatchingPairItemId}`
              )}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-3">
                <h3 className="font-medium text-sm text-gray-700 dark:text-gray-300">
                  {rightColumnTitle}
                </h3>
                <div className="space-y-2 min-h-[40px]">
                  {rightItems.length === 0 && (
                    <div className="text-gray-400 text-center py-4 border border-dashed rounded-lg">
                      No items yet. Add a pair to get started.
                    </div>
                  )}
                  {rightItems.map((item, index) => (
                    <SortableItem
                      key={`right-${item.quizMatchingPairItemId}-${refreshKeyRef.current}`}
                      item={item}
                      index={index}
                      onOptionChange={handleOptionChange}
                      onDelete={handleDeleteItem}
                      columnName={rightColumnTitle}
                      isUpdating={isUpdating}
                      side="right"
                      isSelected={selectedRight === item.quizMatchingPairItemId}
                      onSelect={(itemId) => handleSelectItem('right', itemId)}
                      isConnected={connectedItemIds.right.has(
                        item.quizMatchingPairItemId || ''
                      )}
                      connectionColor={
                        itemIdToColor[item.quizMatchingPairItemId || '']
                      }
                    />
                  ))}
                </div>
              </div>
            </SortableContext>
          </div>
        </DndContext>
      )}

      <div className="mt-4">
        <Button
          onClick={handleAddPair}
          variant="outline"
          className="w-full"
          disabled={isUpdating}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Pair
        </Button>
      </div>

      {(selectedLeft || selectedRight) && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg">
          <p className="text-sm text-yellow-700 dark:text-yellow-300">
            {selectedLeft && selectedRight
              ? 'Both items selected. Connecting/disconnecting...'
              : selectedLeft
              ? 'Left item selected. Select a right item to connect.'
              : 'Right item selected. Select a left item to connect.'}
          </p>
        </div>
      )}
    </div>
  );
}
