'use client';

import { CSS } from '@dnd-kit/utilities';
import { useSortable } from '@dnd-kit/sortable';
import { GripVertical } from 'lucide-react';
import Image from 'next/image';
import type { SlideElementPayload } from '@/types/slideInterface';
import { useLanguage } from '@/contexts/language-context';
import { useTheme } from 'next-themes';
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

  const { theme } = useTheme();

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition || 'all 0.2s ease', // Smooth transition for drag
    marginLeft: `${item.displayOrder * 16}px`, // Increased indent for clarity
  };

  let textContent = '';
  if (item.slideElementType === 'TEXT' && item.content) {
    try {
      const parsedContent = JSON.parse(item.content);
      textContent = parsedContent.text || 'Text Element';
    } catch (error) {
      console.error('Error parsing content:', error);
      textContent = 'Text Element';
    }
  }
  const { t } = useLanguage();

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        flex items-center gap-3 p-3 rounded-lg border
        ${
          isDragging
            ? 'border-blue-500 dark:border-blue-400 shadow-md z-10'
            : 'border-gray-200 dark:border-gray-700'
        }
        ${
          isSelected
            ? 'border-blue-600 dark:border-blue-400 bg-blue-100 dark:bg-blue-950/50'
            : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
        }
        hover:bg-gray-50 dark:hover:bg-gray-700 hover:shadow-md hover:scale-[1.02]
        transition-all duration-200 relative group
      `}
      {...attributes}
      role="listitem" // Accessibility: Indicate list item
      aria-label={`Slide element: ${textContent || item.slideElementType}`}
    >
      {/* Drag handle with tooltip */}
      <button
        className="cursor-grab hover:text-blue-600 dark:hover:text-blue-400 active:cursor-grabbing"
        {...listeners}
        aria-label="Drag to reorder"
        title="Drag to reorder" // Tooltip for better UX
      >
        <GripVertical size={18} className="text-gray-500 dark:text-gray-400" />
      </button>
      {/* Visual indicator for nesting level */}
      <div
        className="absolute -left-3 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-blue-500 dark:bg-blue-400"
        style={{ opacity: isDragging ? 1 : 0 }}
      />
      {/* Content area with improved typography */}
      <div className="flex-1 text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
        {item.slideElementType === 'TEXT' ? (
          textContent
        ) : item.slideElementType === 'IMAGE' && item.sourceUrl ? (
          <Image
            src={item.sourceUrl}
            alt="Slide element"
            width={40}
            height={40}
            className="h-10 w-10 object-contain rounded"
          />
        ) : (
          'Other Element'
        )}
      </div>
      {/* Animation details with hover tooltip */}
      <div
        className="text-xs text-gray-600 dark:text-gray-400 text-right space-y-1"
        title={`Animation: ${item.entryAnimation || 'None'}`}
      >
        <div className="font-medium">
          {item.entryAnimation != 'none' && item.entryAnimation
            ? item?.entryAnimation
            : t('activity.slide.noAnimation')}
        </div>
        {item.entryAnimation && item.entryAnimation !== 'none' && (
          <div className="flex gap-1.5">
            <span
              className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400"
              title={`Duration: ${item.entryAnimationDuration || 1.0}s`}
            >
              {item.entryAnimationDuration
                ? `${item.entryAnimationDuration}s`
                : '1.0s'}
            </span>
            {item.entryAnimationDelay && item.entryAnimationDelay > 0 && (
              <span
                className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400"
                title={`Delay: ${item.entryAnimationDelay.toFixed(1)}s`}
              >
                {item.entryAnimationDelay.toFixed(1)}s
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
