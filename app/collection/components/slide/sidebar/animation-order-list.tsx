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
    
      if (!over) return; // Nếu không có đích (over), bỏ qua
    
      // Hàm kiểm tra xem element có phải là duy nhất với displayOrder cao nhất
      const isOnlyMaxLevelElement = (items: SlideElementPayload[], activeId: string) => {
        const maxLevel = Math.max(...items.map((item) => item.displayOrder));
        const maxLevelItems = items.filter((item) => item.displayOrder === maxLevel);
        return maxLevelItems.length === 1 && maxLevelItems[0].slideElementId === activeId;
      };
    
      if (active.id === over.id) {
        const activeRect = event.active.rect.current.translated;
        const overRect = event.over.rect;
        const xDiff = activeRect.left - overRect.left;
    
        // Chỉ xử lý khi kéo ngang đủ xa (> 10px)
        if (Math.abs(xDiff) > 10) {
          setItems((items) => {
            const index = items.findIndex((item) => item.slideElementId === active.id);
            const currentItem = items[index];
    
            // Tìm cấp cao nhất hiện tại
            const maxCurrentLevel = Math.max(...items.map((item) => item.displayOrder));
    
            // Nếu element là duy nhất ở cấp cao nhất và kéo sang phải (tăng cấp), chặn
            if (isOnlyMaxLevelElement(items, active.id) && xDiff > 0) {
              return items; // Không thay đổi
            }
    
            // Tính toán cấp mới dựa trên khoảng cách kéo
            const levelChange = Math.floor(xDiff / 30);
            const proposedNewLevel = currentItem.displayOrder + levelChange;
    
            // Giới hạn cấp mới: không vượt quá maxCurrentLevel + 1
            const newLevel = Math.min(
              Math.max(0, proposedNewLevel), // Không cho phép âm
              maxCurrentLevel + 1 // Giới hạn cấp tối đa
            );
    
            const newItems = items.map((item) => {
              if (item.slideElementId === active.id) {
                return { ...item, displayOrder: newLevel };
              }
              return item;
            });
    
            // Sắp xếp lại items theo displayOrder
            newItems.sort((a, b) => a.displayOrder - b.displayOrder);
            console.log('Updated items:', newItems);
            onOrderChange(newItems);
            return newItems;
          });
        }
        return;
      }
    
      if (active.id !== over.id) {
        setItems((items) => {
          const oldIndex = items.findIndex((item) => item.slideElementId === active.id);
          const newIndex = items.findIndex((item) => item.slideElementId === over.id);
    
          const activeItem = items[oldIndex];
          const overItem = items[newIndex];
    
          // Tìm cấp cao nhất hiện tại
          const maxCurrentLevel = Math.max(...items.map((item) => item.displayOrder));
    
          // Tính toán khoảng cách X và Y giữa 2 item
          const activeRect = event.active.rect.current.translated;
          const overRect = event.over.rect;
          const xDiff = activeRect.left - overRect.left;
          const yDiff = Math.abs(activeRect.top - overRect.top);
    
          let newItems = arrayMove(items, oldIndex, newIndex);
    
          if (Math.abs(xDiff) > 30) {
            // Kéo ngang: thay đổi displayOrder
            // Nếu element là duy nhất ở cấp cao nhất và kéo sang phải, chặn
            if (isOnlyMaxLevelElement(items, active.id) && xDiff > 0) {
              return items; // Không thay đổi
            }
    
            const levelChange = Math.floor(xDiff / 30);
            const proposedNewLevel = overItem.displayOrder + levelChange;
    
            // Giới hạn cấp mới: không vượt quá maxCurrentLevel + 1
            const newLevel = Math.min(
              Math.max(0, proposedNewLevel), // Không cho phép âm
              maxCurrentLevel + 1 // Giới hạn cấp tối đa
            );
    
            newItems = newItems.map((item) => {
              if (item.slideElementId === active.id) {
                return { ...item, displayOrder: newLevel };
              }
              return item;
            });
          } else if (yDiff < 20) {
            // Kéo gần: set cùng displayOrder với item đích
            newItems = newItems.map((item) => {
              if (item.slideElementId === active.id) {
                return { ...item, displayOrder: overItem.displayOrder };
              }
              return item;
            });
          } else {
            // Kéo dọc: cập nhật displayOrder dựa trên vị trí mới
            const targetOrder = overItem.displayOrder;
    
            if (newIndex < oldIndex) {
              // Kéo lên trên
              newItems = newItems.map((item) => {
                if (item.slideElementId === active.id) {
                  // Item được kéo nhận displayOrder của item đích
                  return { ...item, displayOrder: targetOrder };
                } else if (
                  item.displayOrder >= targetOrder &&
                  item.displayOrder < activeItem.displayOrder
                ) {
                  // Các item ở giữa tăng displayOrder lên 1, nhưng không vượt quá maxCurrentLevel + 1
                  return { ...item, displayOrder: Math.min(item.displayOrder + 1, maxCurrentLevel + 1) };
                }
                return item;
              });
            } else {
              // Kéo xuống dưới
              newItems = newItems.map((item) => {
                if (item.slideElementId === active.id) {
                  // Item được kéo nhận displayOrder của item đích
                  return { ...item, displayOrder: targetOrder };
                } else if (
                  item.displayOrder <= targetOrder &&
                  item.displayOrder > activeItem.displayOrder
                ) {
                  // Các item ở giữa giảm displayOrder xuống 1
                  return { ...item, displayOrder: Math.max(item.displayOrder - 1, 0) };
                }
                return item;
              });
            }
          }
    
          // Sắp xếp lại items theo displayOrder
          newItems.sort((a, b) => a.displayOrder - b.displayOrder);
          console.log('Updated items:', newItems);
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
