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
  const updateTimeoutRef = useRef<NodeJS.Timeout>();
  const isUserTypingRef = useRef(false);

  useEffect(() => {
    if (!isUserTypingRef.current && item.content !== inputValue) {
      setInputValue(item.content || '');
    }
  }, [item.content, inputValue]);

  const debouncedUpdate = useCallback(
    (value: string) => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }

      updateTimeoutRef.current = setTimeout(() => {
        if (item.quizMatchingPairItemId) {
          onOptionChange(item.quizMatchingPairItemId, value);
        }
      }, 300);
    },
    [item.quizMatchingPairItemId, onOptionChange]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    isUserTypingRef.current = true;
    setInputValue(value);
    debouncedUpdate(value);
  };

  const handleInputFocus = () => {
    isUserTypingRef.current = true;
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
          onFocus={handleInputFocus}
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
  const isDraggingRef = useRef(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const updateTimeoutRef = useRef<NodeJS.Timeout>();
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
  const [selectedRight, setSelectedRight] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [matchingData, setMatchingData] =
    useState<QuizMatchingPairAnswer | null>(
      question.quizMatchingPairAnswer || question.matching_data || null
    );

  const forceRefresh = useCallback(() => {
    setRefreshKey((prev) => prev + 1);
  }, []);

  useEffect(() => {
    const newData =
      question.quizMatchingPairAnswer || question.matching_data || null;
    setMatchingData(newData || null);
    setSelectedLeft(null);
    setSelectedRight(null);
  }, [
    activityId,
    settingsUpdateTrigger,
    question.quizMatchingPairAnswer,
    question.matching_data,
  ]);

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

  useEffect(() => {
    const newLeftColumnName = matchingData?.leftColumnName || leftColumnName;
    const newRightColumnName = matchingData?.rightColumnName || rightColumnName;

    setLeftColumnTitle((prev) => {
      if (prev !== newLeftColumnName) {
        return newLeftColumnName;
      }
      return prev;
    });

    setRightColumnTitle((prev) => {
      if (prev !== newRightColumnName) {
        return newRightColumnName;
      }
      return prev;
    });
  }, [matchingData, leftColumnName, rightColumnName]);

  const [leftColumnError, setLeftColumnError] = useState('');
  const [rightColumnError, setRightColumnError] = useState('');

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
          toast({
            title: 'Success',
            description: 'Column names updated successfully.',
          });

          if (onColumnNamesChange) {
            onColumnNamesChange(left, right);
          }

          if (onRefreshActivity) {
            await onRefreshActivity();
          }
          forceRefresh();
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
    [
      activityId,
      onColumnNamesChange,
      onRefreshActivity,
      question,
      matchingData,
      forceRefresh,
    ]
  );

  const handleColumnNameChange = (side: 'left' | 'right', value: string) => {
    if (side === 'left') {
      setLeftColumnTitle(value);
      if (value.trim()) setLeftColumnError('');
      debouncedUpdateColumnNames(value, rightColumnTitle);
    } else {
      setRightColumnTitle(value);
      if (value.trim()) setRightColumnError('');
      debouncedUpdateColumnNames(leftColumnTitle, value);
    }
  };

  const leftItems = useMemo(() => {
    if (!matchingData?.items) {
      console.log('📝 No left items - matchingData.items is empty');
      return [];
    }
    const items = matchingData.items
      .filter((item) => item.isLeftColumn)
      .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
    console.log('📝 Left items:', items.length, items);
    return items;
  }, [matchingData?.items]);

  const rightItems = useMemo(() => {
    if (!matchingData?.items) {
      console.log('📝 No right items - matchingData.items is empty');
      return [];
    }
    const items = matchingData.items
      .filter((item) => !item.isLeftColumn)
      .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
    console.log('📝 Right items:', items.length, items);
    return items;
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
    (matchingData?.connections ?? [])
      .filter(
        (conn): conn is QuizMatchingPairConnection =>
          !!conn && !!conn.leftItem && !!conn.rightItem
      )
      .forEach((conn, idx) => {
        const color = connectionColors[idx % connectionColors.length];
        if (conn.leftItem?.quizMatchingPairItemId)
          map[conn.leftItem.quizMatchingPairItemId] = color;
        if (conn.rightItem?.quizMatchingPairItemId)
          map[conn.rightItem.quizMatchingPairItemId] = color;
      });
    return map;
  }, [matchingData?.connections]);

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

  const handleDragStart = () => {
    isDraggingRef.current = true;
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    isDraggingRef.current = false;
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const originalMatchingData = matchingData;
    setIsUpdating(true);

    try {
      const activeIsLeft = active.id.toString().startsWith('left-');
      const overIsLeft = over.id.toString().startsWith('left-');

      if (activeIsLeft === overIsLeft) {
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
        const movedItem = items[oldIndex];

        if (oldIndex !== -1 && newIndex !== -1) {
          const reordered = arrayMove(items, oldIndex, newIndex);
          const updatedItems = reordered.map((item, index) => ({
            ...item,
            displayOrder: index + 1,
          }));
          const otherItems = activeIsLeft ? rightItems : leftItems;

          setMatchingData((prev) => ({
            ...prev!,
            items: [...otherItems, ...updatedItems],
          }));

          setMatchingData((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              connections: (prev.connections || []).filter(
                (conn) =>
                  conn.leftItem.quizMatchingPairItemId !==
                    movedItem.quizMatchingPairItemId &&
                  conn.rightItem.quizMatchingPairItemId !==
                    movedItem.quizMatchingPairItemId
              ),
            };
          });

          await activitiesApi.updateReorderQuizItem(
            activityId,
            movedItem.quizMatchingPairItemId!,
            {
              ...movedItem,
              displayOrder: newIndex + 1,
            }
          );
        }
      } else {
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
        const movedItem = fromItems[fromIndex];

        if (fromIndex !== -1) {
          const newFromItems = fromItems.filter(
            (i) => i.quizMatchingPairItemId !== movedItem.quizMatchingPairItemId
          );
          const newToItems = [...toItems];
          newToItems.splice(toIndex, 0, {
            ...movedItem,
            isLeftColumn: !activeIsLeft,
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

          const newConnections = (
            originalMatchingData?.connections || []
          ).filter(
            (conn) =>
              conn.leftItem.quizMatchingPairItemId !==
                movedItem.quizMatchingPairItemId &&
              conn.rightItem.quizMatchingPairItemId !==
                movedItem.quizMatchingPairItemId
          );

          setMatchingData((prev) => ({
            ...prev!,
            items: allItems,
            connections: newConnections,
          }));

          setMatchingData((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              connections: (prev.connections || []).filter(
                (conn) =>
                  conn.leftItem.quizMatchingPairItemId !==
                    movedItem.quizMatchingPairItemId &&
                  conn.rightItem.quizMatchingPairItemId !==
                    movedItem.quizMatchingPairItemId
              ),
            };
          });

          await activitiesApi.updateReorderQuizItem(
            activityId,
            movedItem.quizMatchingPairItemId!,
            {
              ...movedItem,
              isLeftColumn: !activeIsLeft,
              displayOrder: toIndex + 1,
            }
          );
        }
      }

      if (onRefreshActivity) {
        await onRefreshActivity();
      }
      forceRefresh();
    } catch (error) {
      console.error('Failed to update item position', error);
      setMatchingData(originalMatchingData);
      toast({
        title: 'Error',
        description: 'Failed to move item.',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleReorderItems = async (
    side: 'left' | 'right',
    startIndex: number,
    endIndex: number
  ) => {
    const currentItems = side === 'left' ? leftItems : rightItems;
    const reorderedItems = arrayMove(currentItems, startIndex, endIndex);

    setMatchingData((prev) => {
      if (!prev) return prev;
      const updatedSideItemsWithOrder = reorderedItems.map((item, index) => ({
        ...item,
        displayOrder: index + 1,
      }));
      const otherSideItems = prev.items.filter(
        (item) => item.isLeftColumn !== (side === 'left')
      );
      const newItems = [...otherSideItems, ...updatedSideItemsWithOrder];
      return {
        ...prev,
        items: newItems,
      };
    });

    try {
      const updatePromises = reorderedItems.map((item, index) =>
        activitiesApi.updateReorderQuizItem(
          activityId,
          item.quizMatchingPairItemId!,
          {
            quizMatchingPairItemId: item.quizMatchingPairItemId!,
            content: item.content || '',
            isLeftColumn: item.isLeftColumn,
            displayOrder: index + 1,
          }
        )
      );
      await Promise.all(updatePromises);

      if (onRefreshActivity) {
        await onRefreshActivity();
      }
      forceRefresh();
    } catch (error) {
      console.error('Failed to save reordering:', error);
      if (onRefreshActivity) {
        await onRefreshActivity();
      }
      forceRefresh();
    }
  };

  const handleInputChange = useCallback(
    async (itemId: string, value: string) => {
      if (!matchingData?.items) return;

      setMatchingData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          items: prev.items.map((item) =>
            item.quizMatchingPairItemId === itemId
              ? { ...item, content: value }
              : item
          ),
        };
      });

      const item = matchingData.items.find(
        (item) => item.quizMatchingPairItemId === itemId
      );

      if (item?.quizMatchingPairItemId) {
        try {
          await activitiesApi.updateReorderQuizItem(
            activityId,
            item.quizMatchingPairItemId!,
            {
              quizMatchingPairItemId: item.quizMatchingPairItemId!,
              content: value,
              isLeftColumn: item.isLeftColumn,
              displayOrder: item.displayOrder || 0,
            }
          );
        } catch (error) {
          console.error('Failed to update item:', error);
        }
      }
    },
    [matchingData, activityId]
  );

  const handleAddPair = useCallback(async () => {
    console.log('🔄 Adding new pair...');
    setIsUpdating(true);
    const originalMatchingData = matchingData;

    const newLeftItem: QuizMatchingPairItem = {
      content: '',
      isLeftColumn: true,
      displayOrder: leftItems.length + 1,
    };
    const newRightItem: QuizMatchingPairItem = {
      content: '',
      isLeftColumn: false,
      displayOrder: rightItems.length + 1,
    };

    // Optimistic update: Add new pair to local state
    setMatchingData((prev: any) => {
      const currentItems = prev?.items || [];
      return {
        ...prev,
        items: [...currentItems, newLeftItem, newRightItem],
        connections: prev?.connections || [],
      };
    });

    try {
      const response = await activitiesApi.addMatchingPair(activityId);
      console.log('✅ Add pair response:', response);

      // Update state with actual server data
      if (response?.data?.quizMatchingPairAnswer) {
        setMatchingData((prev) => {
          if (!prev) return response.data.quizMatchingPairAnswer;

          const newItems = originalMatchingData?.items || [];
          const serverItems = response.data.quizMatchingPairAnswer.items || [];
          return {
            ...response.data.quizMatchingPairAnswer,
            items: [
              ...newItems,
              ...serverItems.filter(
                (item: any) =>
                  item.displayOrder === newLeftItem.displayOrder ||
                  item.displayOrder === newRightItem.displayOrder
              ),
            ],
          };
        });

        if (onMatchingDataUpdate) {
          onMatchingDataUpdate(response.data.quizMatchingPairAnswer);
        }
      }

      toast({
        title: 'Success',
        description: 'New pair added successfully',
      });

      // Use the new refresh function if available
      if (onRefreshActivity) {
        await onRefreshActivity();
      }
      forceRefresh();
    } catch (error) {
      console.error('❌ Failed to add pair:', error);

      // Rollback optimistic update
      setMatchingData(originalMatchingData);

      toast({
        title: 'Error',
        description: 'Failed to add new pair',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  }, [
    activityId,
    onMatchingDataUpdate,
    onRefreshActivity,
    forceRefresh,
    leftItems.length,
    rightItems.length,
  ]);

  const handleDeleteItem = useCallback(
    async (itemId: string, side: 'left' | 'right') => {
      console.log('🗑️ Deleting item:', itemId, side);
      setIsUpdating(true);
      const originalMatchingData = matchingData;

      try {
        setMatchingData((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            items: prev.items.filter(
              (item) => item.quizMatchingPairItemId !== itemId
            ),
            connections: (prev?.connections ?? []).filter(
              (conn) =>
                conn.leftItem.quizMatchingPairItemId !== itemId &&
                conn.rightItem.quizMatchingPairItemId !== itemId
            ),
          };
        });

        await activitiesApi.deleteMatchingPairItem(activityId, itemId);

        toast({
          title: 'Success',
          description: 'Item deleted successfully',
        });
      } catch (error) {
        console.error('❌ Failed to delete item:', error);
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
    [activityId, matchingData]
  );

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

  const handleConnect = useCallback(
    async (leftItem: QuizMatchingPairItem, rightItem: QuizMatchingPairItem) => {
      if (!leftItem.quizMatchingPairItemId || !rightItem.quizMatchingPairItemId)
        return;
      setIsConnecting(true);

      try {
        const response = await activitiesApi.addMatchingPairConnection(
          activityId,
          {
            leftItemId: leftItem.quizMatchingPairItemId,
            rightItemId: rightItem.quizMatchingPairItemId,
          }
        );

        if (response?.data?.data) {
          const newConnection = {
            quizMatchingPairConnectionId:
              response.data.data.quizMatchingPairConnectionId,
            leftItem: response.data.data.leftItem,
            rightItem: response.data.data.rightItem,
          };

          setMatchingData((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              connections: [...prev.connections, newConnection],
            };
          });

          toast({
            title: 'Success',
            description: 'Items connected successfully',
          });
        }
      } catch (error) {
        console.error('Connection error:', error);
        toast({
          title: 'Error',
          description: 'Failed to create connection.',
          variant: 'destructive',
        });
      } finally {
        setIsConnecting(false);
      }
    },
    [activityId]
  );

  const handleDisconnect = useCallback(
    async (connection: QuizMatchingPairConnection) => {
      if (!connection.quizMatchingPairConnectionId) return;
      setIsConnecting(true);

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
      } catch (error) {
        setMatchingData((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            connections: [...prev.connections, connection],
          };
        });
        toast({
          title: 'Error',
          description: 'Failed to remove connection',
          variant: 'destructive',
        });
      } finally {
        setIsConnecting(false);
      }
    },
    [activityId]
  );

  useEffect(() => {
    const handleConnection = async () => {
      if (!selectedLeft || !selectedRight || isConnecting) return;

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
        await handleDisconnect(existingConnection);
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

        await handleConnect(leftItem, rightItem);
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
    handleConnect,
    handleDisconnect,
  ]);

  useEffect(() => {
    if (onRefreshActivity && settingsUpdateTrigger > 0) {
      console.log('🔄 Settings update trigger changed, refreshing...');
      onRefreshActivity().then(() => {
        forceRefresh();
      });
    }
  }, [settingsUpdateTrigger, onRefreshActivity, forceRefresh]);

  useEffect(() => {
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    console.log('🔍 MatchingData changed:', {
      itemsCount: matchingData?.items?.length || 0,
      connectionsCount: matchingData?.connections?.length || 0,
      leftItems: leftItems.length,
      rightItems: rightItems.length,
      refreshKey,
    });
  }, [matchingData, leftItems.length, rightItems.length, refreshKey]);

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

      <div className="bg-gray-50 dark:bg-gray-900/20 p-2 rounded text-xs">
        <p>
          Debug: Items: {matchingData?.items?.length || 0}, Left:{' '}
          {leftItems.length}, Right: {rightItems.length}, Connections:{' '}
          {matchingData?.connections?.length || 0}
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
              <div className="space-y-3 min-h-[40px]">
                <h3 className="font-medium text-sm text-gray-700 dark:text-gray-300">
                  {leftColumnTitle}
                </h3>
                <div className="space-y-2 min-h-[40px] flex flex-col">
                  {leftItems.length === 0 && (
                    <div className="text-gray-400 text-center py-4 border border-dashed rounded-lg">
                      No items yet. Add a pair to get started.
                    </div>
                  )}
                  {leftItems.map((item, index) => (
                    <SortableItem
                      key={`left-${item.quizMatchingPairItemId}-${refreshKey}`}
                      item={item}
                      index={index}
                      onOptionChange={handleInputChange}
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
                <div className="space-y-2">
                  {rightItems.length === 0 && (
                    <div className="text-gray-400 text-center py-4 border border-dashed rounded-lg">
                      No items yet. Add a pair to get started.
                    </div>
                  )}
                  {rightItems.map((item, index) => (
                    <SortableItem
                      key={`right-${item.quizMatchingPairItemId}-${refreshKey}`}
                      item={item}
                      index={index}
                      onOptionChange={handleInputChange}
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
