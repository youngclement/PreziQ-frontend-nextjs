'use client';

import { CSS } from '@dnd-kit/utilities';
import { useSortable } from '@dnd-kit/sortable';
import { GripVertical } from 'lucide-react';
import type { SlideElementPayload } from '@/types/slideInterface';

interface AnimationOrderItemProps {
  item: SlideElementPayload;
  slideId: string;
}

export const AnimationOrderItem = ({
  item,
  slideId,
}: AnimationOrderItemProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.slideElementId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    marginLeft: `${item.displayOrder * 12}px`, // Thụt lề theo displayOrder
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2 p-2 bg-white rounded border ${
        isDragging ? 'border-blue-400 shadow-lg' : 'border-gray-200'
      }`}
      {...attributes}
    >
      <button className="cursor-move hover:text-blue-500" {...listeners}>
        <GripVertical size={16} />
      </button>
      <div className="flex-1 text-sm">
        {item.slideElementType === 'TEXT'
          ? 'Văn bản'
          : item.slideElementType === 'IMAGE'
          ? 'Hình ảnh'
          : 'Phần tử khác'}
      </div>
      <div className="text-xs text-gray-500">
        {item.entryAnimation || 'Không có hiệu ứng'}
      </div>
    </div>
  );
};
