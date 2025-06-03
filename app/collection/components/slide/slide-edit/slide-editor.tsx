'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as fabric from 'fabric';
import { useFabricCanvas } from './useFabricCanvas';
// import { initFabricEvents } from './useFabricEvents';
import { ToolbarHandlers } from './useToolbarHandlers';
import { EditorContextMenu } from '../sidebar/editor-context-menu';
import { slidesApi } from '@/api-client/slides-api';
import { storageApi } from '@/api-client/storage-api';
import type { SlideElementPayload } from '@/types/slideInterface';
import { debounce } from 'lodash';
import { FabricImage } from 'fabric';
import { slideElementToFabric } from './slideElementToFabric';
import { gsap } from 'gsap';
import { animationMap } from '../utils/animationMap';
const ORIGINAL_CANVAS_WIDTH = 812;

export interface FabricEditorProps {
  slideTitle: string;
  slideContent: string;
  onUpdate: (data: {
    title?: string;
    content?: string;
    slideElements?: SlideElementPayload[];
    backgroundColor?: string;
    backgroundImage?: string; 
  }) => void;
  backgroundColor?: string;
  width?: number;
  height?: number;
  zoom?: number;
  slideId?: string;
  //onSavingStateChange?: (isSaving: boolean) => void;
  slideElements: SlideElementPayload[];
  backgroundImage?: string; // Sửa kiểu từ any thành SlideElementPayload[]
}

