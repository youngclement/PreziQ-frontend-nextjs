// Update app/collection/components/question-editor/reorder-options.tsx
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
import { Plus, GripVertical } from 'lucide-react';

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
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center space-x-2 p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md mb-2"
    >
      <button
        className="cursor-grab active:cursor-grabbing p-1 text-gray-500"
        {...attributes}
        {...listeners}
      >
        <GripVertical size={16} />
      </button>
      <Input
        value={option.option_text}
        onChange={(e) => onOptionChange(index, 'option_text', e.target.value)}
        className="flex-1"
        placeholder={`Step ${index + 1}`}
      />
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => onDeleteOption(index)}
        className="text-red-500 hover:text-red-700 hover:bg-red-100"
      >
        &times;
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
  const handleDragEnd = (result: DragEndEvent) => {
    const { active, over } = result;

    if (over && active.id !== over.id) {
      const oldIndex = options.findIndex(option => `option-${option.display_order}` === active.id);
      const newIndex = options.findIndex(option => `option-${option.display_order}` === over.id);

      if (oldIndex !== -1 && newIndex !== -1 && onReorder) {
        console.log(`Reordering from ${oldIndex} to ${newIndex}`);
        onReorder(oldIndex, newIndex);
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
      <div className="flex justify-between items-center">
        <Label className="text-sm font-medium">Arrange Steps in Correct Order</Label>
        <Button
          type="button"
          size="sm"
          onClick={onAddOption}
          className="bg-indigo-500 hover:bg-indigo-600 text-white"
        >
          <Plus size={16} className="mr-1" /> Add Step
        </Button>
      </div>

      <div className="py-2">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={options.map(option => `option-${option.display_order}`)}
            strategy={verticalListSortingStrategy}
          >
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
          </SortableContext>
        </DndContext>
      </div>

      {options.length === 0 && (
        <div className="text-center p-4 border border-dashed border-gray-300 dark:border-gray-700 rounded-md">
          <p className="text-sm text-gray-500 dark:text-gray-400">No steps added yet</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onAddOption}
            className="mt-2"
          >
            <Plus size={16} className="mr-1" /> Add Step
          </Button>
        </div>
      )}
    </div>
  );
}