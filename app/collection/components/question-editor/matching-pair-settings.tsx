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
import type { QuizOption } from '../types';
import { Label } from '@/components/ui/label';

interface MatchingPair {
  id: string;
  left: QuizOption;
  right: QuizOption;
}

interface MatchingPairSettingsProps {
  options: QuizOption[];
  onOptionsChange: (options: QuizOption[]) => void;
  onAddPair: () => void;
  onDeletePair: (pairId: string) => void;
  onReorderPairs: (startIndex: number, endIndex: number) => void;
  leftColumnName?: string;
  rightColumnName?: string;
  onColumnNamesChange?: (left: string, right: string) => void;
}

function SortablePairItem({
  pair,
  index,
  onOptionChange,
  onDelete,
  leftColumnName,
  rightColumnName,
}: {
  pair: MatchingPair;
  index: number;
  onOptionChange: (
    optionId: string,
    field: 'option_text',
    value: string
  ) => void;
  onDelete: (pairId: string) => void;
  leftColumnName: string;
  rightColumnName: string;
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
          : 'bg-white dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
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
          value={pair.left?.option_text || ''}
          onChange={(e) => {
            if (pair.left.id) {
              onOptionChange(pair.left.id, 'option_text', e.target.value);
            }
          }}
          className="w-full"
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
          value={pair.right?.option_text || ''}
          onChange={(e) => {
            if (pair.right.id) {
              onOptionChange(pair.right.id, 'option_text', e.target.value);
            }
          }}
          className="w-full"
        />
      </div>

      {/* Delete Button */}
      <Button
        variant="ghost"
        size="icon"
        className="flex-shrink-0 w-8 h-8 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-100 dark:hover:bg-red-900/20"
        onClick={() => onDelete(pair.id)}
      >
        <Trash2 className="h-4 w-4 text-red-500" />
      </Button>
    </div>
  );
}

export function MatchingPairSettings({
  options,
  onOptionsChange,
  onAddPair,
  onDeletePair,
  onReorderPairs,
  leftColumnName = 'Left Item',
  rightColumnName = 'Right Item',
  onColumnNamesChange,
}: MatchingPairSettingsProps) {
  const isDraggingRef = useRef(false);
  const [localLeftColumnName, setLocalLeftColumnName] =
    useState(leftColumnName);
  const [localRightColumnName, setLocalRightColumnName] =
    useState(rightColumnName);

  const matchingPairs = useMemo(() => {
    const pairs: MatchingPair[] = [];
    const leftItems = options.filter((opt) => opt.type === 'left');
    const rightItems = options.filter((opt) => opt.type === 'right');

    // Sort left items by display_order to maintain visual order
    leftItems.sort((a, b) => (a.display_order || 0) - (b.display_order || 0));

    leftItems.forEach((leftItem) => {
      if (leftItem.pair_id) {
        const rightItem = rightItems.find(
          (item) => item.pair_id === leftItem.pair_id
        );
        if (rightItem) {
          pairs.push({
            id: leftItem.pair_id,
            left: leftItem,
            right: rightItem,
          });
        }
      }
    });
    return pairs;
  }, [options]);

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

  const handleDragEnd = (event: DragEndEvent) => {
    isDraggingRef.current = false;
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = matchingPairs.findIndex((p) => p.id === active.id);
      const newIndex = matchingPairs.findIndex((p) => p.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        onReorderPairs(oldIndex, newIndex);
      }
    }
  };

  const handleInputChange = (
    optionId: string,
    field: 'option_text',
    value: string
  ) => {
    const newOptions = options.map((opt) => {
      if (opt.id === optionId) {
        return { ...opt, [field]: value };
      }
      return opt;
    });
    onOptionsChange(newOptions);
  };

  const handleColumnNameChange = (side: 'left' | 'right', value: string) => {
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
          />
        </div>
        <div className="space-y-1">
          <Label>Right Column Title</Label>
          <Input
            value={localRightColumnName}
            onChange={(e) => handleColumnNameChange('right', e.target.value)}
            placeholder="e.g. Capitals"
          />
        </div>
      </div>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={matchingPairs.map((p) => p.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-3">
            {matchingPairs.map((pair, index) => (
              <SortablePairItem
                key={pair.id}
                pair={pair}
                index={index}
                onOptionChange={handleInputChange}
                onDelete={onDeletePair}
                leftColumnName={localLeftColumnName}
                rightColumnName={localRightColumnName}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
      <div className="mt-4">
        <Button
          onClick={onAddPair}
          variant="outline"
          className="w-full"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Pair
        </Button>
      </div>
    </div>
  );
}
