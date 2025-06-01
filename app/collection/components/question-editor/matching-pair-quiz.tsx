import React from 'react';
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
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface MatchingPair {
  id: string;
  leftText: string;
  rightText: string;
  isCorrect?: boolean;
}

interface MatchingPairQuizProps {
  pairs: MatchingPair[];
  onPairsChange: (pairs: MatchingPair[]) => void;
  onAddPair: () => void;
  onDeletePair: (index: number) => void;
  onReorderPairs: (startIndex: number, endIndex: number) => void;
}

// Sortable item component
function SortablePairItem({
  pair,
  index,
  onPairChange,
  onDelete,
}: {
  pair: MatchingPair;
  index: number;
  onPairChange: (
    index: number,
    field: 'leftText' | 'rightText',
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
  } = useSortable({ id: pair.id });

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
        className="flex-shrink-0 w-8 h-8 rounded-md flex items-center justify-center bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 cursor-grab"
      >
        <GripVertical className="h-4 w-4" />
      </div>

      {/* Left Column Input */}
      <div className="flex-1">
        <Input
          value={pair.leftText}
          onChange={(e) => onPairChange(index, 'leftText', e.target.value)}
          placeholder="Left item"
          className="w-full"
        />
      </div>

      {/* Connector */}
      <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-primary/10 text-primary">
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
      <div className="flex-1">
        <Input
          value={pair.rightText}
          onChange={(e) => onPairChange(index, 'rightText', e.target.value)}
          placeholder="Right item"
          className="w-full"
        />
      </div>

      {/* Delete Button */}
      <Button
        variant="ghost"
        size="icon"
        className="flex-shrink-0 w-8 h-8 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={onDelete}
      >
        <Trash2 className="h-4 w-4 text-red-500" />
      </Button>
    </div>
  );
}

export function MatchingPairQuiz({
  pairs,
  onPairsChange,
  onAddPair,
  onDeletePair,
  onReorderPairs,
}: MatchingPairQuizProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handlePairChange = (
    index: number,
    field: 'leftText' | 'rightText',
    value: string
  ) => {
    const newPairs = [...pairs];
    newPairs[index] = { ...newPairs[index], [field]: value };
    onPairsChange(newPairs);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = pairs.findIndex((pair) => pair.id === active.id);
      const newIndex = pairs.findIndex((pair) => pair.id === over.id);

      onReorderPairs(oldIndex, newIndex);
    }
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
          <span>
            Create pairs by adding items to both columns. Students will need to
            match items from the left column with their corresponding items in
            the right column.
          </span>
        </div>
      </div>

      {/* Pairs Editor */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={pairs.map((pair) => pair.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-3">
            {pairs.map((pair, index) => (
              <SortablePairItem
                key={pair.id}
                pair={pair}
                index={index}
                onPairChange={handlePairChange}
                onDelete={() => onDeletePair(index)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* Add Pair Button */}
      <Button variant="outline" className="w-full" onClick={onAddPair}>
        <Plus className="h-4 w-4 mr-2" />
        Add Matching Pair
      </Button>
    </div>
  );
}
