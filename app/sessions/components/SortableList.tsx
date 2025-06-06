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
import { motion } from 'framer-motion';

export interface Item {
  id: string;
  text: string;
}

interface SortableListProps {
  items: Item[];
  onChange: (newItems: Item[]) => void;
  disabled?: boolean;
  showAnimation?: boolean;
  chainReactionIndex?: number;
  isChainReactionActive?: boolean;
}

function SortableItem({
  id,
  text,
  disabled,
  showAnimation,
  isCurrentlyMoving,
  chainReactionIndex,
}: Item & {
  disabled?: boolean;
  showAnimation?: boolean;
  isCurrentlyMoving?: boolean;
  chainReactionIndex?: number;
}) {
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

  const Component = showAnimation && !isDragging ? motion.div : 'div';

  const motionProps =
    showAnimation && !isDragging
      ? {
          layout: true,
          initial: {
            opacity: 0,
            scale: 0.8,
            rotateX: -15,
            y: -20,
          },
          animate: {
            opacity: 1,
            scale: 1,
            rotateX: 0,
            y: 0,
            transition: {
              type: 'spring',
              stiffness: 400,
              damping: 25,
              opacity: { duration: 0.3 },
              scale: { duration: 0.4 },
              rotateX: { duration: 0.5 },
              y: { duration: 0.6 },
            },
          },
          whileHover: disabled
            ? {}
            : {
                scale: 1.02,
                rotateY: 2,
                transition: { duration: 0.2 },
              },
          transition: {
            layout: {
              duration: 0.8,
              ease: [0.25, 0.46, 0.45, 0.94],
              type: 'spring',
              stiffness: 300,
              damping: 20,
            },
          },
        }
      : {};

  return (
    <Component
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition: isDragging ? 'none' : transition,
        zIndex: isDragging ? 10 : 1,
        transformStyle: 'preserve-3d',
      }}
      className={`flex items-center p-3 mb-2 bg-black bg-opacity-40 text-white rounded ${
        !disabled ? 'cursor-move' : 'cursor-not-allowed'
      } border touch-none ${
        isDragging
          ? 'border-[rgb(198,234,132)]/60 shadow-lg'
          : disabled
          ? 'border-white/5 opacity-80'
          : isCurrentlyMoving
          ? 'border-[rgb(198,234,132)]/80 shadow-lg shadow-[rgb(198,234,132)]/20 ring-2 ring-[rgb(198,234,132)]/40'
          : 'border-white/10'
      } ${showAnimation ? 'relative overflow-hidden' : ''}`}
      {...attributes}
      {...listeners}
      {...motionProps}
    >
      <GripVertical
        className={`mr-2 ${
          disabled ? 'text-gray-500' : 'text-[rgb(198,234,132)]'
        }`}
      />
      <span className='flex-1'>{text}</span>
      {isDragging && (
        <div className='absolute inset-0 rounded bg-[rgb(198,234,132)]/5 border border-[rgb(198,234,132)]/20'></div>
      )}
      {showAnimation && !isDragging && (
        <>
          {/* Hiệu ứng gradient sweep */}
          <motion.div
            className='absolute inset-0 rounded bg-gradient-to-r from-[rgb(198,234,132)]/5 to-[rgb(213,189,255)]/5 pointer-events-none'
            initial={{ opacity: 0, x: -100 }}
            animate={{ opacity: [0, 0.4, 0], x: [100, 0, 100] }}
            transition={{ duration: 1.8, ease: 'easeInOut' }}
          />

          {/* Hiệu ứng chain reaction - pulse khi di chuyển */}
          <motion.div
            className={`absolute inset-0 rounded border-2 pointer-events-none ${
              isCurrentlyMoving
                ? 'border-[rgb(198,234,132)]/60'
                : 'border-[rgb(198,234,132)]/30'
            }`}
            initial={{ opacity: 0, scale: 1 }}
            animate={{
              opacity: isCurrentlyMoving ? [0, 0.8, 0] : [0, 0.6, 0],
              scale: isCurrentlyMoving ? [1, 1.08, 1] : [1, 1.05, 1],
            }}
            transition={{
              duration: isCurrentlyMoving ? 0.8 : 1.2,
              ease: 'easeInOut',
              delay: 0.2,
              repeat: isCurrentlyMoving ? Infinity : 0,
            }}
          />

          {/* Hiệu ứng sparkle */}
          <motion.div
            className={`absolute top-1 right-1 w-2 h-2 bg-[rgb(198,234,132)] rounded-full pointer-events-none ${
              isCurrentlyMoving ? 'w-3 h-3' : ''
            }`}
            initial={{ opacity: 0, scale: 0 }}
            animate={{
              opacity: [0, 1, 0],
              scale: isCurrentlyMoving ? [0, 2, 0] : [0, 1.5, 0],
              rotate: [0, 180, 360],
            }}
            transition={{
              duration: isCurrentlyMoving ? 0.6 : 1.0,
              ease: 'easeInOut',
              delay: 0.4,
              repeat: isCurrentlyMoving ? Infinity : 0,
            }}
          />

          {/* Hiệu ứng đặc biệt cho phần tử đang di chuyển */}
          {isCurrentlyMoving && (
            <>
              {/* Indicator số thứ tự */}
              <motion.div
                className='absolute -top-2 -left-2 w-6 h-6 bg-[rgb(198,234,132)] text-black rounded-full flex items-center justify-center text-xs font-bold pointer-events-none'
                initial={{ scale: 0, rotate: -180 }}
                animate={{
                  scale: [0, 1.2, 1],
                  rotate: [180, 0],
                }}
                transition={{
                  duration: 0.5,
                  ease: 'easeOut',
                }}
              >
                {(chainReactionIndex ?? 0) + 1}
              </motion.div>

              {/* Hiệu ứng sóng lan tỏa */}
              <motion.div
                className='absolute inset-0 rounded bg-[rgb(198,234,132)]/10 pointer-events-none'
                initial={{ scale: 1, opacity: 0 }}
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0, 0.3, 0],
                }}
                transition={{
                  duration: 1.5,
                  ease: 'easeInOut',
                  repeat: Infinity,
                }}
              />
            </>
          )}
        </>
      )}
    </Component>
  );
}

export const SortableList: React.FC<SortableListProps> = ({
  items,
  onChange,
  disabled = false,
  showAnimation = false,
  chainReactionIndex,
  isChainReactionActive,
}) => {
  const isMobile = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: isMobile ? 8 : 4,
        delay: isMobile ? 100 : 0,
        tolerance: isMobile ? 5 : 0,
      },
    }),
    useSensor(TouchSensor, {
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
        {items.map((i, index) => (
          <SortableItem
            key={i.id}
            id={i.id}
            text={i.text}
            disabled={disabled}
            showAnimation={showAnimation}
            isCurrentlyMoving={
              isChainReactionActive && index === chainReactionIndex
            }
            chainReactionIndex={chainReactionIndex}
          />
        ))}
      </SortableContext>
    </DndContext>
  );
};
