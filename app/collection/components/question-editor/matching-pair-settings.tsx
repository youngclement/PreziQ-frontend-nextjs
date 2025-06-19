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
import type { QuizQuestion } from '../types';
import { Label } from '@/components/ui/label';
import { activitiesApi } from '@/api-client/activities-api';
import { toast } from '@/hooks/use-toast';
import type {
  QuizMatchingPairAnswer,
  QuizMatchingPairItem,
} from '@/api-client/activities-api';

interface MatchingPairSettingsProps {
  question: QuizQuestion;
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
}: {
  item: QuizMatchingPairItem;
  index: number;
  onOptionChange: (itemId: string, value: string) => void;
  onDelete: () => void;
  columnName: string;
  isUpdating?: boolean;
  side: 'left' | 'right';
}) {
  // ✅ THÊM LOCAL STATE CHO INPUT
  const [localValue, setLocalValue] = useState(item.content || '');
  const updateTimeoutRef = useRef<NodeJS.Timeout>();

  // ✅ SYNC LOCAL VALUE VỚI ITEM CONTENT KHI ITEM THAY ĐỔI
  useEffect(() => {
    setLocalValue(item.content || '');
  }, [item.content]);

  // ✅ DEBOUNCED UPDATE FUNCTION
  const debouncedUpdate = useCallback(
    (value: string) => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }

      updateTimeoutRef.current = setTimeout(() => {
        if (item.quizMatchingPairItemId) {
          onOptionChange(item.quizMatchingPairItemId, value);
        }
      }, 300); // Giảm delay xuống 300ms để responsive hơn
    },
    [item.quizMatchingPairItemId, onOptionChange]
  );

  // ✅ HANDLE INPUT CHANGE VỚI LOCAL STATE
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLocalValue(value); // Cập nhật ngay lập tức
    debouncedUpdate(value); // Debounced API call
  };

  // ✅ CLEANUP TIMEOUT
  useEffect(() => {
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, []);

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
        'group relative flex items-center gap-3 p-3 rounded-lg border transition-all',
        isDragging
          ? 'bg-white dark:bg-gray-800 shadow-lg border-primary z-50'
          : 'bg-white dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600',
        isUpdating && 'opacity-50 pointer-events-none'
      )}
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
          value={localValue} // ✅ SỬ DỤNG LOCAL VALUE
          onChange={handleInputChange} // ✅ SỬ DỤNG LOCAL HANDLER
          className="w-full"
          disabled={isUpdating}
        />
      </div>

      {/* Delete Button */}
      <Button
        variant="ghost"
        size="icon"
        className="flex-shrink-0 w-8 h-8 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-100 dark:hover:bg-red-900/20"
        onClick={onDelete}
        disabled={isUpdating}
      >
        <Trash2 className="h-4 w-4 text-red-500" />
      </Button>
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

  // Đơn giản hóa: chỉ sử dụng một nguồn dữ liệu duy nhất
  const matchingData = useMemo(() => {
    return question.quizMatchingPairAnswer || question.matching_data;
  }, [question.quizMatchingPairAnswer, question.matching_data]);

  // State cho column names với local state
  const [leftColumnTitle, setLeftColumnTitle] = useState('');
  const [rightColumnTitle, setRightColumnTitle] = useState('');

  // Cập nhật column titles khi matchingData thay đổi
  useEffect(() => {
    if (matchingData) {
      setLeftColumnTitle(matchingData.leftColumnName || leftColumnName);
      setRightColumnTitle(matchingData.rightColumnName || rightColumnName);
    }
  }, [matchingData, leftColumnName, rightColumnName]);

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

    if (over && active.id !== over.id) {
      // Handle drag for left items
      if (active.id.toString().startsWith('left-')) {
        const oldIndex = leftItems.findIndex(
          (item) => `left-${item.quizMatchingPairItemId}` === active.id
        );
        const newIndex = leftItems.findIndex(
          (item) => `left-${item.quizMatchingPairItemId}` === over.id
        );
        if (oldIndex !== -1 && newIndex !== -1) {
          await handleReorderItems('left', oldIndex, newIndex);
        }
      }
      // Handle drag for right items
      else if (active.id.toString().startsWith('right-')) {
        const oldIndex = rightItems.findIndex(
          (item) => `right-${item.quizMatchingPairItemId}` === active.id
        );
        const newIndex = rightItems.findIndex(
          (item) => `right-${item.quizMatchingPairItemId}` === over.id
        );
        if (oldIndex !== -1 && newIndex !== -1) {
          await handleReorderItems('right', oldIndex, newIndex);
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

  // ✅ SIMPLIFIED INPUT CHANGE HANDLER
  const handleInputChange = useCallback(
    async (itemId: string, value: string) => {
      if (!matchingData?.items) return;

      // Tìm item để lấy thông tin
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

          // ✅ CHỈ REFRESH KHI CẦN THIẾT (không phải mỗi lần gõ)
          // Có thể bỏ dòng này để tránh refresh liên tục
          // if (onRefreshActivity) {
          //   await onRefreshActivity()
          // }
        } catch (error) {
          console.error('Error updating item:', error);
          toast({
            title: 'Error',
            description: 'Failed to update item',
            variant: 'destructive',
          });

          // Chỉ refresh khi có lỗi để revert
          if (onRefreshActivity) {
            await onRefreshActivity();
          }
        }
      }
    },
    [matchingData, activityId, onRefreshActivity]
  );

  // ✅ DEBOUNCED COLUMN NAME UPDATE
  const debouncedColumnUpdate = useCallback(
    (side: 'left' | 'right', value: string) => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }

      updateTimeoutRef.current = setTimeout(async () => {
        if (!matchingData) return;

        const newLeftName = side === 'left' ? value : leftColumnTitle;
        const newRightName = side === 'right' ? value : rightColumnTitle;

        if (onColumnNamesChange) {
          onColumnNamesChange(newLeftName, newRightName);
        }

        try {
          await activitiesApi.updateMatchingPairQuiz(activityId, {
            type: 'MATCHING_PAIRS',
            questionText: question.question_text,
            timeLimitSeconds: question.time_limit_seconds,
            pointType: question.pointType || 'STANDARD',
            leftColumnName: newLeftName,
            rightColumnName: newRightName,
          });

          // Refresh data từ server
          if (onRefreshActivity) {
            await onRefreshActivity();
          }
        } catch (error) {
          console.error('Error updating column names:', error);
          toast({
            title: 'Error',
            description: 'Failed to update column names',
            variant: 'destructive',
          });

          // Revert local state
          if (matchingData) {
            setLeftColumnTitle(matchingData.leftColumnName || leftColumnName);
            setRightColumnTitle(
              matchingData.rightColumnName || rightColumnName
            );
          }
        }
      }, 500);
    },
    [
      matchingData,
      leftColumnTitle,
      rightColumnTitle,
      activityId,
      question,
      onColumnNamesChange,
      onRefreshActivity,
      leftColumnName,
      rightColumnName,
    ]
  );

  const handleColumnNameChange = useCallback(
    (side: 'left' | 'right', value: string) => {
      // Update local state immediately
      if (side === 'left') {
        setLeftColumnTitle(value);
      } else {
        setRightColumnTitle(value);
      }

      // Debounced API update
      debouncedColumnUpdate(side, value);
    },
    [debouncedColumnUpdate]
  );

  const handleAddPair = useCallback(async () => {
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
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-6">
          {/* Left Column Items */}
          <div className="space-y-3">
            <h3 className="font-medium text-sm text-gray-700 dark:text-gray-300">
              {leftColumnTitle} Items
            </h3>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={leftItems.map(
                  (item) => `left-${item.quizMatchingPairItemId}`
                )}
                strategy={verticalListSortingStrategy}
              >
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
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </div>

          {/* Right Column Items */}
          <div className="space-y-3">
            <h3 className="font-medium text-sm text-gray-700 dark:text-gray-300">
              {rightColumnTitle} Items
            </h3>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={rightItems.map(
                  (item) => `right-${item.quizMatchingPairItemId}`
                )}
                strategy={verticalListSortingStrategy}
              >
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
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </div>
        </div>
      </div>

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
