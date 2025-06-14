// src/components/AnimationToolbar.tsx
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

import type React from 'react';
import { useState, useCallback, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Zap,
  Maximize,
  RotateCcw,
  Type,
  ZoomIn,
  FlipHorizontal,
  Clock,
} from 'lucide-react';
import { debounce } from 'lodash';
import { AnimationOrderList } from './animation-order-list';
import { slidesApi } from '@/api-client/slides-api'; // Giả sử bạn có API để cập nhật slide elements
import type { SlideElementPayload } from '@/types/slideInterface';
import { animationDefaultDurations } from '../utils/animationMap'; 
interface AnimationToolbarProps {
  slideId: string;
  slideElements: SlideElementPayload[];
  onSlideElementsUpdate: (elements: SlideElementPayload[]) => void;
}

const AnimationToolbar: React.FC<AnimationToolbarProps> = ({
  slideId,
  slideElements,
  onSlideElementsUpdate,
}) => {
  const [selectedAnimation, setSelectedAnimation] = useState<string>('none');
  const [animationMap, setAnimationMap] = useState<Record<string, string>>({});
  const [currentObjectId, setCurrentObjectId] = useState<string | null>(null);
  const [animationDuration, setAnimationDuration] = useState<number>(1);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  
  const animationOptions = [
    {
      name: 'Không có',
      value: 'none',
      icon: (
        <div className="w-3 h-3 border border-dashed border-gray-400 rounded" />
      ),
      description: 'Không có hiệu ứng',
    },
    {
      name: 'Fade',
      value: 'Fade',
      icon: <Sparkles className="w-3 h-3" />,
      description: 'Hiệu ứng mờ dần',
    },
    {
      name: 'Slide Left',
      value: 'SlideInLeft',
      icon: <ArrowRight className="w-3 h-3" />,
      description: 'Trượt từ trái',
    },
    {
      name: 'Slide Right',
      value: 'SlideInRight',
      icon: <ArrowLeft className="w-3 h-3" />,
      description: 'Trượt từ phải',
    },
    // {
    //   name: 'Scale In',
    //   value: 'ScaleIn',
    //   icon: <Maximize className="w-3 h-3" />,
    //   description: 'Phóng to',
    // },
    {
      name: 'Rotate In',
      value: 'RotateIn',
      icon: <RotateCcw className="w-3 h-3" />,
      description: 'Xoay vào',
    },
    // {
    //   name: 'Typewriter',
    //   value: 'Typewriter',
    //   icon: <Type className="w-3 h-3" />,
    //   description: 'Gõ chữ (Text)',
    // },
    // {
    //   name: 'Fade Char',
    //   value: 'FadeInChar',
    //   icon: <Sparkles className="w-3 h-3" />,
    //   description: 'Mờ dần từng chữ (Text)',
    // },
    // {
    //   name: 'Zoom In',
    //   value: 'ZoomIn',
    //   icon: <ZoomIn className="w-3 h-3" />,
    //   description: 'Phóng to (Image)',
    // },
    // {
    //   name: 'Flip In',
    //   value: 'FlipIn',
    //   icon: <FlipHorizontal className="w-3 h-3" />,
    //   description: 'Lật vào (Image)',
    // },
    {
      name: 'Bounce',
      value: 'Bounce',
      icon: <Zap className="w-3 h-3" />,
      description: 'Hiệu ứng nảy',
    },
  ];

  // useEffect(() => {
  //   const handleSelectionChanged = (
  //     e: CustomEvent<{
  //       slideId: string;
  //       animationName: string;
  //       objectId: string | null;
  //     }>
  //   ) => {
  //     if (e.detail.slideId !== slideId) {
  //       console.log(
  //         `Ignoring fabric:selection-changed because slideId does not match: ${e.detail.slideId} !== ${slideId}`
  //       );
  //       return;
  //     }

  //     const { animationName, objectId } = e.detail;

  //     // Cập nhật animation map khi có thay đổi
  //     if (objectId) {
  //       setAnimationMap((prev) => ({
  //         ...prev,
  //         [objectId]: animationName,
  //       }));
  //       setCurrentObjectId(objectId);
  //     } else {
  //       setCurrentObjectId(null);
  //     }
  //     console.log('AnimationToolbar received fabric:selection-changed:', e.detail);
  //     // Cập nhật selected animation
  //     setSelectedAnimation(animationName || 'none');
  //   };

  //   window.addEventListener(
  //     'fabric:selection-changed',
  //     handleSelectionChanged as EventListener
  //   );

  //   return () => {
  //     window.removeEventListener(
  //       'fabric:selection-changed',
  //       handleSelectionChanged as EventListener
  //     );
  //   };
  // }, [slideId]);

  // const handleAnimationPreview = useCallback(
  //   debounce((animationValue: string) => {
  //     if (animationValue !== 'none') {
  //       const event = new CustomEvent('fabric:preview-animation', {
  //         detail: { slideId, animationName: animationValue },
  //       });
  //       window.dispatchEvent(event);
  //     }
  //   }, 1000),
  //   [slideId]
  // );  // Debounced function để update animation duration
  const debouncedUpdateDuration = useCallback(
    (objectId: string, duration: number) => {
      const timer = setTimeout(async () => {
        try {
          // Tìm element trong slideElements
          const element = slideElements.find(
            (el) => el.slideElementId === objectId
          );
          if (!element) return;

          // Cập nhật API
          const updatedElement = {
            ...element,
            entryAnimationDuration: duration,
          };

          await slidesApi.updateSlidesElement(
            slideId,
            objectId,
            updatedElement
          );

          // Cập nhật fabric object
          const fabricUpdateEvent = new CustomEvent('fabric:update-duration', {
            detail: {
              slideId,
              objectId,
              duration,
            },
          });
          window.dispatchEvent(fabricUpdateEvent);

          // Cập nhật local state
          const updatedElements = slideElements.map((el) =>
            el.slideElementId === objectId
              ? { ...el, entryAnimationDuration: duration }
              : el
          );
          onSlideElementsUpdate(updatedElements);

          console.log(`Updated duration for ${objectId} to ${duration}s`);
        } catch (error) {
          console.error('Failed to update animation duration:', error);
        }
      }, 500);

      return () => clearTimeout(timer);
    },
    [slideId, slideElements, onSlideElementsUpdate]
  );

  const handleDurationSliderChange = (value: number[]) => {
    const newDuration = value[0];
    setAnimationDuration(newDuration);
  };

  const handleDurationSliderRelease = () => {
    setIsDragging(false);
    if (currentObjectId) {
      debouncedUpdateDuration(currentObjectId, animationDuration);
    }
  };

  const handleAnimationSelect = (animationValue: string) => {
    if (animationValue === selectedAnimation) {
      return;
    }

    // Kill preview animation đang chạy
    if (currentObjectId) {
      const event = new CustomEvent('fabric:reset-animation', {
        detail: { slideId },
      });
      window.dispatchEvent(event);
    }

    setTimeout(() => {
      setSelectedAnimation(animationValue);

      // Lưu animation vào map và cập nhật duration
      if (currentObjectId) {
        setAnimationMap((prev) => ({
          ...prev,
          [currentObjectId]: animationValue,
        }));

        // Cập nhật slideElements với animation mới và duration mặc định
        const defaultDuration = animationDefaultDurations[animationValue] || 1; // Lấy duration mặc định
        const updatedElements = slideElements.map((item) =>
          item.slideElementId === currentObjectId
            ? {
                ...item,
                entryAnimation: animationValue,
                entryAnimationDuration: defaultDuration, // Cập nhật duration
              }
            : item
        );
        onSlideElementsUpdate(updatedElements);

        // Cập nhật Slider
        setAnimationDuration(defaultDuration); // Cập nhật animationDuration cho Slider

        if (animationValue !== 'none') {
          const previewEvent = new CustomEvent('fabric:preview-animation', {
            detail: { slideId, animationName: animationValue },
          });
          window.dispatchEvent(previewEvent);

          const setEvent = new CustomEvent('fabric:set-animation', {
            detail: {
              slideId,
              animationName: animationValue,
              objectId: currentObjectId,
            },
          });
          window.dispatchEvent(setEvent);
        } else {
          const setEvent = new CustomEvent('fabric:set-animation', {
            detail: { slideId, animationName: null, objectId: currentObjectId },
          });
          window.dispatchEvent(setEvent);
        }
      }
    }, 50);
  };

  useEffect(() => {
    // Thêm listeners cho các events
    const handleElementCreated = (e: SlideElementEvent) => {
      if (e.detail.slideId !== slideId) return;
      const newElements = [...slideElements, e.detail.element].sort(
        (a, b) => a.displayOrder - b.displayOrder
      );
      onSlideElementsUpdate(newElements);
    };

    const handleElementsChanged = (e: SlideElementEvent) => {
      if (e.detail.slideId !== slideId) return;
      if (e.detail.elements) {
        onSlideElementsUpdate(e.detail.elements);
      }
    };

    const handleSelectionChanged = (
      e: CustomEvent<{
        slideId: string;
        objectId: string | null;
        animationName: string;
        duration?: number;
      }>
    ) => {
      if (e.detail.slideId !== slideId) return;
      console.log(
        'AnimationToolbar received fabric:selection-changed:',
        e.detail
      );
      const { objectId, animationName, duration } = e.detail;
      if (objectId) {
        setAnimationMap((prev) => ({
          ...prev,
          [objectId]: animationName,
        }));
        setCurrentObjectId(objectId);

        // Tìm element hiện tại và set duration
        const currentElement = slideElements.find(
          (el) => el.slideElementId === objectId
        );
        const defaultDuration = animationDefaultDurations[animationName] || 1;
        setAnimationDuration(
          duration ?? currentElement?.entryAnimationDuration ?? defaultDuration
        );

        const updatedElements = slideElements.map((item) =>
          item.slideElementId === objectId
            ? {
                ...item,
                entryAnimation: animationName,
                entryAnimationDuration:
                  duration ??
                  currentElement?.entryAnimationDuration ??
                  defaultDuration,
              }
            : item
        );
        onSlideElementsUpdate(updatedElements);
      } else {
        setCurrentObjectId(null);
        setAnimationDuration(1); // Reset về default
      }
      setSelectedAnimation(animationName || 'none');
    };

    window.addEventListener(
      'slide:element:created',
      handleElementCreated as EventListener
    );
    window.addEventListener(
      'slide:elements:changed',
      handleElementsChanged as EventListener
    );
    window.addEventListener(
      'fabric:selection-changed',
      handleSelectionChanged as EventListener
    );

    return () => {
      window.removeEventListener(
        'slide:element:created',
        handleElementCreated as EventListener
      );
      window.removeEventListener(
        'slide:elements:changed',
        handleElementsChanged as EventListener
      );
      window.removeEventListener(
        'fabric:selection-changed',
        handleSelectionChanged as EventListener
      );
    };
  }, [slideId, slideElements, onSlideElementsUpdate]);

  const handleOrderChange = async (updatedElements: SlideElementPayload[]) => {
    onSlideElementsUpdate(updatedElements);

    const event = new CustomEvent('fabric:update-display-order', {
      detail: {
        slideId,
        elements: updatedElements,
      },
    });
    window.dispatchEvent(event);
  };

  useEffect(() => {
    setCurrentObjectId(null);
    setSelectedAnimation('none');
    setAnimationMap({});
  }, [slideId]);

  return (
    <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-lg border border-blue-200 dark:border-blue-800 shadow-sm">
      <div className="mb-3">
        <Label className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-1 block">
          Element Animations
        </Label>
        <p className="text-xs text-blue-600 dark:text-blue-300">
          Chọn hiệu ứng cho phần tử
        </p>
      </div>
      <div className="grid grid-cols-2 gap-2 mb-3">
        {animationOptions.map((option) => (
          <div
            key={option.value}
            // onMouseEnter={() => handleAnimationPreview(option.value)}
            onClick={() => handleAnimationSelect(option.value)}
            className={`
              p-2 rounded-md border cursor-pointer transition-all duration-200 group
              ${
                selectedAnimation === option.value
                  ? 'border-blue-500 bg-blue-100 dark:bg-blue-900/30 shadow-sm'
                  : 'border-blue-200 dark:border-blue-700 bg-white dark:bg-blue-950/30 hover:border-blue-300 hover:shadow-sm'
              }
            `}
          >
            <div className="flex items-center gap-2">
              <div
                className={`
                p-1.5 rounded-full transition-colors duration-200
                ${
                  selectedAnimation === option.value
                    ? 'bg-blue-500 text-white'
                    : 'bg-blue-100 dark:bg-blue-800 text-blue-600 dark:text-blue-300 group-hover:bg-blue-200 dark:group-hover:bg-blue-700'
                }
              `}
              >
                {option.icon}
              </div>
              <div className="flex-1 min-w-0">
                <h3
                  className={`
                  font-medium text-xs leading-tight
                  ${
                    selectedAnimation === option.value
                      ? 'text-blue-700 dark:text-blue-200'
                      : 'text-blue-800 dark:text-blue-300'
                  }
                `}
                >
                  {option.name}
                </h3>
                <p
                  className={`
                  text-xs leading-tight truncate
                  ${
                    selectedAnimation === option.value
                      ? 'text-blue-600 dark:text-blue-300'
                      : 'text-blue-500 dark:text-blue-400'
                  }
                `}
                >
                  {option.description}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>{' '}
      {selectedAnimation !== 'none' && (
        <div className="space-y-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-md border border-blue-200 dark:border-blue-700">
            <p className="text-xs text-blue-700 dark:text-blue-300 flex items-center">
              <Sparkles className="w-3 h-3 mr-1 flex-shrink-0" />
              <span className="truncate">
                Đã chọn:{' '}
                <span className="font-medium">
                  {
                    animationOptions.find(
                      (opt) => opt.value === selectedAnimation
                    )?.name
                  }
                </span>
              </span>
            </p>
          </div>

          {/* Animation Duration Slider */}
          {currentObjectId && (
            <div className="p-3 bg-white dark:bg-blue-950/30 rounded-md border border-blue-200 dark:border-blue-700">
              <div className="flex items-center justify-between mb-2">
                <Label className="text-xs font-medium text-blue-800 dark:text-blue-200 flex items-center">
                  <Clock className="w-3 h-3 mr-1" />
                  Thời gian hiệu ứng
                </Label>
                <span className="text-xs text-blue-600 dark:text-blue-300 font-mono">
                  {animationDuration.toFixed(1)}s
                </span>
              </div>
              <Slider
                value={[animationDuration]}
                onValueChange={handleDurationSliderChange}
                onValueCommit={() => handleDurationSliderRelease()}
                min={0.1}
                max={3}
                step={0.1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-blue-500 dark:text-blue-400 mt-1">
                <span>0.1s</span>
                <span>3.0s</span>
              </div>
            </div>
          )}
        </div>
      )}
      <AnimationOrderList
        slideElements={slideElements}
        onOrderChange={handleOrderChange}
        slideId={slideId}
      />
    </div>
  );
};

export default AnimationToolbar;
