"use client";

import React from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, GripVertical, Trash2, MoveVertical, Move } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Option {
  option_text: string;
  is_correct: boolean;
  display_order: number;
}

interface ReorderOptionsProps {
  options: Option[];
  onOptionChange: (index: number, field: string, value: any, isTyping?: boolean) => void;
  onDeleteOption: (index: number) => void;
  onAddOption: () => void;
  onReorder?: (sourceIndex: number, destinationIndex: number) => void;
}

interface SortableItemProps {
  id: string;
  option: Option;
  index: number;
  onOptionChange: (index: number, field: string, value: any, isTyping?: boolean) => void;
  onDeleteOption: (index: number) => void;
}

function SortableItem({ id, option, index, onOptionChange, onDeleteOption }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex items-center gap-2 p-1.5 relative mb-2 transition-all',
        isDragging ? 'z-50' : ''
      )}
    >
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-black to-gray-800 dark:from-black dark:to-gray-900 flex items-center justify-center border border-gray-700 dark:border-gray-800 text-base font-semibold text-white shadow-sm relative z-10">
        {index + 1}
      </div>

      <div
        className={cn(
          'flex-1 bg-white dark:bg-black rounded-lg p-2 shadow-sm border flex items-center gap-2 transition-all',
          isDragging
            ? 'border-primary ring-1 ring-primary/30 bg-primary/5'
            : 'border-gray-300 dark:border-gray-800 hover:border-gray-400 dark:hover:border-gray-700'
        )}
      >
        <Input
          value={option.option_text}
          onChange={(e) => {
            console.log('ReorderOptions onChange - isTyping:', true);
            onOptionChange(index, 'option_text', e.target.value, true);
          }}
          className="flex-1 border-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent p-0 text-sm"
          placeholder={`Step ${index + 1}`}
          onBlur={(e) => {
            onOptionChange(index, 'option_text', e.target.value, false);
          }}
        />

        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => onDeleteOption(index)}
            className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md h-6 w-6"
          >
            <Trash2 className="h-3 w-3" />
          </Button>

          <div
            className="w-6 h-6 flex-shrink-0 rounded-md bg-gray-100 dark:bg-gray-900 flex items-center justify-center cursor-grab text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-3 w-3" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function ReorderOptions({
  options,
  onOptionChange,
  onDeleteOption,
  onAddOption,
  onReorder,
}: ReorderOptionsProps) {
  const handleDragEnd = (result: DragEndEvent) => {
    const { active, over } = result;

    if (over && active.id !== over.id) {
      const oldIndex = options.findIndex(option => `option-${option.display_order}` === active.id);
      const newIndex = options.findIndex(option => `option-${option.display_order}` === over.id);

      if (oldIndex !== -1 && newIndex !== -1 && onReorder) {
        console.log(`Reordering from ${oldIndex} to ${newIndex}`);
        onReorder(oldIndex, newIndex);
        // The parent will handle the API update
      }
    }
  };

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

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center mb-2">
        <Label className="flex items-center text-sm font-medium">
          <MoveVertical className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" />
          Arrange Steps
        </Label>
        <Button
          size="sm"
          variant="outline"
          onClick={onAddOption}
          className="h-7 px-2 text-xs font-medium text-primary hover:text-primary/90 hover:bg-primary/5"
        >
          <Plus className="h-3 w-3 mr-1" /> Add Step
        </Button>
      </div>

      <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800 text-xs text-blue-800 dark:text-blue-300 mb-2">
        <div className="flex items-start gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <span>Define steps in the correct order. Students will need to arrange these steps in the same sequence.</span>
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={options.map(option => `option-${option.display_order}`)}
          strategy={verticalListSortingStrategy}
        >
          <div className="relative">
            {options.length > 1 && (
              <div className="absolute left-4 top-4 bottom-4 w-0.5 bg-black/30 dark:bg-white/20 z-0"></div>
            )}

            {options.map((option, index) => (
              <SortableItem
                key={`option-${option.display_order}`}
                id={`option-${option.display_order}`}
                option={option}
                index={index}
                onOptionChange={onOptionChange}
                onDeleteOption={onDeleteOption}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {options.length === 0 && (
        <div className="flex flex-col items-center justify-center py-4 px-3 border border-dashed rounded-md bg-white dark:bg-black border-gray-300 dark:border-gray-800">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">No steps added yet</p>
          <Button onClick={onAddOption} variant="outline" size="sm" className="h-7 px-2 text-xs">
            <Plus className="h-3 w-3 mr-1" /> Add First Step
          </Button>
        </div>
      )}
    </div>
  );
}