'use client';
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

  import React, { useEffect, useState, useCallback } from 'react';
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
    const [selectedElementId, setSelectedElementId] = useState<string | null>(null);

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
      const hasChanged = slideElements.some((newItem, index) => {
        const oldItem = items[index];
        return (
          !oldItem ||
          newItem.slideElementId !== oldItem.slideElementId ||
          newItem.displayOrder !== oldItem.displayOrder ||
          // Chỉ cập nhật nếu entryAnimation từ slideElements mới hơn
          (newItem.entryAnimation !== oldItem.entryAnimation &&
            newItem.entryAnimation !== undefined)
        );
      });
    
      if (hasChanged) {
        console.log('Updating items due to slideElements change:', slideElements);
        setItems(slideElements);
      }
    }, [slideElements]);

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
          
          console.log('Updated items with animation:', {
            objectId: e.detail.objectId,
            animationName: e.detail.animationName,
          });
        }
      };

      // const handleSetAnimation = (
      //   e: CustomEvent<{
      //     slideId: string;
      //     animationName: string;
      //     objectId: string;
      //   }>
      // ) => {
      //   if (e.detail.slideId !== slideId) return;

      //   console.log('Received fabric:selection-changed:', e.detail);

      //   setSelectedElementId(e.detail.objectId);

      //   // Update the items when animation changes
      //   if (e.detail.objectId && e.detail.animationName) {
      //     updateItemsWithAnimation(e.detail.objectId, e.detail.animationName);
         
      //     console.log('Updated items with animation:', {
      //       objectId: e.detail.objectId,
      //       animationName: e.detail.animationName,
      //     });
      //   }
      // };

      window.addEventListener(
        'fabric:selection-changed',
        handleSelectionChanged as EventListener
      );
      // window.addEventListener(
      //   'fabric:set-animation',
      //   handleSetAnimation as EventListener
      // );

      return () => {
        window.removeEventListener(
          'fabric:selection-changed',
          handleSelectionChanged as EventListener
        );
        // window.removeEventListener(
        //   'fabric:set-animation',
        //   handleSetAnimation as EventListener
        // );
      };
    }, [slideId, updateItemsWithAnimation]);
  
    useEffect(() => {
      const handleElementCreated = (e: SlideElementEvent) => {
        if (e.detail.slideId !== slideId) return;
  
        setItems((prev) => {
          const newItems = [...prev, e.detail.element];
          return newItems.sort((a, b) => a.displayOrder - b.displayOrder);
        });
      };
  
      const handleElementsChanged = (e: SlideElementEvent) => {
        if (e.detail.slideId !== slideId) return;
  
        if (e.detail.elements) {
          setItems(e.detail.elements);
        }
      };
  
      window.addEventListener('slide:element:created', handleElementCreated);
      window.addEventListener('slide:elements:changed', handleElementsChanged);
  
      return () => {
        window.removeEventListener('slide:element:created', handleElementCreated);
        window.removeEventListener('slide:elements:changed', handleElementsChanged);
      };
    }, [slideId]);

    const sensors = useSensors(
      useSensor(PointerSensor),
      useSensor(KeyboardSensor, {
        coordinateGetter: sortableKeyboardCoordinates,
      })
    );

    const hasValidLevelGap = (newItems: SlideElementPayload[], activeId: string) => {
      // Sắp xếp items theo displayOrder
      const sortedItems = [...newItems].sort((a, b) => a.displayOrder - b.displayOrder);
      
      // Lọc ra các displayOrder duy nhất
      const uniqueOrders = Array.from(new Set(sortedItems.map(item => item.displayOrder)));
      
      // Kiểm tra khoảng cách giữa các level
      for (let i = 0; i < uniqueOrders.length - 1; i++) {
        if (uniqueOrders[i + 1] - uniqueOrders[i] > 1) {
          return false;
        }
      }
      
      return true;
    };

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

            let newItems = items.map((item) => {
              if (item.slideElementId === active.id) {
                return { ...item, displayOrder: newLevel };
              }
              return item;
            });

            if (!hasValidLevelGap(newItems, active.id)) {
              // Nếu không hợp lệ, điều chỉnh lại displayOrder
              const uniqueOrders = Array.from(new Set(newItems.map(item => item.displayOrder))).sort((a, b) => a - b);
              const orderMap = new Map<number, number>();
              uniqueOrders.forEach((order, idx) => {
                orderMap.set(order, idx); // Ánh xạ các displayOrder thành liên tục
              });
    
              newItems = newItems.map((item) => ({
                ...item,
                displayOrder: orderMap.get(item.displayOrder)!,
              }));
            }
    
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
          const oldIndex = items.findIndex(
            (item) => item.slideElementId === active.id
          );
          const newIndex = items.findIndex(
            (item) => item.slideElementId === over.id
          );

          const activeItem = items[oldIndex];
          const overItem = items[newIndex];

          // Tìm cấp cao nhất hiện tại
          const maxCurrentLevel = Math.max(
            ...items.map((item) => item.displayOrder)
          );

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
                  return {
                    ...item,
                    displayOrder: Math.max(item.displayOrder - 1, 0),
                  };
                }
                return item;
              });
            }
          }

          // Kiểm tra tính hợp lệ của displayOrder
          if (!hasValidLevelGap(newItems, active.id)) {
            // Nếu không hợp lệ, điều chỉnh lại displayOrder
            const uniqueOrders = Array.from(new Set(newItems.map(item => item.displayOrder))).sort((a, b) => a - b);
            const orderMap = new Map<number, number>();
            uniqueOrders.forEach((order, idx) => {
              orderMap.set(order, idx); // Ánh xạ các displayOrder thành liên tục
            });

            newItems = newItems.map((item) => ({
              ...item,
              displayOrder: orderMap.get(item.displayOrder)!,
            }));
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
                  isSelected={item.slideElementId === selectedElementId}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </div>
    );
  };
