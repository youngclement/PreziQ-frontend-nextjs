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
    setInputValue(value); // Update local state immediately
    debouncedUpdate(value); // Debounced API call
  };

  // ✅ HANDLE INPUT FOCUS/BLUR
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
        'group relative flex items-center gap-3 p-3 rounded-lg border transition-all',
        isDragging
          ? 'bg-white dark:bg-gray-800 shadow-lg border-primary z-50'
          : 'bg-white dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600',
        isUpdating && 'opacity-50 pointer-events-none',
        isSelected && 'ring-2 ring-primary',
        connectionColor
      )}
      onClick={onSelect}
    >
      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className="flex-shrink-0 w-8 h-8 rounded-md flex items-center justify-center bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 cursor-grab hover:bg-gray-200 dark:hover:bg-gray-700 active:cursor-grabbing"
      >
        <GripVertical className="h-4 w-4" />
      </div>

      {/* Item Input */}
      <div className="flex-1 space-y-1">
        <Label className="text-xs text-gray-500 dark:text-gray-400">
          {columnName} {index + 1}
        </Label>
        <Input
          id={`${side}-item-${index}`}
          placeholder={`Enter ${columnName.toLowerCase()}`}
          value={inputValue} // ✅ Controlled input với local state
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          className="w-full"
          disabled={isUpdating}
        />
      </div>

      {/* Delete Button */}
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

      {connectionColor && (
        <span className="absolute top-1 right-1 text-xs font-bold">✓</span>
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

  // Đơn giản hóa: chỉ sử dụng một nguồn dữ liệu duy nhất
  const matchingData = useMemo(() => {
    return question.quizMatchingPairAnswer || question.matching_data;
  }, [question.quizMatchingPairAnswer, question.matching_data]);

  // State cho column names với local state
  const [leftColumnTitle, setLeftColumnTitle] = useState(
    matchingData?.leftColumnName || leftColumnName
  );
  const [rightColumnTitle, setRightColumnTitle] = useState(
    matchingData?.rightColumnName || rightColumnName
  );

  // Cập nhật column titles khi activityId thay đổi (tức là khi chuyển sang câu hỏi khác)
  useEffect(() => {
    // Effect này đảm bảo rằng khi người dùng chuyển sang một câu hỏi khác (activityId thay đổi),
    // các tiêu đề cột sẽ được reset về giá trị của câu hỏi mới.
    // Nó sẽ không chạy lại khi người dùng đang nhập, do đó không ghi đè dữ liệu.
    setLeftColumnTitle(matchingData?.leftColumnName || leftColumnName);
    setRightColumnTitle(matchingData?.rightColumnName || rightColumnName);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activityId, matchingData]);

  // Debounced function to call onColumnNamesChange
  const debouncedUpdateColumnNames = useCallback(
    (left: string, right: string) => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
      updateTimeoutRef.current = setTimeout(async () => {
        setIsUpdating(true);
        try {
          // Ensure we have the full matching data object to avoid deleting items
          const fullMatchingData = (matchingData || {
            items: [],
            connections: [],
          }) as QuizMatchingPairAnswer;

          const payload: MatchingPairQuizPayload = {
            type: 'MATCHING_PAIRS',
            questionText: question.question_text || '',
            // Use snake_case properties from the question object
            timeLimitSeconds: question.time_limit_seconds,
            pointType: question.pointType as
              | 'STANDARD'
              | 'NO_POINTS'
              | 'DOUBLE_POINTS',
            // Set top-level properties as they appear in the error message
            leftColumnName: left,
            rightColumnName: right,
            // Also include the full answer object with updated names
            // to be safe against data loss and ambiguous API contracts
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
      }, 500); // 500ms debounce
    },
    [activityId, onColumnNamesChange, onRefreshActivity, question, matchingData]
  );

  // Handle changes to column name inputs
  const handleColumnNameChange = (side: 'left' | 'right', value: string) => {
    if (side === 'left') {
      setLeftColumnTitle(value);
      debouncedUpdateColumnNames(value, rightColumnTitle);
    } else {
      setRightColumnTitle(value);
      debouncedUpdateColumnNames(leftColumnTitle, value);
    }
  };

  // Get left and right items từ matchingData
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

  // Tạo Set chứa các itemId đã kết nối
  const connectedLeftIds = useMemo(
    () =>
      new Set(
        matchingData?.connections?.map(
          (conn) => conn.leftItem.quizMatchingPairItemId
        )
      ),
    [matchingData?.connections]
  );

  const connectedRightIds = useMemo(
    () =>
      new Set(
        matchingData?.connections?.map(
          (conn) => conn.rightItem.quizMatchingPairItemId
        )
      ),
    [matchingData?.connections]
  );

  // 1. Tạo bảng màu
  const connectionColors = [
    'bg-red-100 border-red-400 text-red-700',
    'bg-blue-100 border-blue-400 text-blue-700',
    'bg-yellow-100 border-yellow-400 text-yellow-700',
    'bg-green-100 border-green-400 text-green-700',
    'bg-purple-100 border-purple-400 text-purple-700',
    'bg-pink-100 border-pink-400 text-pink-700',
  ];

  // 2. Tạo map: itemId -> colorClass
  const itemIdToColor = useMemo(() => {
    const map: Record<string, string> = {};
    matchingData?.connections?.forEach((conn, idx) => {
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

    const activeIsLeft = active.id.toString().startsWith('left-');
    const overIsLeft = over.id.toString().startsWith('left-');

    // Nếu kéo trong cùng một cột, chỉ reorder
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
      if (oldIndex !== -1 && newIndex !== -1) {
        await handleReorderItems(
          activeIsLeft ? 'left' : 'right',
          oldIndex,
          newIndex
        );
      }
    } else {
      // Kéo sang cột khác
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
        setIsUpdating(true);
        try {
          const item = fromItems[fromIndex];
          // Cập nhật sang cột mới và vị trí mới
          if (!item.quizMatchingPairItemId) return;
          await activitiesApi.updateReorderQuizItem(
            activityId,
            item.quizMatchingPairItemId,
            {
              quizMatchingPairItemId: item.quizMatchingPairItemId,
              content: item.content || '',
              isLeftColumn: !activeIsLeft, // chuyển cột
              displayOrder: (toIndex !== -1 ? toIndex : toItems.length) + 1,
            }
          );
          // Sau đó cập nhật lại displayOrder cho các item còn lại của cả hai cột
          // (Có thể gọi lại onRefreshActivity để reload từ server)
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

  const handleInputChange = useCallback(
    async (itemId: string, value: string) => {
      if (!matchingData?.items) return;

      const item = matchingData.items.find(
        (item) => item.quizMatchingPairItemId === itemId
      );

      if (item?.quizMatchingPairItemId) {
        try {
          await activitiesApi.updateReorderQuizItem(
            activityId,
            item.quizMatchingPairItemId,
            {
              quizMatchingPairItemId: item.quizMatchingPairItemId,
              content: value,
              isLeftColumn: item.isLeftColumn,
              displayOrder: item.displayOrder || 0,
            }
          );

          console.log('✅ Item updated successfully:', itemId, value);
        } catch (error) {
          console.error('❌ Error updating item:', error);
          toast({
            title: 'Error',
            description: 'Failed to update item',
            variant: 'destructive',
          });
        }
      }
    },
    [matchingData, activityId] // Loại bỏ onRefreshActivity khỏi dependencies
  );

  const handleAddPair = useCallback(async () => {
    if (!activityId) {
      toast({
        title: 'Error',
        description: 'Activity ID is missing. Please save the question first.',
        variant: 'destructive',
      });
      return;
    }
    setIsUpdating(true);
    try {
      await activitiesApi.addMatchingPair(activityId);

      // Refresh data từ server
      if (onRefreshActivity) {
        await onRefreshActivity();
      } else {
        onAddPair();
      }

      toast({
        title: 'Success',
        description: 'New pair added successfully',
      });
    } catch (error) {
      console.error('Error adding pair:', error);
      toast({
        title: 'Error',
        description: 'Failed to add new pair',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  }, [activityId, onRefreshActivity, onAddPair]);

  const handleDeleteItem = useCallback(
    async (itemId: string, side: 'left' | 'right') => {
      setIsUpdating(true);
      try {
        await activitiesApi.deleteMatchingPairItem(activityId, itemId);

        // Refresh data từ server
        if (onRefreshActivity) {
          await onRefreshActivity();
        }

        toast({
          title: 'Success',
          description: 'Item deleted successfully',
        });
      } catch (error) {
        console.error('Error deleting item:', error);
        toast({
          title: 'Error',
          description: 'Failed to delete item',
          variant: 'destructive',
        });
      } finally {
        setIsUpdating(false);
      }
    },
    [activityId, onRefreshActivity]
  );

  const handleSelectItem = (side: 'left' | 'right', itemId: string) => {
    if (side === 'left') {
      setSelectedLeft(itemId === selectedLeft ? null : itemId);
    } else {
      setSelectedRight(itemId === selectedRight ? null : itemId);
    }
  };

  useEffect(() => {
    const createConnection = async () => {
      if (selectedLeft && selectedRight) {
        setIsUpdating(true);
        try {
          const leftItemObj = matchingData?.items?.find(
            (item) => item.quizMatchingPairItemId === selectedLeft
          );
          const rightItemObj = matchingData?.items?.find(
            (item) => item.quizMatchingPairItemId === selectedRight
          );

          if (
            leftItemObj?.quizMatchingPairItemId &&
            rightItemObj?.quizMatchingPairItemId
          ) {
            await activitiesApi.addMatchingPairConnection(activityId, {
              leftItemId: leftItemObj.quizMatchingPairItemId,
              rightItemId: rightItemObj.quizMatchingPairItemId,
            });
          }
          toast({
            title: 'Success',
            description: 'Connection created successfully',
          });
          setSelectedLeft(null);
          setSelectedRight(null);
          if (onRefreshActivity) await onRefreshActivity();
        } catch (error) {
          toast({
            title: 'Error',
            description: 'Failed to create connection',
            variant: 'destructive',
          });
        } finally {
          setIsUpdating(false);
        }
      }
    };
    createConnection();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedLeft, selectedRight]);

  // Force refresh when settings update trigger changes
  useEffect(() => {
    if (onRefreshActivity) {
      onRefreshActivity();
    }
  }, [settingsUpdateTrigger, onRefreshActivity]);

  // Cleanup timeout on unmount
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

      {/* Display all items in a grid layout */}
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
            {/* Left Column Items */}
            <div className="space-y-3">
              <h3 className="font-medium text-sm text-gray-700 dark:text-gray-300">
                {leftColumnTitle} Items
              </h3>
              <div className="space-y-2">
                {leftItems.map((item, index) => (
                  <SortableItem
                    key={`left-${item.quizMatchingPairItemId}`}
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
                    isUpdating={isUpdating}
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
            {/* Right Column Items */}
            <div className="space-y-3">
              <h3 className="font-medium text-sm text-gray-700 dark:text-gray-300">
                {rightColumnTitle} Items
              </h3>
              <div className="space-y-2">
                {rightItems.map((item, index) => (
                  <SortableItem
                    key={`right-${item.quizMatchingPairItemId}`}
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
                    isUpdating={isUpdating}
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

      <div className="mt-4">
        <Button
          onClick={handleAddPair}
          variant="outline"
          className="w-full"
          disabled={isUpdating}
        >
          <Plus className="h-4 w-4 mr-2" />
          {isUpdating ? 'Adding...' : 'Add Pair'}
        </Button>
      </div>
    </div>
  );
}
