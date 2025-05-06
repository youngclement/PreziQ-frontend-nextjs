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
  onOptionChange: (index: number, field: string, value: any) => void;
  onDeleteOption: (index: number) => void;
  onAddOption: () => void;
  onReorder?: (sourceIndex: number, destinationIndex: number) => void;
}

interface SortableItemProps {
  id: string;
  option: Option;
  index: number;
  onOptionChange: (index: number, field: string, value: any) => void;
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
        "flex items-center space-x-2 p-4 bg-white dark:bg-gray-800 border rounded-md mb-2.5 group transition-all",
        isDragging ? "shadow-lg border-primary/30 bg-primary/5 z-50" : "shadow-sm hover:border-gray-300 dark:hover:border-gray-600",
      )}
    >
      <div
        className="cursor-grab active:cursor-grabbing p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md text-gray-500"
        {...attributes}
        {...listeners}
      >
        <MoveVertical size={18} className="transition-colors group-hover:text-primary" />
      </div>
      <Input
        value={option.option_text}
        onChange={(e) => onOptionChange(index, 'option_text', e.target.value)}
        className="flex-1 border-gray-200 focus:ring-2 focus:ring-primary/20"
        placeholder={`Step ${index + 1}`}
        // Add onBlur to trigger immediate update when focus is lost
        onBlur={() => {
          // You can use this to trigger an immediate API update if needed
          console.log("Value updated and saved:", option.option_text);
        }}
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => onDeleteOption(index)}
        className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md h-10 w-10"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
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
  // Handle drag end event
  // In app/collection/components/question-editor/reorder-options.tsx
  // Update the handleDragEnd function to ensure it calls the API after reordering:

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
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-1">
        <Label className="flex items-center text-base font-medium">
          <Move className="mr-2 h-4 w-4 text-muted-foreground" />
          Reorder Steps
        </Label>
        <Button
          size="sm"
          variant="outline"
          onClick={onAddOption}
          className="text-sm font-medium text-primary hover:text-primary/90 hover:bg-primary/5"
        >
          <Plus className="h-3.5 w-3.5 mr-1" /> Add Step
        </Button>
      </div>

      <p className="text-sm text-muted-foreground mb-3">
        Drag and drop to reorder steps. The order here will be the correct sequence for the question.
      </p>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={options.map(option => `option-${option.display_order}`)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-0.5">
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
        <div className="flex flex-col items-center justify-center p-8 border border-dashed rounded-md bg-gray-50 dark:bg-gray-800/50">
          <p className="text-muted-foreground mb-4">No steps added yet</p>
          <Button onClick={onAddOption} variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-1" /> Add First Step
          </Button>
        </div>
      )}
    </div>
  );
}