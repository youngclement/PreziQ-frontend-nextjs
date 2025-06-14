'use client';

import { CSS } from '@dnd-kit/utilities';
import { useSortable } from '@dnd-kit/sortable';
import { GripVertical } from 'lucide-react';
import Image from 'next/image';
import type { SlideElementPayload } from '@/types/slideInterface';

interface AnimationOrderItemProps {
  item: SlideElementPayload;
  slideId: string;
  isSelected?: boolean;
}

export const AnimationOrderItem = ({
  item,
  slideId,
  isSelected,
}: AnimationOrderItemProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.slideElementId || `temp-${Date.now()}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    marginLeft: `${item.displayOrder * 12}px`, // Thụt lề theo displayOrder
  };

  // console.log('itemmmmmmmmm', item);

  let textContent = '';
  if (item.slideElementType === 'TEXT' && item.content) {
    try {
      const parsedContent = JSON.parse(item.content);
      textContent = parsedContent.text || 'Văn bản';
    } catch (error) {
      console.error('Error parsing content:', error);
      textContent = 'Văn bản';
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        flex items-center gap-2 p-2 bg-white rounded border
        ${isDragging ? 'border-blue-400 shadow-lg' : 'border-gray-200'}
        ${item.displayOrder === 0 ? 'ml-0' : `ml-${item.displayOrder * 4}`}
        ${isSelected ? 'border-red-500 bg-blue-50' : 'border-gray-200 bg-white'}
        relative
      `}
      {...attributes}
    >
      <div
        className="absolute -left-2 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-blue-400"
        style={{
          opacity: isDragging ? 0 : 1,
        }}
      />
      <button className="cursor-move hover:text-blue-500" {...listeners}>
        <GripVertical size={16} />
      </button>{' '}
      <div className="flex-1 text-sm">
        {item.slideElementType === 'TEXT' ? (
          textContent
        ) : item.slideElementType === 'IMAGE' && item.sourceUrl ? (
          <Image
            src={item.sourceUrl}
            alt="Slide element"
            width={32}
            height={32}
            className="h-8 w-8 object-contain"
          />
        ) : (
          'Phần tử khác'
        )}
      </div>{' '}
      <div className="text-xs text-gray-500 text-right">
        <div>{item.entryAnimation || 'Không có hiệu ứng'}</div>
        {item.entryAnimation && item.entryAnimation !== 'none' && (
          <>
            <div className="text-xs text-gray-400 mt-0.5">
              {item.entryAnimationDuration
                ? `${item.entryAnimationDuration}s`
                : '1.0s'}
            </div>
            {item.entryAnimationDelay && item.entryAnimationDelay > 0 && (
              <div className="text-xs text-red-500 mt-0.5">
                Trễ: {item.entryAnimationDelay.toFixed(1)}s
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
