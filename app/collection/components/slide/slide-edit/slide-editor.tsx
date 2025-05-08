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
}

const FabricEditor: React.FC<FabricEditorProps> = ({
  slideTitle,
  slideContent,
  onUpdate,
  backgroundColor,
  width,
  height = 460,
  zoom = 1,
  slideId,
  onSavingStateChange,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { fabricCanvas, initCanvas } = useFabricCanvas();
  const [history, setHistory] = useState<string[]>([]); // Lưu lịch sử canvas dưới dạng JSON
  const [historyIndex, setHistoryIndex] = useState<number>(-1); // Chỉ số hiện tại trong lịch sử
  const isProcessingRef = useRef(false); // Tránh vòng lặp khi xử lý Undo/Redo

  console.log('slideTitle', slideTitle);

  // Hàm lưu trạng thái canvas vào lịch sử
  const saveState = () => {
    if (isProcessingRef.current) return; // Bỏ qua nếu đang xử lý Undo/Redo
    const canvas = fabricCanvas.current;
    if (!canvas) return;

    const json = JSON.stringify(canvas.toJSON()); // Loại bỏ tham số
    setHistory((prev) => {
      // Xóa các trạng thái sau historyIndex nếu có (tránh nhánh lịch sử)
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push(json);
      return newHistory;
    });
    setHistoryIndex((prev) => prev + 1);
  };

  // Hàm khôi phục trạng thái canvas từ JSON
  const restoreState = (json: string) => {
    const canvas = fabricCanvas.current;
    if (!canvas) return;

    isProcessingRef.current = true; // Đánh dấu đang xử lý
    canvas.loadFromJSON(json, () => {
      canvas.renderAll();
      isProcessingRef.current = false; // Kết thúc xử lý
    });
  };

  // Hàm Undo
  const undo = () => {
    if (historyIndex <= 0) return; // Không có trạng thái để Undo
    const newIndex = historyIndex - 1;
    setHistoryIndex(newIndex);
    restoreState(history[newIndex]);
  };

  // Hàm Redo
  const redo = () => {
    if (historyIndex >= history.length - 1) return; // Không có trạng thái để Redo
    const newIndex = historyIndex + 1;
    setHistoryIndex(newIndex);
    restoreState(history[newIndex]);
  };

  // Hàm chung để cập nhật slide element
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

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = initCanvas(
      canvasRef.current,
      backgroundColor || '#fff',
      width
    );
    canvas.setDimensions({ width: width, height: height });
    canvas.setZoom(zoom);
    const { title, content } = initFabricEvents(canvas, onUpdate);
    const cleanupToolbar = ToolbarHandlers(canvas, title, content);

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput =
        ['INPUT', 'TEXTAREA'].includes(target.tagName) ||
        target.isContentEditable;
      if (isInput) return;

      // Xử lý Ctrl + Z (Undo) và Ctrl + Y / Ctrl + Shift + Z (Redo)
      if (e.ctrlKey) {
        if (e.key === 'z' || e.key === 'Z') {
          if (e.shiftKey) {
            // Ctrl + Shift + Z: Redo
            e.preventDefault();
            redo();
          } else {
            // Ctrl + Z: Undo
            e.preventDefault();
            undo();
          }
        } else if (e.key === 'y' || e.key === 'Y') {
          // Ctrl + Y: Redo
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
          saveState(); // Lưu trạng thái sau khi xóa
        }
      }
    };

    // Sự kiện để theo dõi thay đổi và lưu lịch sử
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

    // Lưu trạng thái ban đầu
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
  }, [backgroundColor, width, height, zoom, slideId]);

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
