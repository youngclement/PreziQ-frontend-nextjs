'use client';

import { useState, useEffect, useRef } from 'react';
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

interface MatchingPairSettingsProps {
  options: QuizOption[];
  onOptionsChange: (options: QuizOption[]) => void;
  onAddPair: () => void;
  onDeletePair: (index: number) => void;
  onReorderPairs: (startIndex: number, endIndex: number) => void;
  onUpdateMatchingPairOptions?: (
    questionIndex: number,
    newOptions: QuizOption[]
  ) => void;
}

function SortablePairItem({
  option,
  index,
  onOptionChange,
  onDelete,
}: {
  option: QuizOption;
  index: number;
  onOptionChange: (
    index: number,
    field: 'left_text' | 'right_text',
    value: string
  ) => void;
  onDelete: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: option.id || `pair-${index}`,
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
          Left Item
        </Label>
        <Input
          id={`left-item-${index}`}
          placeholder="Enter left item text"
          value={option.left_text || ''}
          onChange={(e) => onOptionChange(index, 'left_text', e.target.value)}
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
          Right Item
        </Label>
        <Input
          id={`right-item-${index}`}
          placeholder="Enter right item text"
          value={option.right_text || ''}
          onChange={(e) => onOptionChange(index, 'right_text', e.target.value)}
          className="w-full"
        />
      </div>

      {/* Delete Button */}
      <Button
        variant="ghost"
        size="icon"
        className="flex-shrink-0 w-8 h-8 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-100 dark:hover:bg-red-900/20"
        onClick={onDelete}
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
  onUpdateMatchingPairOptions,
}: MatchingPairSettingsProps) {
  const [localOptions, setLocalOptions] = useState(options);
  const isDraggingRef = useRef(false);

  // Chỉ cập nhật localOptions khi options thay đổi từ bên ngoài
  // và KHÔNG đang trong quá trình drag
  useEffect(() => {
    if (isDraggingRef.current) {
      return; // Không cập nhật khi đang drag
    }

    // Kiểm tra xem có thay đổi thực sự không
    const hasChanged =
      options.length !== localOptions.length ||
      options.some((opt, index) => {
        const localOpt = localOptions[index];
        return (
          !localOpt ||
          opt.id !== localOpt.id ||
          opt.left_text !== localOpt.left_text ||
          opt.right_text !== localOpt.right_text ||
          opt.display_order !== localOpt.display_order
        );
      });

    if (hasChanged) {
      setLocalOptions(options);
    }
  }, [options]); // Loại bỏ localOptions khỏi dependency array

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Yêu cầu kéo ít nhất 8px để bắt đầu drag
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
      const oldIndex = localOptions.findIndex(
        (opt) => (opt.id || `pair-${localOptions.indexOf(opt)}`) === active.id
      );
      const newIndex = localOptions.findIndex(
        (opt) => (opt.id || `pair-${localOptions.indexOf(opt)}`) === over.id
      );

      if (oldIndex !== -1 && newIndex !== -1) {
        const newOptions = arrayMove(localOptions, oldIndex, newIndex).map(
          (opt, index) => ({
            ...opt,
            display_order: index + 1,
          })
        );

        setLocalOptions(newOptions);
        onOptionsChange(newOptions);
      }
    }
  };

  const handleInputChange = (
    index: number,
    field: 'left_text' | 'right_text',
    value: string
  ) => {
    const newOptions = [...localOptions];
    if (newOptions[index]) {
      newOptions[index] = {
        ...newOptions[index],
        [field]: value,
      };
      setLocalOptions(newOptions);
      onOptionsChange(newOptions);
    }
  };

  const handleAddPair = () => {
    const pairId = `pair-${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 9)}`;
    const newOptions = [
      ...localOptions,
      {
        id: `left-${pairId}`,
        option_text: '',
        type: 'left',
        pair_id: pairId,
        is_correct: true,
        display_order: localOptions.length + 1,
      },
      {
        id: `right-${pairId}`,
        option_text: '',
        type: 'right',
        pair_id: pairId,
        is_correct: true,
        display_order: localOptions.length + 2,
      },
    ];
    setLocalOptions(newOptions);
    onOptionsChange(newOptions);
  };

  const handleDeletePair = (index: number) => {
    const newOptions = localOptions
      .filter((_, i) => i !== index)
      .map((opt, index) => ({
        ...opt,
        display_order: index + 1,
      }));

    setLocalOptions(newOptions);
    onOptionsChange(newOptions);
  };

  return (
    <div className="space-y-4">
      {/* Instructions */}
      <div className="p-3 bg-blue-50 dark:bg-blue-900/10 rounded-md border border-blue-100 dark:border-blue-800">
        <div className="flex items-start gap-2 text-sm text-blue-800 dark:text-blue-300">
          <div className="mt-0.5">
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
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
          </div>
          <div className="space-y-1">
            <p>
              Create pairs by adding items to both columns. Students will need
              to match items from the left column with their corresponding items
              in the right column.
            </p>
            <ul className="list-disc list-inside space-y-0.5 text-blue-700 dark:text-blue-400">
              <li>Each pair must have both a left and right item</li>
              <li>Drag and drop to reorder pairs</li>
              <li>All pairs are automatically marked as correct matches</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Pairs Editor */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={localOptions.map((opt, index) => opt.id || `pair-${index}`)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-3">
            {localOptions.map((option, index) => (
              <SortablePairItem
                key={option.id || `pair-${index}`}
                option={option}
                index={index}
                onOptionChange={handleInputChange}
                onDelete={() => handleDeletePair(index)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* Add Pair Button */}
      <Button
        variant="outline"
        className="w-full border-dashed hover:bg-gray-50 dark:hover:bg-gray-800/50"
        onClick={handleAddPair}
      >
        <Plus className="h-4 w-4 mr-2" />
        Add Matching Pair
      </Button>

      {/* Empty State */}
      {localOptions.length === 0 && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <p className="text-sm">No matching pairs yet.</p>
          <p className="text-xs mt-1">
            Click &quol;Add Matching Pair&quol; to get started.
          </p>
        </div>
      )}
    </div>
  );
}
