'use client';

import React, { useEffect, useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { AnimationOrderItem } from './animation-order-item';
import type { SlideElementPayload } from '@/types/slideInterface';

interface AnimationOrderListProps {
  slideElements: SlideElementPayload[];
  onOrderChange: (updatedElements: SlideElementPayload[]) => void;
  slideId: string;
}

export const AnimationOrderList = ({
  slideElements,
  onOrderChange,
  slideId,
}: AnimationOrderListProps) => {
  const [items, setItems] = useState(slideElements);

  useEffect(() => {
    setItems(slideElements);
  }, [slideElements]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: any) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      setItems((items) => {
        const oldIndex = items.findIndex(
          (item) => item.slideElementId === active.id
        );
        const newIndex = items.findIndex(
          (item) => item.slideElementId === over.id
        );

        const newItems = arrayMove(items, oldIndex, newIndex).map(
          (item, index) => ({
            ...item,
            displayOrder: index,
          })
        );

        onOrderChange(newItems);
        return newItems;
      });
    }
  };

  return (
    <div className="p-4 bg-gray-50 rounded-lg">
      <h3 className="text-sm font-medium mb-3">Thứ tự xuất hiện</h3>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={items.map((item) => item.slideElementId)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2">
            {items.map((item) => (
              <AnimationOrderItem
                key={item.slideElementId}
                item={item}
                slideId={slideId}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
};
