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
  onUpdate: (data: { title: string; content: string }) => void;
  backgroundColor?: string;
  width?: number;
  height?: number;
  zoom?: number;
  slideId?: string;
  onSavingStateChange?: (isSaving: boolean) => void;
  slideElements: SlideElementPayload[];
  backgroundImage?: string; // Sửa kiểu từ any thành SlideElementPayload[]
}

const FabricEditor: React.FC<FabricEditorProps> = ({
  slideTitle,
  slideContent,
  onUpdate,
  backgroundColor,
  width,
  height = 430,
  zoom = 1,
  slideId,
  onSavingStateChange,
  slideElements,
  backgroundImage,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { fabricCanvas, initCanvas } = useFabricCanvas();
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const isProcessingRef = useRef(false);

  console.log('slideId', slideId);
  console.log('backgroundImage 111', backgroundImage);

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

  const updateSlideElement = debounce((obj: fabric.Object) => {
    if (!obj || (obj.type !== 'image' && obj.type !== 'textbox')) return;
    const slideElementId = obj.get('slideElementId');
    if (!slideElementId) return;
    const canvas = fabricCanvas.current;
    if (!canvas) return;

    if (!slideId) return;

    if (onSavingStateChange) onSavingStateChange(true);

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

    slidesApi
      .updateSlidesElement(slideId, slideElementId, payload)
      .then((res) => console.log('Updated', res.data))
      .catch((err) => console.error('Update failed', err))
      .finally(() => {
        if (onSavingStateChange) onSavingStateChange(false);
      });
  }, 500);

  const loadSlideElements = () => {
    if (!fabricCanvas.current) {
      console.warn('Canvas chưa được khởi tạo');
      return;
    }

    const canvas = fabricCanvas.current;

    // Xóa canvas hiện tại để tránh trùng lặp
    canvas.clear();

    // Nếu không có slideElements, để canvas trống
    if (!slideElements || slideElements.length === 0) {
      console.log('Không có slideElements, để canvas trống');
      canvas.renderAll();
      saveState();
      return;
    }

    console.log(
      'Bắt đầu render slideElements:',
      JSON.stringify(slideElements, null, 2)
    );

    // Sắp xếp elements theo layerOrder
    const sortedElements = [...slideElements].sort(
      (a, b) => a.layerOrder - b.layerOrder
    );

    // Tải tất cả ảnh trước
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
          console.log(`Render element ${element.slideElementId}:`, element);

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

            // Điều chỉnh vị trí nếu nằm ngoài canvas
            const adjustedLeft = left < 0 ? 0 : left;
            const adjustedTop = top < 0 ? 0 : top;

            const scaleX = img.width > 0 ? elementWidth / img.width : 1;
            const scaleY = img.height > 0 ? elementHeight / img.height : 1;

            img.set({
              left: adjustedLeft,
              top: adjustedTop,
              scaleX: isNaN(scaleX) ? 1 : scaleX,
              scaleY: isNaN(scaleY) ? 1 : scaleY,
              angle: element.rotation || 0,
              slideElementId: element.slideElementId,
              sourceUrl: element.sourceUrl,
              selectable: true, // Giữ tương tác trong editor
            });

            console.log(`Thêm image ${element.slideElementId} vào canvas`, {
              left: img.left,
              top: img.top,
              scaleX: img.scaleX,
              scaleY: img.scaleY,
              width: img.width,
              height: img.height,
            });
            canvas.add(img);
          }
        });

        // // Thêm đối tượng debug
        // canvas.add(
        //   new fabric.Text('Debug Canvas', {
        //     left: 50,
        //     top: 50,
        //     fontSize: 20,
        //     fill: '#888',
        //   })
        // );
        // console.log('Thêm text debug để kiểm tra canvas');
        // console.log(
        //   'Objects trong canvas (sau khi render):',
        //   canvas.getObjects()
        // );

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

    if (backgroundImage) {
      FabricImage.fromURL(backgroundImage).then((img) => {
        img.set({
          scaleX: canvas.getWidth() / img.width!,
          scaleY: canvas.getHeight() / img.height!,
          originX: 'left',
          originY: 'top',
        });
        canvas.backgroundImage = img;
        canvas.renderAll();
      });
    };

    const { title, content } = initFabricEvents(canvas, onUpdate);
    const cleanupToolbar = slideId
      ? ToolbarHandlers(canvas, title, content, slideId)
      : () => {};

    loadSlideElements();

    const handleKeyDown = (e: KeyboardEvent) => {
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
          activeObjects.forEach((obj) => {
            const slideElementId = obj.get('slideElementId');
            if (slideElementId && slideId) {
              if (onSavingStateChange) onSavingStateChange(true);

              if (obj.type === 'image') {
                const src = (obj as fabric.Image).getSrc();
                if (src && src.includes('s3.amazonaws.com')) {
                  const filePath = src.split('s3.amazonaws.com/')[1];
                  storageApi
                    .deleteSingleFile(filePath)
                    .then((res) => {
                      console.log('Xóa file từ AWS S3 thành công:', res);
                    })
                    .catch((err) => {
                      console.error('Lỗi khi xóa file từ AWS S3:', err);
                    });
                }
              }

              canvas.remove(obj);
              slidesApi
                .deleteSlidesElement(slideId, slideElementId)
                .then((res) => {
                  console.log('Xóa element thành công', res.data);
                })
                .catch((err) => {
                  console.error('Lỗi xóa element', err);
                })
                .finally(() => {
                  if (onSavingStateChange) onSavingStateChange(false);
                });
            } else {
              canvas.remove(obj);
            }
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
        console.log(
          'Đối tượng vừa được tạo:',
          JSON.stringify(obj.toJSON(), null, 2)
        );
        saveState();
      }
    });

    canvas.on('object:modified', (e) => {
      const obj = e.target;
      if (!obj) return;

      console.log(
        'Đối tượng vừa được thay đổi:',
        JSON.stringify(obj.toJSON(), null, 2)
      );

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

      console.log('Text changed:', obj.toJSON());
      updateSlideElement(obj);
      saveState();
    });

    canvas.on('text:selection:changed', (e) => {
      const obj = e.target as fabric.Textbox;
      if (!obj || obj.type !== 'textbox') return;

      console.log('Text selection changed:', obj.toJSON());
      updateSlideElement(obj);
      saveState();
    });

    canvas.on('text:editing:exited', (e) => {
      const obj = e.target as fabric.Textbox;
      if (!obj || obj.type !== 'textbox') return;

      console.log('Text editing exited:', obj.toJSON());
      updateSlideElement(obj);
      saveState();
    });

    canvas.on('drop', (e) => {
      const target = e.target;
      console.log('Đối tượng target: ', target);
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
      cleanupToolbar();
      canvas.dispose();
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [backgroundColor, width, height, zoom, slideId, slideElements]); // Thêm slideElements vào dependencies

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

      if (onSavingStateChange) onSavingStateChange(true);

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
          console.log('Tạo image element thành công:', res.data);
          img.set('slideElementId', res.data.data.slideElementId);
          img.set('isNew', false);
        })
        .catch((err) => {
          console.error('Lỗi khi tạo image element:', err);
        })
        .finally(() => {
          if (onSavingStateChange) onSavingStateChange(false);
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
        }}
      >
        <canvas ref={canvasRef} />
      </div>
    </EditorContextMenu>
  );
};

export default FabricEditor;