const FabricEditor: React.FC<FabricEditorProps> = ({
  slideTitle,
  slideContent,
  onUpdate,
  backgroundColor = '#000',
  width,
  height = 430,
  zoom = 1,
  slideId,
  //onSavingStateChange,
  slideElements,
  backgroundImage,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { fabricCanvas, initCanvas } = useFabricCanvas();
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const isProcessingRef = useRef(false);
  const isInitialMount = useRef(true);
  const slideElementsRef = useRef<SlideElementPayload[]>(slideElements);
  const [isLoading, setIsLoading] = useState(true);
  const [previewAnimation, setPreviewAnimation] = useState<string | null>(null);
  
  const isLoadingRef = useRef(false);

  // console.log("bgColor: ", backgroundColor);
  // console.log("bgImage: ", backgroundImage);

  useEffect(() => {
    slideElementsRef.current = slideElements;
    console.log("đã load: ", slideElements);
  }, [slideElements]);



  const setCanvasBackground = async (
    canvas: fabric.Canvas,
    bgColor: string,
    bgImage?: string
  ) => {
    canvas.backgroundImage = undefined;
    canvas.backgroundColor = bgColor || '#fff';

    if (bgImage) {
      try {
        const img = await fabric.FabricImage.fromURL(bgImage);
        img.set({
          scaleX: canvas.getWidth() / img.width!,
          scaleY: canvas.getHeight() / img.height!,
          originX: 'left',
          originY: 'top',
        });
        canvas.set({ backgroundImage: img });
      } catch (err) {
        console.error('Lỗi khi tải backgroundImage:', err);
        canvas.backgroundColor = bgColor || '#000';
      }
    }
    canvas.renderAll();
  };

  const saveState = () => {
    if (isProcessingRef.current) return;
    const canvas = fabricCanvas.current;
    if (!canvas) return;

    const json = JSON.stringify(canvas.toJSON());
    setHistory((prev) => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push(json);
      return newHistory;
    });
    setHistoryIndex((prev) => prev + 1);
  };

  const restoreState = (json: string) => {
    const canvas = fabricCanvas.current;
    if (!canvas) return;

    isProcessingRef.current = true;
    canvas.loadFromJSON(json, () => {
      canvas.renderAll();
      isProcessingRef.current = false;
    });
  };

  const undo = () => {
    if (historyIndex <= 0) return;
    const newIndex = historyIndex - 1;
    setHistoryIndex(newIndex);
    restoreState(history[newIndex]);
  };

  const redo = () => {
    if (historyIndex >= history.length - 1) return;
    const newIndex = historyIndex + 1;
    setHistoryIndex(newIndex);
    restoreState(history[newIndex]);
  };

  const setBackgroundImageWithCover = async (
    canvas: fabric.Canvas,
    imageUrl: string
  ) => {
    try {
      // 1. Load image về dưới dạng Promise
      const img = await fabric.FabricImage.fromURL(imageUrl);
      img.set({
        originX: 'left',
        originY: 'top',
        left: 0,
        top: 0,
      });

      // 4. Gán ảnh nền và render
      canvas.set({ backgroundImage: img });
      canvas.renderAll();
    } catch (err) {
      console.error('Lỗi khi load background image:', err);
    }
  };

  const updateSlideElement = debounce(
    async (obj: fabric.Object, updates: Partial<SlideElementPayload> = {}) => {
      if (!obj || (obj.type !== 'image' && obj.type !== 'textbox')) return;
      const slideElementId = obj.get('slideElementId');
      if (!slideElementId) return;

      const canvas = fabricCanvas.current;
      if (!canvas) return;

      if (!slideId) return;

      // if (onSavingStateChange) onSavingStateChange(true);

      const zoom = canvas.getZoom();
      const cw = canvas.getWidth()! / zoom;
      const ch = canvas.getHeight()! / zoom;

      const rawLeft = obj.left! / zoom;
      const rawTop = obj.top! / zoom;

      let w: number, h: number;
      if (obj.type === 'image') {
        w = (obj as fabric.Image).getScaledWidth() / zoom;
        h = (obj as fabric.Image).getScaledHeight() / zoom;
      } else {
        w = obj.width!;
        h = (obj as fabric.Textbox).getScaledHeight() / zoom;
      }

      const base = {
        positionX: (rawLeft / cw) * 100,
        positionY: (rawTop / ch) * 100,
        width: (w / cw) * 100,
        height: (h / ch) * 100,
        rotation: obj.angle || 0,
        layerOrder: canvas.getObjects().indexOf(obj),
      };

      let payload: SlideElementPayload;
      if (obj.type === 'textbox') {
        const fontSizePercent =
          ((obj as fabric.Textbox).fontSize! / ORIGINAL_CANVAS_WIDTH) * 100;
        const originalText = (obj as fabric.Textbox).text || '';
        const textboxJson = {
          ...obj.toJSON(),
          fontSize: fontSizePercent,
          text: originalText,
        };
        if (textboxJson.styles && Object.keys(textboxJson.styles).length > 0) {
          for (const lineIndex in textboxJson.styles) {
            const line = textboxJson.styles[lineIndex];
            for (const charIndex in line) {
              if (line[charIndex].fontSize) {
                line[charIndex].fontSize =
                  (line[charIndex].fontSize / ORIGINAL_CANVAS_WIDTH) * 100;
              }
            }
          }
        }
        payload = {
          ...base,
          slideElementType: 'TEXT',
          content: JSON.stringify(textboxJson),
          entryAnimation: obj.get('entryAnimation') || undefined,
          ...updates,
        } as SlideElementPayload;
      } else {
        payload = {
          ...base,
          slideElementType: 'IMAGE',
          sourceUrl: obj.get('sourceUrl') || (obj as fabric.Image).getSrc(),
          entryAnimation: obj.get('entryAnimation') || undefined,
          ...updates,
        } as SlideElementPayload;
      }

      try {
        console.log('Sending payload:', payload);
        const res = await slidesApi.updateSlidesElement(
          slideId,
          slideElementId,
          payload
        );
        //console.log('API response:', JSON.stringify(res.data, null, 2));
        const serverData = res.data.data;
        // Merge với mảng hiện tại
        const updatedList = slideElementsRef.current.map((el) =>
          el.slideElementId === slideElementId
            ? { ...el, ...payload, ...serverData }
            : el
        );
        slideElementsRef.current = updatedList;
        onUpdate?.({
          slideElements: updatedList,
          title: slideTitle,
          content: slideContent,
        });
      } catch (err) {
        console.error('Update failed:', err);
      }
    },
    500
  );

  const loadSlideElements = async (maxRetries = 5) => {

    if (isLoadingRef.current) {
      console.log('Already loading elements, skipping...');
      return;
    }

    if (!fabricCanvas.current) {
      console.warn('Canvas chưa được khởi tạo');
      return;
    }

    try {
      isLoadingRef.current = true;

      const canvas = fabricCanvas.current;
      // activeObjectRef.current = canvas.getActiveObject();
      // Xóa canvas và thiết lập lại nền

      canvas
        .getObjects()
        .slice()
        .forEach((o) => canvas.remove(o));
      // canvas.backgroundImage = undefined;
      // canvas.backgroundColor = backgroundColor || '#fff';
      // canvas.renderAll();
      //await setCanvasBackground(canvas, backgroundColor, backgroundImage);

      // if (backgroundImage) {
      //   setBackgroundImageWithCover(canvas, backgroundImage);
      // } else {
      //   canvas.backgroundColor = backgroundColor || '#fff';
      //   canvas.renderAll();
      // }

      // Nếu không có slideElements, để canvas trống
      let elements = slideElementsRef.current;
      let retries = 0;

      while ((!elements || elements.length === 0) && retries < maxRetries) {
        console.log(
          `Waiting for slideElements, retry ${retries + 1}/${maxRetries}`
        );
        await new Promise((resolve) => setTimeout(resolve, 200)); // Chờ 200ms
        elements = slideElementsRef.current;
        retries++;
      }

      if (!elements || elements.length === 0) {
        console.warn('No slide elements available after retries');
        saveState();
        return;
      }

      // Sắp xếp elements theo layerOrder
      const sortedElements = [...elements].sort(
        (a, b) => a.layerOrder - b.layerOrder
      );

      const imagePromises = sortedElements
        .filter(
          (element) => element.slideElementType === 'IMAGE' && element.sourceUrl
        )
        .map(
          (element) =>
            new Promise<{
              element: SlideElementPayload;
              imgElement: HTMLImageElement;
            }>((resolve, reject) => {
              const imgElement = new Image();
              imgElement.onload = () => {
                resolve({ element, imgElement });
              };
              imgElement.onerror = (err) => {
                reject(err);
              };
              imgElement.src = element.sourceUrl!;
            })
        );

      const loadedImages = await Promise.all(imagePromises);

      for (const el of sortedElements) {
        const obj = slideElementToFabric(el, canvas, loadedImages);
        if (obj) {
          // Đảm bảo animation được set khi load
          if (el.entryAnimation) {
            obj.set('entryAnimation', el.entryAnimation);
          }
          canvas.add(obj);
        }
      }

      const activeObject = canvas.getActiveObject();
      if (activeObject) {
        const event = new CustomEvent('fabric:selection-changed', {
          detail: {
            slideId,
            animationName: activeObject.get('entryAnimation') || 'none',
            objectId: activeObject.get('slideElementId'),
          },
        });
        window.dispatchEvent(event);
      }
    } finally {
      isLoadingRef.current = false;
    }
  };

  const renderAnimation = (element: fabric.Object) => {
    const animationName = element.get('entryAnimation');
    if (animationName && animationName in animationMap && fabricCanvas.current) {
      animationMap[animationName](element, fabricCanvas.current);
    }
  };

  const handlePreviewAnimation = (
    e: CustomEvent<{ slideId: string; animationName: string }>
  ) => {
    if (e.detail.slideId !== slideId) {
      return;
    }

    const activeObject = fabricCanvas.current?.getActiveObject();
    if (!activeObject || !fabricCanvas.current) return;

    const animationName = e.detail.animationName;
    if (animationName in animationMap) {
      // Lưu trạng thái ban đầu
      const initialState = {
        text: activeObject instanceof fabric.Textbox ? activeObject.text : undefined,
        opacity: activeObject.opacity,
        left: activeObject.left,
        top: activeObject.top,
        scaleX: activeObject.scaleX,
        scaleY: activeObject.scaleY,
        angle: activeObject.angle,
      };

      animationMap[animationName](activeObject, fabricCanvas.current, () => {

        activeObject.set({
          opacity: initialState.opacity ?? 1,
          left: initialState.left ?? 0,
          top: initialState.top ?? 0,
          scaleX: initialState.scaleX ?? 1,
          scaleY: initialState.scaleY ?? 1,
          angle: initialState.angle ?? 0,
        });

       if (fabricCanvas.current) {
        fabricCanvas.current.renderAll();
       }
       setPreviewAnimation(null);
      });
      setPreviewAnimation(animationName);
    }
  };

  const handleSetAnimation = async (
    e: CustomEvent<{ slideId: string; animationName: string }>
  ) => {
    if (e.detail.slideId !== slideId) {
      console.log(
        `Bỏ qua fabric:set-animation vì slideId không khớp: ${e.detail.slideId} !== ${slideId}`
      );
      return;
    }

    const activeObject = fabricCanvas.current?.getActiveObject();
    if (!activeObject || !activeObject.get('slideElementId')) return;

    const slideElementId = activeObject.get('slideElementId');
    activeObject.set('entryAnimation', e.detail.animationName);

    await updateSlideElement(activeObject, {
      entryAnimation: e.detail.animationName,
    });
    saveState();
  };

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = initCanvas(canvasRef.current, backgroundColor, width);
    canvas.setDimensions({ width: width, height: height });
    canvas.setZoom(zoom);

    const initializeCanvas = async () => {
      setIsLoading(true);
      try {
        if (backgroundColor === '#FFFFFF' && slideId) {
          await new Promise((resolve) => setTimeout(resolve, 100));
        }

        console.log('Initializing canvas with:', {
          backgroundColor,
          backgroundImage,
          width,
          height,
          zoom,
        });

        await setCanvasBackground(canvas, backgroundColor, backgroundImage);
        while (
          slideElementsRef.current.length === 0 &&
          !isInitialMount.current
        ) {
          await new Promise((resolve) => setTimeout(resolve, 150));
        }
        await loadSlideElements();
      } finally {
        setIsLoading(false);
      }
    };

    initializeCanvas();

    const handleSetBackgroundImageWrapper = (evt: Event) => {
      const customEvent = evt as CustomEvent<{ url: string; slideId?: string }>;
      handleSetBackgroundImage(customEvent).catch((err) =>
        console.error('Error in handleSetBackgroundImage:', err)
      );
    };

    const handleSetBackgroundColor = (
      e: CustomEvent<{ color: string; slideId?: string }>
    ) => {
      if (e.detail.slideId && e.detail.slideId !== slideId) {
        console.log(
          `Bỏ qua fabric:set-background-color vì slideId không khớp: ${e.detail.slideId} !== ${slideId}`
        );
        return;
      }

      console.log('Received fabric:set-background-color:', e.detail.color);

      if (fabricCanvas.current) {
        fabricCanvas.current.backgroundImage = undefined;
        canvas.backgroundColor = e.detail.color;
        fabricCanvas.current.renderAll();

        onUpdate?.({
          backgroundColor: e.detail.color,
        });
      } else {
        console.warn('fabricCanvas.current is undefined');
      }
    };

    const handleSetBackgroundImage = async (
      e: CustomEvent<{ url: string; slideId?: string }>
    ) => {
      console.log('Received fabric:set-background-image:', e.detail.url);
      if (!e.detail.slideId || e.detail.slideId !== slideId) {
        return;
      }

      if (fabricCanvas.current) {
        if (e.detail.url) {
          await setCanvasBackground(
            fabricCanvas.current,
            backgroundColor,
            e.detail.url
          );
          onUpdate?.({ backgroundImage: e.detail.url });
        } else {
          fabricCanvas.current.backgroundImage = undefined;
          fabricCanvas.current.backgroundColor = backgroundColor || '#000';
          fabricCanvas.current.renderAll();

          onUpdate?.({
            backgroundImage: undefined,
          });
        }

        // loadSlideElements();
        console.log('Updated canvas backgroundImage:', e.detail.url);
      }
    };

    const handleUpdateDisplayOrder = async (
      e: CustomEvent<{
        slideId: string;
        elements: SlideElementPayload[];
      }>
    ) => {
      if (e.detail.slideId !== slideId) return;
    
      try {
        for (const element of e.detail.elements) {
          const obj = fabricCanvas.current?.getObjects().find(
            (o) => o.get('slideElementId') === element.slideElementId
          );
    
          if (obj) {
            // Chỉ cần truyền displayOrder, các trường khác sẽ được tự động tính
            await updateSlideElement(obj, {
              displayOrder: element.displayOrder
            });
          }
        }
    
        // Cập nhật state
        onUpdate?.({
          slideElements: e.detail.elements
        });
      } catch (error) {
        console.error('Error updating display order:', error);
      }
    };

    window.addEventListener(
      'fabric:update-display-order',
      handleUpdateDisplayOrder as unknown as EventListener
    );

    window.addEventListener(
      'fabric:set-background-color',
      handleSetBackgroundColor as EventListener
    );
    window.addEventListener(
      'fabric:set-background-image',
      handleSetBackgroundImageWrapper
    );

    window.addEventListener(
      'fabric:preview-animation',
      handlePreviewAnimation as EventListener
    );
    window.addEventListener(
      'fabric:set-animation',
      handleSetAnimation as unknown as EventListener
    );

    // const { title, content } = initFabricEvents(canvas, onUpdate);
    const cleanupToolbar = slideId
      ? ToolbarHandlers(canvas, slideId, onUpdate, slideElements)
      : () => {};

    const handleKeyDown = async (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput =
        ['INPUT', 'TEXTAREA'].includes(target.tagName) ||
        target.isContentEditable;
      if (isInput) return;

      if (e.ctrlKey) {
        if (e.key === 'z' || e.key === 'Z') {
          if (e.shiftKey) {
            e.preventDefault();
            redo();
          } else {
            e.preventDefault();
            undo();
          }
        } else if (e.key === 'y' || e.key === 'Y') {
          e.preventDefault();
          redo();
        }
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        const activeObjects = canvas.getActiveObjects();
        if (activeObjects.length) {
          const updatedElements = [...slideElements];
          for (const obj of activeObjects) {
            const slideElementId = obj.get('slideElementId');
            if (!slideElementId || !slideId) {
              console.log(
                'Bỏ qua xóa object vì thiếu slideElementId hoặc slideId:',
                { slideElementId, slideId }
              );
              canvas.remove(obj);
              continue;
            }

            // Xóa element khỏi slide hiện tại
            canvas.remove(obj);
            try {
              await slidesApi.deleteSlidesElement(slideId, slideElementId);
              console.log('Xóa element thành công:', slideElementId);

              // Cập nhật slideElements bằng cách loại bỏ element đã xóa
              const index = updatedElements.findIndex(
                (el) => el.slideElementId === slideElementId
              );
              if (index === -1) {
                console.warn(
                  'Không tìm thấy slideElement trong slideElements:',
                  slideElementId
                );
                continue;
              }
              updatedElements.splice(index, 1);
            } catch (err) {
              console.error('Lỗi xóa element:', err);
            }
          }

          // Cập nhật slideElements thông qua onUpdate
          onUpdate({
            title: slideTitle,
            content: slideContent,
            slideElements: updatedElements,
          });

          canvas.discardActiveObject();
          canvas.requestRenderAll();
          saveState();
        }
      }
    };

    canvas.on('object:added', (e) => {
      const obj = e.target;
      if (obj) {
        // console.log(
        //   'Đối tượng vừa được tạo:',
        //   JSON.stringify(obj.toJSON(), null, 2)
        // );
        saveState();
      }
    });

    canvas.on('object:modified', (e) => {
      const obj = e.target;
      if (!obj) return;

      // console.log(
      //   'Đối tượng vừa được thay đổi:',
      //   JSON.stringify(obj.toJSON(), null, 2)
      // );

      const isNew = obj.get('isNew');
      const isCreating = canvas.get('isCreating');

      if (isNew || isCreating) {
        if (isNew) {
          obj.set('isNew', false);
        }
        return;
      }

      updateSlideElement(obj);
      saveState();
    });

    canvas.on('text:changed', (e) => {
      const obj = e.target as fabric.Textbox;
      if (!obj || obj.type !== 'textbox') return;

      //console.log('Text changed:', obj.toJSON());
      updateSlideElement(obj);
      saveState();
    });

    canvas.on('text:selection:changed', (e) => {
      const obj = e.target as fabric.Textbox;
      if (!obj || obj.type !== 'textbox') return;

      //console.log('Text selection changed:', obj.toJSON());
      updateSlideElement(obj);
      saveState();
    });

    canvas.on('text:editing:exited', (e) => {
      const obj = e.target as fabric.Textbox;
      if (!obj || obj.type !== 'textbox') return;

      //console.log('Text editing exited:', obj.toJSON());
      updateSlideElement(obj);
      saveState();
    });

    canvas.on('drop', (e) => {
      const target = e.target;
      // console.log('Đối tượng target: ', target);
      if (target && target instanceof fabric.Textbox) {
        e.e.preventDefault();
        return false;
      }
    });

    canvas.on('after:render', () => {
      if (history.length === 0) {
        saveState();
      }
    });

    canvas.on('selection:created', (e) => {
      const activeObject = e.selected?.[0];
      if (activeObject) {
        const animationName = activeObject.get('entryAnimation') || 'none';
        const event = new CustomEvent('fabric:selection-changed', {
          detail: {
            slideId,
            animationName,
            objectId: activeObject.get('slideElementId'), // Thêm objectId
          },
        });
        window.dispatchEvent(event);
      }
    });

    // Trong useEffect setup canvas events, thêm listener này cùng với selection:created và selection:cleared

    canvas.on('selection:updated', (e) => {
      const activeObject = e.selected?.[0];
      if (activeObject) {
        const animationName = activeObject.get('entryAnimation') || 'none';
        const event = new CustomEvent('fabric:selection-changed', {
          detail: {
            slideId,
            animationName,
            objectId: activeObject.get('slideElementId'),
          },
        });
        window.dispatchEvent(event);
      }
    });

    canvas.on('selection:cleared', () => {
      const event = new CustomEvent('fabric:selection-changed', {
        detail: {
          slideId,
          animationName: 'none',
          objectId: null,
        },
      });
      window.dispatchEvent(event);
    });

    document.addEventListener('keydown', handleKeyDown);

    // loadSlideElements();
    return () => {
      window.removeEventListener(
        'fabric:set-background-color',
        handleSetBackgroundColor as EventListener
      );
      window.removeEventListener(
        'fabric:set-background-image',
        handleSetBackgroundImageWrapper
      );
      window.removeEventListener(
        'fabric:preview-animation',
        handlePreviewAnimation as EventListener
      );
      window.removeEventListener(
        'fabric:set-animation',
        handleSetAnimation as unknown as EventListener
      );
      window.removeEventListener(
        'fabric:update-display-order',
        handleUpdateDisplayOrder as unknown as EventListener
      );

      cleanupToolbar();
      isLoadingRef.current = false;
      canvas.dispose();
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [width, height, zoom, slideId, backgroundColor, backgroundImage]);

  useEffect(() => {
    const handleDragStart = () => {
      if (fabricCanvas.current) {
        fabricCanvas.current.getObjects().forEach((obj) => {
          if (obj instanceof fabric.Textbox) {
            obj.lockMovementX = true;
            obj.lockMovementY = true;
            obj.set('editable', false);
          }
        });
      }
    };
    const handleDragEnd = () => {
      if (fabricCanvas.current) {
        fabricCanvas.current.getObjects().forEach((obj) => {
          if (obj instanceof fabric.Textbox) {
            obj.lockMovementX = false;
            obj.lockMovementY = false;
            obj.set('editable', true);
          }
        });
      }
    };
    window.addEventListener('dragstart', handleDragStart);
    window.addEventListener('dragend', handleDragEnd);
    return () => {
      window.removeEventListener('dragstart', handleDragStart);
      window.removeEventListener('dragend', handleDragEnd);
    };
  }, []);

  useEffect(() => {
    const handleDragOver = (e: DragEvent) => {
      if (fabricCanvas.current) {
        fabricCanvas.current.getObjects().forEach((obj) => {
          if (obj instanceof fabric.Textbox && obj.isEditing) {
            obj.exitEditing();
          }
        });
      }
    };

    document.addEventListener('dragover', handleDragOver, true);

    return () => {
      document.removeEventListener('dragover', handleDragOver, true);
    };
  }, []);

  const handleDrop = (e: React.DragEvent) => {
    if (fabricCanvas.current) {
      fabricCanvas.current.getObjects().forEach((obj) => {
        if (obj instanceof fabric.Textbox && obj.isEditing) {
          obj.exitEditing();
        }
      });
    }

    const target = e.target as HTMLElement;
    console.log('target: ', target);
    const isInputOrTextarea =
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.getAttribute('data-fabric') === 'textarea';

    if (isInputOrTextarea) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }

    e.preventDefault();
    e.stopPropagation();

    const url = e.dataTransfer.getData('image-url');
    console.log('image-url: ', url);
    if (!url || !fabricCanvas.current) return;

    const canvas = fabricCanvas.current;
    const pointer = canvas.getPointer(e.nativeEvent);

    const tempImg = new Image();
    tempImg.onerror = () => {
      console.error('Failed to load image from URL:', url);
    };
    tempImg.onload = () => {
      const scale = Math.min(
        1,
        canvas.width! / (tempImg.width * 2),
        canvas.height! / (tempImg.height * 2),
        0.5
      );

      const img = new fabric.Image(tempImg, {
        left: pointer.x,
        top: pointer.y,
        scaleX: scale,
        scaleY: scale,
      });

      img.set('isNew', true);
      canvas.add(img);
      canvas.setActiveObject(img);
      canvas.renderAll();

      if (!slideId) return;

      // if (onSavingStateChange) onSavingStateChange(true);

      const cw = canvas.getWidth()!;
      const ch = canvas.getHeight()!;
      const w = img.getScaledWidth();
      const h = img.getScaledHeight();

      const payload: SlideElementPayload = {
        positionX: (img.left! / cw) * 100,
        positionY: (img.top! / ch) * 100,
        width: (w / cw) * 100,
        height: (h / ch) * 100,
        rotation: img.angle || 0,
        layerOrder: canvas.getObjects().indexOf(img),
        slideElementType: 'IMAGE',
        sourceUrl: url,
      };
      slidesApi
        .addSlidesElement(slideId, payload)
        .then((res) => {
          // console.log('Tạo image element thành công:', res.data);
          img.set('slideElementId', res.data.data.slideElementId);
          img.set('isNew', false);

          // Tạo object element mới để gửi lên parent
          const newElement: SlideElementPayload = {
            slideElementId: res.data.data.slideElementId,
            ...payload,
          };

          // Gọi onUpdate để parent cập nhật state slidesElements
          // const updatedSlideElements = [...slideElements, newElement];

          // Call onUpdate with merged elements
          // onUpdate?.({
          //   title: slideTitle,
          //   content: slideContent,
          //   slideElements: updatedSlideElements,
          // });

          const merged = [...slideElementsRef.current];
          if (
            !merged.find(
              (x) => x.slideElementId === res.data.data.slideElementId
            )
          ) {
            merged.push(newElement);
          }
          slideElementsRef.current = merged;

          onUpdate?.({
            title: slideTitle,
            content: slideContent,
            slideElements: merged,
          });

          console.log('Data đã gửi: ', {
            title: slideTitle,
            content: slideContent,
            slideElements: [...slideElements, newElement],
          });
        })
        .catch((err) => {
          console.error('Lỗi khi tạo image element:', err);
        });
    };
    tempImg.src = url;
  };

  return (
    <EditorContextMenu>
      <div
        className="border-2 border-blue-400 mx-auto shadow-lg ring-4 ring-blue-300/50 ring-offset-0"
        ref={containerRef}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        style={{
          position: 'relative',
          width: `${width}px`,
          height: `${height}px`,
          overflow: 'hidden',
          transformOrigin: 'top left',
          backgroundColor: 'transparent',
        }}
      >
        <canvas ref={canvasRef} />
      </div>
    </EditorContextMenu>
  );
};

export default FabricEditor;
