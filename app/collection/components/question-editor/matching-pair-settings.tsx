'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
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
import type { QuizOption, QuizQuestion } from '../types';
import { Label } from '@/components/ui/label';
import { activitiesApi } from '@/api-client/activities-api';
import { toast } from '@/hooks/use-toast';

interface MatchingPair {
  id: string;
  left: QuizOption;
  right: QuizOption;
  connectionId?: string;
}

interface MatchingPairSettingsProps {
  question: QuizQuestion;
  activityId: string;
  onOptionsChange: (options: QuizOption[]) => void;
  onAddPair: () => void;
  onDeletePair: (pairId: string) => void;
  onReorderPairs: (startIndex: number, endIndex: number) => void;
  leftColumnName?: string;
  rightColumnName?: string;
  onColumnNamesChange?: (left: string, right: string) => void;
  onMatchingDataUpdate?: (matchingData: any) => void;
  onRefreshActivity?: () => Promise<void>;
}

function SortablePairItem({
  pair,
  index,
  onOptionChange,
  onDelete,
  leftColumnName,
  rightColumnName,
  isUpdating = false,
}: {
  pair: MatchingPair;
  index: number;
  onOptionChange: (
    optionId: string,
    field: 'content' | 'option_text',
    value: string
  ) => void;
  onDelete: (pairId: string) => void;
  leftColumnName: string;
  rightColumnName: string;
  isUpdating?: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: pair.id,
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

      {/* Left Column Input */}
      <div className="flex-1 space-y-1">
        <Label className="text-xs text-gray-500 dark:text-gray-400">
          {leftColumnName}
        </Label>
        <Input
          id={`left-item-${index}`}
          placeholder={`Enter ${leftColumnName.toLowerCase()}`}
          value={pair.left?.content || pair.left?.option_text || ''}
          onChange={(e) => {
            if (pair.left.id) {
              onOptionChange(pair.left.id, 'content', e.target.value);
            }
          }}
          className="w-full"
          disabled={isUpdating}
        />
      </div>

      {/* Connector */}
      <div className="flex-shrink-0 w-8 h-8 rounded-md flex items-center justify-center text-gray-400">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="5" y1="12" x2="19" y2="12"></line>
          <polyline points="12 5 19 12 12 19"></polyline>
        </svg>
      </div>

      {/* Right Column Input */}
      <div className="flex-1 space-y-1">
        <Label className="text-xs text-gray-500 dark:text-gray-400">
          {rightColumnName}
        </Label>
        <Input
          id={`right-item-${index}`}
          placeholder={`Enter ${rightColumnName.toLowerCase()}`}
          value={pair.right?.content || pair.right?.option_text || ''}
          onChange={(e) => {
            if (pair.right.id) {
              onOptionChange(pair.right.id, 'content', e.target.value);
            }
          }}
          className="w-full"
          disabled={isUpdating}
        />
      </div>

      {/* Delete Button */}
      <Button
        variant="ghost"
        size="icon"
        className="flex-shrink-0 w-8 h-8 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-100 dark:hover:bg-red-900/20"
        onClick={() => onDelete(pair.id)}
        disabled={isUpdating}
      >
        <Trash2 className="h-4 w-4 text-red-500" />
      </Button>
    </div>
  );
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
  item: {
    id: string;
    content: string;
    isLeftColumn: boolean;
    display_order: number;
    quizMatchingPairItemId: string;
  };
  index: number;
  onOptionChange: (
    optionId: string,
    field: 'content' | 'option_text',
    value: string
  ) => void;
  onDelete: () => void;
  columnName: string;
  isUpdating?: boolean;
  side: 'left' | 'right';
}) {
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
          value={item.content || ''}
          onChange={(e) => {
            if (item.quizMatchingPairItemId) {
              onOptionChange(
                item.quizMatchingPairItemId,
                'content',
                e.target.value
              );
            }
          }}
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
}: MatchingPairSettingsProps) {
  const isDraggingRef = useRef(false);
  const [localLeftColumnName, setLocalLeftColumnName] =
    useState(leftColumnName);
  const [localRightColumnName, setLocalRightColumnName] =
    useState(rightColumnName);
  const [isUpdating, setIsUpdating] = useState(false);

  // Get left and right items directly from matching data
  const leftItems = useMemo(() => {
    if (!question) return [];

    const matchingData =
      question.quizMatchingPairAnswer || question.matching_data;
    if (!matchingData?.items) return [];

    return matchingData.items
      .filter((item) => item.isLeftColumn)
      .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
  }, [question?.quizMatchingPairAnswer, question?.matching_data]);

  const rightItems = useMemo(() => {
    if (!question) return [];

    const matchingData =
      question.quizMatchingPairAnswer || question.matching_data;
    if (!matchingData?.items) return [];

    return matchingData.items
      .filter((item) => !item.isLeftColumn)
      .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
  }, [question?.quizMatchingPairAnswer, question?.matching_data]);

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
    setIsUpdating(true);
    try {
      if (!question) return;

      const matchingData =
        question.quizMatchingPairAnswer || question.matching_data;
      if (!matchingData?.items) return;

      const items = side === 'left' ? leftItems : rightItems;
      const reorderedItems = arrayMove(items, startIndex, endIndex);
      const updatedItems = [...matchingData.items];

      // Update display order for reordered items
      reorderedItems.forEach((item, index) => {
        const itemIndex = updatedItems.findIndex(
          (i) => i.quizMatchingPairItemId === item.quizMatchingPairItemId
        );
        if (itemIndex !== -1) {
          updatedItems[itemIndex] = {
            ...updatedItems[itemIndex],
            displayOrder: index * 2 + (side === 'right' ? 1 : 0),
          };
        }
      });

      // Update API for each item
      for (const item of updatedItems) {
        if (item.quizMatchingPairItemId) {
          await activitiesApi.updateReorderQuizItem(
            activityId,
            item.quizMatchingPairItemId,
            {
              quizMatchingPairItemId: item.quizMatchingPairItemId,
              content: item.content || '',
              isLeftColumn: item.isLeftColumn,
              displayOrder: item.displayOrder || 0,
            }
          );
        }
      }

      // Update the matching data
      const updatedMatchingData = {
        ...matchingData,
        items: updatedItems,
      };

      if (onMatchingDataUpdate) {
        onMatchingDataUpdate(updatedMatchingData);
      }

      onReorderPairs(startIndex, endIndex);
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

  const handleInputChange = async (
    optionId: string,
    field: 'content' | 'option_text',
    value: string
  ) => {
    console.log('handleInputChange called:', { optionId, field, value }); // Debug log

    // Check if question exists
    if (!question) {
      console.log('No question found');
      return;
    }

    const matchingData =
      question.quizMatchingPairAnswer || question.matching_data;

    if (!matchingData?.items) {
      console.log('No matching data items found');
      return;
    }

    // Update local state immediately for better UX
    const updatedItems = matchingData.items.map((item) => {
      if (item.quizMatchingPairItemId === optionId) {
        return { ...item, content: value };
      }
      return item;
    });

    const updatedMatchingData = {
      ...matchingData,
      items: updatedItems,
    };

    // Update local state immediately
    if (onMatchingDataUpdate) {
      onMatchingDataUpdate(updatedMatchingData);
    }

    // Update API
    const item = updatedItems.find(
      (item) => item.quizMatchingPairItemId === optionId
    );
    if (item?.quizMatchingPairItemId) {
      try {
        console.log('Updating API for item:', item.quizMatchingPairItemId);
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
        console.log('API update successful');
      } catch (error) {
        console.error('Error updating item:', error);
        toast({
          title: 'Error',
          description: 'Failed to update item',
          variant: 'destructive',
        });

        // Revert local state if API fails
        if (onRefreshActivity) {
          await onRefreshActivity();
        }
      }
    }
  };

  const handleColumnNameChange = async (
    side: 'left' | 'right',
    value: string
  ) => {
    if (side === 'left') {
      setLocalLeftColumnName(value);
    } else {
      setLocalRightColumnName(value);
    }

    if (onColumnNamesChange) {
      onColumnNamesChange(
        side === 'left' ? value : localLeftColumnName,
        side === 'right' ? value : localRightColumnName
      );
    }

    // Update matching pair quiz with new column names
    try {
      const matchingData =
        question.matching_data || question.quizMatchingPairAnswer;
      if (matchingData) {
        const updatedMatchingData = {
          ...matchingData,
          leftColumnName: side === 'left' ? value : localLeftColumnName,
          rightColumnName: side === 'right' ? value : localRightColumnName,
        };

        await activitiesApi.updateMatchingPairQuiz(activityId, {
          type: 'MATCHING_PAIR',
          questionText: question.question_text,
          timeLimitSeconds: question.time_limit_seconds,
          pointType: question.pointType || 'STANDARD',
          quizMatchingPairAnswer: updatedMatchingData,
        });

        if (onMatchingDataUpdate) {
          onMatchingDataUpdate(updatedMatchingData);
        }
      }
    } catch (error) {
      console.error('Error updating column names:', error);
      toast({
        title: 'Error',
        description: 'Failed to update column names',
        variant: 'destructive',
      });
    }
  };

  const handleAddPair = async () => {
    setIsUpdating(true);
    try {
      // Add new matching pair items via API
      const response = await activitiesApi.addMatchingPair(activityId);

      // Refresh activity data to get the latest state
      if (onRefreshActivity) {
        await onRefreshActivity();
      } else {
        // Fallback: call the original onAddPair
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
  };

  const handleDeleteItem = async (itemId: string, side: 'left' | 'right') => {
    setIsUpdating(true);
    try {
      // Find the pair that contains this item
      const pair =
        leftItems.find((item) => item.quizMatchingPairItemId === itemId) ||
        rightItems.find((item) => item.quizMatchingPairItemId === itemId);

      if (pair) {
        // Delete only the specific item
        if (side === 'left' && pair.quizMatchingPairItemId) {
          await activitiesApi.deleteMatchingPairItem(
            activityId,
            pair.quizMatchingPairItemId
          );
        } else if (side === 'right' && pair.quizMatchingPairItemId) {
          await activitiesApi.deleteMatchingPairItem(
            activityId,
            pair.quizMatchingPairItemId
          );
        }

        // // Delete the connection if it exists (since we're breaking the pair)
        // if (pair.connectionId) {
        //   await activitiesApi.deleteMatchingPairConnection(
        //     activityId,
        //     pair.connectionId
        //   );
        // }
      }

      // Refresh activity data to get the latest state
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
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label>Left Column Title</Label>
          <Input
            value={localLeftColumnName}
            onChange={(e) => handleColumnNameChange('left', e.target.value)}
            placeholder="e.g. Countries"
            disabled={isUpdating}
          />
        </div>
        <div className="space-y-1">
          <Label>Right Column Title</Label>
          <Input
            value={localRightColumnName}
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
              {localLeftColumnName} Items
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
                      item={{
                        id: item.quizMatchingPairItemId || '',
                        content: item.content || '',
                        isLeftColumn: item.isLeftColumn || true,
                        display_order: item.displayOrder || 0,
                        quizMatchingPairItemId:
                          item.quizMatchingPairItemId || '',
                      }}
                      index={index}
                      onOptionChange={handleInputChange}
                      onDelete={() =>
                        handleDeleteItem(
                          item.quizMatchingPairItemId || '',
                          'left'
                        )
                      }
                      columnName={localLeftColumnName}
                      isUpdating={false}
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
              {localRightColumnName} Items
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
                      item={{
                        id: item.quizMatchingPairItemId || '',
                        content: item.content || '',
                        isLeftColumn: item.isLeftColumn || false,
                        display_order: item.displayOrder || 0,
                        quizMatchingPairItemId:
                          item.quizMatchingPairItemId || '',
                      }}
                      index={index}
                      onOptionChange={handleInputChange}
                      onDelete={() =>
                        handleDeleteItem(
                          item.quizMatchingPairItemId || '',
                          'right'
                        )
                      }
                      columnName={localRightColumnName}
                      isUpdating={false}
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
