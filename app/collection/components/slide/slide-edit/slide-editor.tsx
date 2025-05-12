'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as fabric from 'fabric';
import { useFabricCanvas } from './useFabricCanvas';
import { initFabricEvents } from './useFabricEvents';
import { ToolbarHandlers } from './useToolbarHandlers';
import { EditorContextMenu } from '../sidebar/editor-context-menu';
import { slidesApi } from '@/api-client/slides-api';
import { storageApi } from '@/api-client/storage-api';
import type { SlideElementPayload } from '@/types/slideInterface';
import { debounce } from 'lodash';
import { FabricImage } from 'fabric';
const HARD_SLIDE_ID = 'b6cb121c-1f5c-461b-b183-098468be7050';
const ORIGINAL_CANVAS_WIDTH = 812;

export interface FabricEditorProps {
  slideTitle: string;
  slideContent: string;
  onUpdate: (data: { title: string; content: string; slideElements?: SlideElementPayload[]; }) => void;
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
  backgroundColor = '#fff',
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
  //console.log('backgroundColor 111', backgroundColor);
  const S3_BUCKET_URL = 'https://priziq-spring-uploader.s3.amazonaws.com/';


  const updateSpecificElement = (updatedElement: SlideElementPayload) => {
    const canvas = fabricCanvas.current;
    if (!canvas) return;

    // Tìm đối tượng trên canvas dựa trên slideElementId
    const object = canvas
      .getObjects()
      .find(
        (obj) => obj.get('slideElementId') === updatedElement.slideElementId
      );

    if (object) {
      const zoom = canvas.getZoom();
      const canvasWidth = canvas.getWidth()! / zoom;
      const canvasHeight = canvas.getHeight()! / zoom;

      // Cập nhật thuộc tính của đối tượng
      object.set({
        left: (updatedElement.positionX / 100) * canvasWidth * zoom,
        top: (updatedElement.positionY / 100) * canvasHeight * zoom,
        angle: updatedElement.rotation || 0,
      });

      if (updatedElement.slideElementType === 'TEXT') {
        const textboxJson = JSON.parse(updatedElement.content);
        const fontSize = (textboxJson.fontSize / 100) * ORIGINAL_CANVAS_WIDTH;
        object.set({
          width: (updatedElement.width / 100) * canvasWidth,
          height: (updatedElement.height / 100) * canvasHeight,
          fontSize,
          text: textboxJson.text,
          styles: textboxJson.styles,
        });
      } else if (updatedElement.slideElementType === 'IMAGE') {
        const elementWidth = (updatedElement.width / 100) * canvasWidth;
        const elementHeight = (updatedElement.height / 100) * canvasHeight;
        const img = object as fabric.Image;
        img.set({
          scaleX: elementWidth / img.width!,
          scaleY: elementHeight / img.height!,
        });
      }

      canvas.renderAll();
      saveState();
    }
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
      const img = await fabric.FabricImage.fromURL(imageUrl);
      if (!img.width || !img.height) {
        console.error('Hình ảnh nền không có kích thước hợp lệ:', imageUrl);
        return;
      }

      const canvasWidth = canvas.getWidth();
      const canvasHeight = canvas.getHeight();
      const imageAspect = img.width / img.height;
      const canvasAspect = canvasWidth / canvasHeight;

      let scaleX: number, scaleY: number;

      // Tính tỷ lệ để bao phủ toàn bộ canvas (giống object-fit: cover)
      if (imageAspect > canvasAspect) {
        // Hình ảnh rộng hơn canvas, scale theo chiều cao
        scaleY = canvasHeight / img.height;
        scaleX = scaleY * imageAspect;
      } else {
        // Hình ảnh cao hơn canvas, scale theo chiều rộng
        scaleX = canvasWidth / img.width;
        scaleY = scaleX / imageAspect;
      }

      img.set({
        scaleX: scaleX,
        scaleY: scaleY,
        originX: 'center',
        originY: 'center',
        left: canvasWidth / 2,
        top: canvasHeight / 2,
      });

      canvas.backgroundImage = img;
      canvas.renderAll();
    } catch (err) {
      console.error('Lỗi khi tải hình ảnh nền:', err);
    }
  };

  const updateSlideElement = debounce( async (obj: fabric.Object) => {
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
      const textboxJson = {
        ...obj.toJSON(),
        fontSize: fontSizePercent,
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
      };
    } else {
      payload = {
        ...base,
        slideElementType: 'IMAGE',
        sourceUrl: obj.get('sourceUrl') || (obj as fabric.Image).getSrc(),
      };
    }

    try {
      const res = await slidesApi.updateSlidesElement(
        slideId,
        slideElementId,
        payload
      );
      //console.log('API response:', JSON.stringify(res.data, null, 2));

      // Xử lý response linh hoạt
      const updatedElement = res.data.data || res.data;
      const updatedElements = slideElements?.map((element) =>
        element.slideElementId === slideElementId
          ? { ...element, ...updatedElement }
          : element
      );

      // Log để kiểm tra slideElements gửi đi
      // console.log(
      //   'Sending slideElements to onUpdate:',
      //   JSON.stringify(updatedElements, null, 2)
      // );

      if (onUpdate) {
        onUpdate({
          title: slideTitle,
          content: slideContent,
          slideElements: updatedElements,
        });
      }
    } catch (err) {
      console.error('Update failed:', err);
    }
  }, 500);



  const loadSlideElements = () => {
    if (!fabricCanvas.current) {
      console.warn('Canvas chưa được khởi tạo');
      return;
    }

    const canvas = fabricCanvas.current;
    // activeObjectRef.current = canvas.getActiveObject();
    // Xóa canvas và thiết lập lại nền
    canvas.clear();
    canvas.backgroundImage = undefined;
    canvas.backgroundColor = backgroundColor || '#fff';
    canvas.renderAll();

    if (backgroundImage) {
      setBackgroundImageWithCover(canvas, backgroundImage);
    } else {
      canvas.backgroundColor = backgroundColor || '#fff';
      canvas.renderAll();
    }

    // Nếu không có slideElements, để canvas trống
    if (!slideElements || slideElements.length === 0) {
      canvas.renderAll();
      saveState();
      return;
    }

    // Sắp xếp elements theo layerOrder
    const sortedElements = [...slideElements].sort(
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
              console.log(`Ảnh tải thành công: ${element.sourceUrl}`, {
                width: imgElement.width,
                height: imgElement.height,
              });
              resolve({ element, imgElement });
            };
            imgElement.onerror = (err) => {
              reject(err);
            };
            imgElement.src = element.sourceUrl!;
          })
      );

    Promise.all(imagePromises)
      .then((loadedImages) => {
        // Render từng element
        sortedElements.forEach((element: SlideElementPayload) => {
          // console.log(`Render element ${element.slideElementId}:`, element);

          const zoom = canvas.getZoom();
          const canvasWidth = canvas.getWidth()! / zoom;
          const canvasHeight = canvas.getHeight()! / zoom;

          if (element.slideElementType === 'TEXT') {
            if (!element.content) {
              console.warn(`Element ${element.slideElementId} thiếu content`);
              return;
            }

            let textboxJson;
            try {
              textboxJson = JSON.parse(element.content);
            } catch (err) {
              console.error(
                `Lỗi parse content cho element ${element.slideElementId}:`,
                err
              );
              return;
            }

            const { type, ...safeTextboxJson } = textboxJson;
            const fontSize =
              (textboxJson.fontSize / 100) * ORIGINAL_CANVAS_WIDTH;

              let fabricStyles: {
                [lineIndex: string]: { [charIndex: string]: any };
              } = {};
              if (textboxJson.styles && Array.isArray(textboxJson.styles)) {
                textboxJson.styles.forEach(
                  (styleItem: { start: number; end: number; style: any }) => {
                    const { start, end, style } = styleItem;
                    for (let i = start; i < end; i++) {
                      // Giả sử văn bản chỉ có một dòng (lineIndex = 0)
                      // Nếu văn bản có nhiều dòng, cần tính lineIndex dựa trên ký tự
                      const lineIndex = '0'; // Cần logic để xác định dòng nếu có nhiều dòng
                      if (!fabricStyles[lineIndex]) {
                        fabricStyles[lineIndex] = {};
                      }
                      fabricStyles[lineIndex][i] = {
                        ...style,
                        fontSize: style.fontSize
                          ? (style.fontSize / 100) * ORIGINAL_CANVAS_WIDTH
                          : fontSize,
                      };
                    }
                  }
                );
              }


            const textbox = new fabric.Textbox(textboxJson.text || 'New Text', {
              ...safeTextboxJson,
              fontSize,
              left: (element.positionX / 100) * canvasWidth * zoom,
              top: (element.positionY / 100) * canvasHeight * zoom,
              width: (element.width / 100) * canvasWidth,
              height: (element.height / 100) * canvasHeight,
              angle: element.rotation || 0,
              slideElementId: element.slideElementId,
              
            });

            if (textboxJson.styles) {
              for (const lineIndex in textboxJson.styles) {
                const line = textboxJson.styles[lineIndex];
                for (const charIndex in line) {
                  if (line[charIndex].fontSize) {
                    line[charIndex].fontSize =
                      (line[charIndex].fontSize / 100) * ORIGINAL_CANVAS_WIDTH;
                  }
                }
              }
              textbox.set('styles', textboxJson.styles);
            }

            if (Object.keys(fabricStyles).length > 0) {
              textbox.set('styles', fabricStyles);
            }

            console.log(`Thêm textbox ${element.slideElementId} vào canvas`);
            canvas.add(textbox);
          } else if (element.slideElementType === 'IMAGE') {
            if (!element.sourceUrl) {
              console.warn(`Element ${element.slideElementId} thiếu sourceUrl`);
              return;
            }

            const loadedImage = loadedImages.find(
              (img) => img.element.sourceUrl === element.sourceUrl
            );
            if (!loadedImage) {
              console.error(
                `Không tìm thấy ảnh đã tải cho ${element.sourceUrl}`
              );
              return;
            }

            const { imgElement } = loadedImage;
            const img = new fabric.Image(imgElement);
            if (!img.width || !img.height) {
              console.error(
                `Lỗi: Ảnh không có kích thước hợp lệ - ${element.sourceUrl}`
              );
              return;
            }

            // Tính toán vị trí và kích thước
            const left = (element.positionX / 100) * canvasWidth * zoom;
            const top = (element.positionY / 100) * canvasHeight * zoom;
            const elementWidth = (element.width / 100) * canvasWidth;
            const elementHeight = (element.height / 100) * canvasHeight;

            const scaleX = img.width > 0 ? elementWidth / img.width : 1;
            const scaleY = img.height > 0 ? elementHeight / img.height : 1;

            img.set({
              left: left,
              top: top,
              scaleX: isNaN(scaleX) ? 1 : scaleX,
              scaleY: isNaN(scaleY) ? 1 : scaleY,
              angle: element.rotation || 0,
              slideElementId: element.slideElementId,
              sourceUrl: element.sourceUrl,
              selectable: true, // Giữ tương tác trong editor
            });

            canvas.add(img);
          }
        });

        canvas.renderAll();
        saveState();
      })
      .catch((err) => {
        console.error('Lỗi khi tải slide elements:', err);
      });
  };


  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = initCanvas(
      canvasRef.current,
      backgroundColor || '#fff',
      width
    );
    canvas.setDimensions({ width: width, height: height });
    canvas.setZoom(zoom);

    if (fabricCanvas.current) {
      // Xóa cả hai nền trước khi thiết lập
      fabricCanvas.current.backgroundImage = undefined;
      fabricCanvas.current.backgroundColor = backgroundColor || '#fff';

      // Ưu tiên backgroundImage, nếu không có thì dùng backgroundColor
      if (backgroundImage) {
        FabricImage.fromURL(backgroundImage)
          .then((img) => {
            if (fabricCanvas.current) {
              img.set({
                scaleX: canvas.getWidth() / img.width!,
                scaleY: canvas.getHeight() / img.height!,
                originX: 'left',
                originY: 'top',
              });
              fabricCanvas.current.backgroundImage = img;
              fabricCanvas.current.renderAll();
            }
          })
          .catch((err) => {
            console.error('Lỗi khi tải backgroundImage:', err);
          });
      } else {
        fabricCanvas.current.backgroundColor = backgroundColor || '#fff';
        fabricCanvas.current.renderAll();
      }
    } else {
      console.warn('fabricCanvas.current is undefined');
    }

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
      } else {
        console.warn('fabricCanvas.current is undefined');
      }
    };

    const handleSetBackgroundImage = (e: CustomEvent<{ url: string; slideId?: string }>) => {
      console.log('Received fabric:set-background-image:', e.detail.url);
      if (!e.detail.slideId || e.detail.slideId !== slideId) {
        console.log(
          `Ignoring fabric:set-background-image: slideId mismatch or undefined (${e.detail.slideId} !== ${slideId})`
        );
        return;
      }

      if (fabricCanvas.current) {
        if (e.detail.url) {
          setBackgroundImageWithCover(fabricCanvas.current, e.detail.url);
        } else {
          fabricCanvas.current.backgroundImage = undefined;
          fabricCanvas.current.backgroundColor = backgroundColor || '#fff';
          fabricCanvas.current.renderAll();
        }
        console.log('Updated canvas backgroundImage:', e.detail.url);
      }
    };

    window.addEventListener(
      'fabric:set-background-color',
      handleSetBackgroundColor as EventListener
    );
    window.addEventListener(
      'fabric:set-background-image',
      handleSetBackgroundImage as EventListener
    );

    const { title, content } = initFabricEvents(canvas, onUpdate);
    const cleanupToolbar = slideId
      ? ToolbarHandlers(canvas, title, content, slideId, onUpdate, slideElements)
      : () => {};

    loadSlideElements();

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

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener(
        'fabric:set-background-color',
        handleSetBackgroundColor as EventListener
      );
      window.removeEventListener(
        'fabric:set-background-image',
        handleSetBackgroundImage as EventListener
      );
      cleanupToolbar();
      canvas.dispose();
      document.removeEventListener('keydown', handleKeyDown);
    };
  },[backgroundColor, width, height, zoom, slideId, backgroundImage]);

  // useEffect(() => {
  //   if (!fabricCanvas.current || !slideElements) return;

  //   slideElements.forEach((element) => {
  //     updateSpecificElement(element);
  //   });
  // }, [slideElements]);

  useEffect(() => {
    if (fabricCanvas.current && backgroundColor) {
      fabricCanvas.current.backgroundImage = undefined;
      fabricCanvas.current.backgroundColor = backgroundColor;
      fabricCanvas.current.renderAll();
    }
  }, [backgroundColor]);

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
        })
        .catch((err) => {
          console.error('Lỗi khi tạo image element:', err);
        })
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
