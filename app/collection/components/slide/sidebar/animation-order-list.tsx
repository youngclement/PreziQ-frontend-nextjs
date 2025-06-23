'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  UniqueIdentifier,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { AnimationOrderItem } from './animation-order-item';
import type { SlideElementPayload } from '@/types/slideInterface';
import { Layers, Info, ChevronDown, ChevronUp } from 'lucide-react';
// Define interface for custom events
export interface SlideElementEvent extends CustomEvent {
  detail: {
    slideId: string;
    element: SlideElementPayload;
    elements?: SlideElementPayload[];
    objectId: string;
  };
}

declare global {
  interface WindowEventMap {
    'slide:element:created': SlideElementEvent;
    'slide:element:updated': SlideElementEvent;
    'slide:elements:changed': SlideElementEvent;
  }
}

interface AnimationOrderListProps {
  slideElements: SlideElementPayload[] | undefined;
  onOrderChange: (updatedElements: SlideElementPayload[]) => void;
  slideId: string;
}

export const AnimationOrderList = ({
  slideElements = [],
  onOrderChange,
  slideId,
}: AnimationOrderListProps) => {
  const [items, setItems] = useState<SlideElementPayload[]>(slideElements);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(
    null
  );
  const [isCollapsed, setIsCollapsed] = useState(false);

  const updateItemsWithAnimation = useCallback(
    (objectId: string, animationName: string) => {
      setItems((prev) =>
        prev.map((item) =>
          item.slideElementId === objectId
            ? { ...item, entryAnimation: animationName }
            : item
        )
      );
    },
    []
  );

  useEffect(() => {
    setItems([...slideElements]);
  }, [slideElements, slideId]);

  useEffect(() => {
    const handleSelectionChanged = (
      e: CustomEvent<{
        slideId: string;
        objectId: string | null;
        animationName: string;
      }>
    ) => {
      if (e.detail.slideId !== slideId) return;

      setSelectedElementId(e.detail.objectId);
      if (e.detail.objectId && e.detail.animationName) {
        updateItemsWithAnimation(e.detail.objectId, e.detail.animationName);
      }
    };

    const handleElementCreated = (e: SlideElementEvent) => {
      if (e.detail.slideId !== slideId) return;

      setItems((prev) => {
        const newItems = [...prev, e.detail.element];
        const sortedItems = newItems.sort(
          (a, b) => a.displayOrder - b.displayOrder
        );
        onOrderChange(sortedItems);
        return sortedItems;
      });
    };

    const handleElementsChanged = (e: SlideElementEvent) => {
      if (e.detail.slideId !== slideId) return;

      if (!Array.isArray(e.detail.elements)) {
        console.warn(
          'Invalid slide:elements:changed event: elements is not an array'
        );
        return;
      }

      if (e.detail.elements) {
        const sortedElements = e.detail.elements.sort(
          (a, b) => a.displayOrder - b.displayOrder
        );
        setItems(sortedElements);
        onOrderChange(sortedElements);
      }
    };

    window.addEventListener(
      'fabric:selection-changed',
      handleSelectionChanged as EventListener
    );
    window.addEventListener('slide:element:created', handleElementCreated);
    window.addEventListener('slide:elements:changed', handleElementsChanged);

    return () => {
      window.removeEventListener(
        'fabric:selection-changed',
        handleSelectionChanged as EventListener
      );
      window.removeEventListener('slide:element:created', handleElementCreated);
      window.removeEventListener(
        'slide:elements:changed',
        handleElementsChanged
      );
    };
  }, [slideId, updateItemsWithAnimation, onOrderChange]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require slight movement to initiate drag
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const hasValidLevelGap = (
    newItems: SlideElementPayload[],
    activeId: string
  ) => {
    const sortedItems = [...newItems].sort(
      (a, b) => a.displayOrder - b.displayOrder
    );
    const uniqueOrders = Array.from(
      new Set(sortedItems.map((item) => item.displayOrder))
    );
    for (let i = 0; i < uniqueOrders.length - 1; i++) {
      if (uniqueOrders[i + 1] - uniqueOrders[i] > 1) {
        return false;
      }
    }
    return true;
  };

  const handleDragEnd = (event: any) => {
    const { active, over } = event;

    if (!over) return;

    const isOnlyMaxLevelElement = (
      items: SlideElementPayload[],
      activeId: string
    ) => {
      const maxLevel = Math.max(...items.map((item) => item.displayOrder));
      const maxLevelItems = items.filter(
        (item) => item.displayOrder === maxLevel
      );
      return (
        maxLevelItems.length === 1 &&
        maxLevelItems[0].slideElementId === activeId
      );
    };

    if (active.id === over.id) {
      const activeRect = event.active.rect.current.translated;
      const overRect = event.over.rect;
      const xDiff = activeRect.left - overRect.left;

      if (Math.abs(xDiff) > 10) {
        setItems((items) => {
          const index = items.findIndex(
            (item) => item.slideElementId === active.id
          );
          const currentItem = items[index];
          const maxCurrentLevel = Math.max(
            ...items.map((item) => item.displayOrder)
          );

          if (isOnlyMaxLevelElement(items, active.id) && xDiff > 0) {
            return items;
          }

          const levelChange = Math.floor(xDiff / 30);
          const proposedNewLevel = currentItem.displayOrder + levelChange;
          const newLevel = Math.min(
            Math.max(0, proposedNewLevel),
            maxCurrentLevel + 1
          );

          let newItems = items.map((item) => {
            if (item.slideElementId === active.id) {
              return { ...item, displayOrder: newLevel };
            }
            return item;
          });

          if (!hasValidLevelGap(newItems, active.id)) {
            const uniqueOrders = Array.from(
              new Set(newItems.map((item) => item.displayOrder))
            ).sort((a, b) => a - b);
            const orderMap = new Map<number, number>();
            uniqueOrders.forEach((order, idx) => {
              orderMap.set(order, idx);
            });

            newItems = newItems.map((item) => ({
              ...item,
              displayOrder: orderMap.get(item.displayOrder)!,
            }));
          }

          newItems.sort((a, b) => a.displayOrder - b.displayOrder);
          onOrderChange(newItems);
          return newItems;
        });
      }
      return;
    }

    if (active.id !== over.id) {
      setItems((items) => {
        const oldIndex = items.findIndex(
          (item) => item.slideElementId === active.id
        );
        const newIndex = items.findIndex(
          (item) => item.slideElementId === over.id
        );
        const activeItem = items[oldIndex];
        const overItem = items[newIndex];
        const maxCurrentLevel = Math.max(
          ...items.map((item) => item.displayOrder)
        );
        const activeRect = event.active.rect.current.translated;
        const overRect = event.over.rect;
        const xDiff = activeRect.left - overRect.left;
        const yDiff = Math.abs(activeRect.top - overRect.top);

        let newItems = arrayMove(items, oldIndex, newIndex);

        if (Math.abs(xDiff) > 30) {
          if (isOnlyMaxLevelElement(items, active.id) && xDiff > 0) {
            return items;
          }

          const levelChange = Math.floor(xDiff / 30);
          const proposedNewLevel = overItem.displayOrder + levelChange;
          const newLevel = Math.min(
            Math.max(0, proposedNewLevel),
            maxCurrentLevel + 1
          );

          newItems = newItems.map((item) => {
            if (item.slideElementId === active.id) {
              return { ...item, displayOrder: newLevel };
            }
            return item;
          });
        } else if (yDiff < 20) {
          newItems = newItems.map((item) => {
            if (item.slideElementId === active.id) {
              return { ...item, displayOrder: overItem.displayOrder };
            }
            return item;
          });
        } else {
          const targetOrder = overItem.displayOrder;

          if (newIndex < oldIndex) {
            newItems = newItems.map((item) => {
              if (item.slideElementId === active.id) {
                return { ...item, displayOrder: targetOrder };
              } else if (
                item.displayOrder >= targetOrder &&
                item.displayOrder < activeItem.displayOrder
              ) {
                return {
                  ...item,
                  displayOrder: Math.min(
                    item.displayOrder + 1,
                    maxCurrentLevel + 1
                  ),
                };
              }
              return item;
            });
          } else {
            newItems = newItems.map((item) => {
              if (item.slideElementId === active.id) {
                return { ...item, displayOrder: targetOrder };
              } else if (
                item.displayOrder <= targetOrder &&
                item.displayOrder > activeItem.displayOrder
              ) {
                return {
                  ...item,
                  displayOrder: Math.max(item.displayOrder - 1, 0),
                };
              }
              return item;
            });
          }
        }

        if (!hasValidLevelGap(newItems, active.id)) {
          const uniqueOrders = Array.from(
            new Set(newItems.map((item) => item.displayOrder))
          ).sort((a, b) => a - b);
          const orderMap = new Map<number, number>();
          uniqueOrders.forEach((order, idx) => {
            orderMap.set(order, idx);
          });

          newItems = newItems.map((item) => ({
            ...item,
            displayOrder: orderMap.get(item.displayOrder)!,
          }));
        }

        newItems.sort((a, b) => a.displayOrder - b.displayOrder);

        onOrderChange(newItems);
        return newItems;
      });
    }
  };

  return (
    <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
              <Layers className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Animation Timeline
              </h3>
              <p className="text-sm text-gray-500">
                {items.length} elements
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              {isCollapsed ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronUp className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Help Text */}
      {!isCollapsed && items.length === 0 && (
        <div className="p-8 text-center">
          <div className="flex items-center justify-center w-16 h-16 bg-gray-200 rounded-full mx-auto mb-4">
            <Info className="w-8 h-8 text-gray-400" />
          </div>
          <h4 className="text-lg font-medium text-gray-900 mb-2">
            No elements yet
          </h4>
          <p className="text-gray-500 max-w-sm mx-auto">
            Add elements to your slide to see them appear here. You can then
            drag to reorder and adjust animation timing.
          </p>
        </div>
      )}

      {/* Content */}
      {!isCollapsed && items.length > 0 && (
        <div className="p-4">
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-xl">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Drag & Drop Tips:</p>
                <ul className="text-xs space-y-1 text-blue-700">
                  <li>• Drag vertically to reorder elements</li>
                  <li>• Drag horizontally to change hierarchy levels</li>
                  <li>• Elements with the same level will animate together</li>
                </ul>
              </div>
            </div>
          </div>

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={items
                .filter((item) => item.slideElementId)
                .map((item) => item.slideElementId as UniqueIdentifier)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-3">
                {items?.map((item) => (
                  <AnimationOrderItem
                    key={item.slideElementId}
                    item={item}
                    slideId={slideId}
                    isSelected={item.slideElementId === selectedElementId}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      )}
    </div>
  );
}