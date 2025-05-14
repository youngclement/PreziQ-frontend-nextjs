'use client';

import React, { useMemo } from 'react';
import {
  DndContext,
  DragEndEvent,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  TouchSensor,
  KeyboardSensor,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import {
  restrictToVerticalAxis,
  restrictToWindowEdges,
} from '@dnd-kit/modifiers';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';

export interface Item {
  id: string;
  text: string;
}

interface SortableListProps {
  items: Item[];
  onChange: (newItems: Item[]) => void;
  disabled?: boolean;
}

function SortableItem({ id, text, disabled }: Item & { disabled?: boolean }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id,
    disabled,
    transition: {
      duration: 200,
      easing: 'cubic-bezier(0.25, 1, 0.5, 1)',
    },
  });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 10 : 1,
      }}
      className={`flex items-center p-3 mb-2 bg-gradient-to-r from-[#0e2838]/90 to-[#0f2231]/90 text-white rounded ${
        !disabled ? 'cursor-move' : 'cursor-not-allowed'
      } border touch-none ${
        isDragging
          ? 'border-[#aef359]/60 shadow-lg'
          : disabled
          ? 'border-white/5 opacity-80'
          : 'border-white/10'
      }`}
      {...attributes}
      {...listeners}
    >
      <GripVertical
        className={`mr-2 ${disabled ? 'text-gray-500' : 'text-[#aef359]'}`}
      />
      <span className='flex-1'>{text}</span>
      {isDragging && (
        <div className='absolute inset-0 rounded bg-[#aef359]/5 border border-[#aef359]/20'></div>
      )}
    </div>
  );
}

export const SortableList: React.FC<SortableListProps> = ({
  items,
  onChange,
  disabled = false,
}) => {
  const isMobile = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      // Cấu hình tốt hơn cho cả desktop và mobile
      activationConstraint: {
        distance: isMobile ? 8 : 4, // Khoảng cách nhỏ hơn cho desktop
        delay: isMobile ? 100 : 0, // Độ trễ nhỏ cho mobile để phân biệt với tap
        tolerance: isMobile ? 5 : 0, // Dung sai cao hơn cho mobile
      },
    }),
    useSensor(TouchSensor, {
      // Cấu hình riêng cho cảm ứng
      activationConstraint: {
        delay: 100,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  function handleDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex((i) => i.id === active.id);
      const newIndex = items.findIndex((i) => i.id === over.id);
      onChange(arrayMove(items, oldIndex, newIndex));
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
      modifiers={[restrictToVerticalAxis, restrictToWindowEdges]}
    >
      <SortableContext
        items={items.map((i) => i.id)}
        strategy={verticalListSortingStrategy}
      >
        {items.map((i) => (
          <SortableItem
            key={i.id}
            id={i.id}
            text={i.text}
            disabled={disabled}
          />
        ))}
      </SortableContext>
    </DndContext>
  );
};
