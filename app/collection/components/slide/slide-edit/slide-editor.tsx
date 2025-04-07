'use client';

import React, { useEffect, useRef } from 'react';
import { useFabricCanvas } from './useFabricCanvas';
import { initFabricEvents } from './useFabricEvents';
import { ToolbarHandlers } from './useToolbarHandlers';
import * as fabric from 'fabric';
import { EditorContextMenu } from '../sidebar/editor-context-menu';
export interface FabricEditorProps {
  slideTitle: string;
  slideContent: string;
  onUpdate: (data: { title: string; content: string }) => void;
  backgroundColor?: string;
  onImageDrop?: (url: string) => void;
}

const FabricEditor: React.FC<FabricEditorProps> = ({
  slideTitle,
  slideContent,
  onUpdate,
  backgroundColor,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { fabricCanvas, initCanvas } = useFabricCanvas();


  useEffect(() => {
    const observer = new MutationObserver((mutationsList) => {
      for (const mutation of mutationsList) {
        mutation.addedNodes.forEach((node) => {
          if (
            node instanceof HTMLElement &&
            node.tagName.toLowerCase() === 'textarea' &&
            node.getAttribute('data-fabric') === 'textarea'
          ) {
            node.addEventListener('drop', (e: Event) => {
              e.preventDefault();
              e.stopPropagation();
              console.log(
                'Blocked drop on Fabric textarea via MutationObserver.'
              );
            });
          }
        });
      }
    });

    if (containerRef.current) {
      observer.observe(containerRef.current, {
        childList: true,
        subtree: true,
      });
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleDropOnTextbox = (e: DragEvent) => {
      // Lấy event path (bao gồm tất cả các element trong chuỗi event)
      const path = e.composedPath() as HTMLElement[];
      const isOverTextbox = path.some((el) => {
        console.log('isOverTextbox', el);
        return el.getAttribute && el.getAttribute('data-fabric') === 'textarea';
      });
      if (isOverTextbox) {
        e.preventDefault();
        e.stopPropagation();
        console.log('Blocked drop on textbox');
      }
    };

     window.addEventListener('drop', handleDropOnTextbox, true);
     return () => {
       window.removeEventListener('drop', handleDropOnTextbox, true);
     };
  }, []);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = initCanvas(canvasRef.current, backgroundColor || '#fff');
    const { title, content } = initFabricEvents(canvas, onUpdate);
    ToolbarHandlers(canvas, title, content);

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput =
        ['INPUT', 'TEXTAREA'].includes(target.tagName) ||
        target.isContentEditable;
      if (isInput) return;

      if (e.key === 'Delete' || e.key === 'Backspace') {
        const activeObjects = canvas.getActiveObjects();
        if (activeObjects.length) {
          activeObjects.forEach((obj) => canvas.remove(obj));
          canvas.discardActiveObject();
          canvas.requestRenderAll();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      canvas.dispose();
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [backgroundColor]);

  const blurFabricTextArea = () => {
    const fabricTextArea = document.querySelector(
      'textarea[data-fabric="textarea"]'
    ) as HTMLTextAreaElement | null;
    if (fabricTextArea) {
      fabricTextArea.blur();
    }
  };

  const handleDragEnter = (e: React.DragEvent) => {
    //e.preventDefault();
    e.stopPropagation();

    if (fabricCanvas.current) {
      // Thoát tất cả các textbox đang ở chế độ editing
      fabricCanvas.current.getObjects().forEach((obj) => {
        if (obj.type === 'textbox' && (obj as fabric.Textbox).isEditing) {
          (obj as fabric.Textbox).exitEditing();
        }
      });

      // Blur bất kỳ phần tử nào đang focus trong DOM
      if (
        document.activeElement instanceof HTMLElement &&
        document.activeElement !== document.body
      ) {
        document.activeElement.blur();
      }

      // Đảm bảo không có textarea của Fabric.js đang focus
      const fabricTextAreas = document.querySelectorAll(
        'textarea[data-fabric="textarea"]'
      );
      fabricTextAreas.forEach((textarea) => {
        (textarea as HTMLTextAreaElement).blur();
      });
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation(); // ngăn propagate vào textbox

    console.log(document.activeElement);

    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }

    blurFabricTextArea();

    const url = e.dataTransfer.getData('image-url');
    if (!url || !fabricCanvas.current) return;

    const canvas = fabricCanvas.current;
    const pointer = canvas.getPointer(e.nativeEvent);

    const tempImg = new Image();
    tempImg.crossOrigin = 'anonymous';
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

      canvas.add(img);
      canvas.setActiveObject(img);
      canvas.renderAll();
    };
    tempImg.src = url;
  };

  useEffect(() => {
    // Chặn drop vào textarea Fabric ở giai đoạn capture
    const handleDropCapture = (e: DragEvent) => {
      // Kiểm tra xem đường đi của event có chứa textarea Fabric hay không
      const path = e.composedPath();
      const isFabricTextarea = path.some(
        (el) =>
          el instanceof HTMLElement &&
          el.getAttribute('data-fabric') === 'textarea'
      );

      if (isFabricTextarea) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        console.log('Blocked drop/dragover on Fabric textarea (capture).');
      }
    };

    const handleDragOverCapture = (e: DragEvent) => {
      const path = e.composedPath();
      const isFabricTextarea = path.some(
        (el) =>
          el instanceof HTMLElement &&
          el.getAttribute('data-fabric') === 'textarea'
      );

      if (isFabricTextarea) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    document.addEventListener('drop', handleDropCapture, true);
    document.addEventListener('dragover', handleDragOverCapture, true);

    return () => {
      document.removeEventListener('drop', handleDropCapture, true);
      document.removeEventListener('dragover', handleDragOverCapture, true);
    };
  }, []);


  return (
    <EditorContextMenu>
      <div
        ref={containerRef}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onDragEnter={handleDragEnter}
        className="relative w-full max-w-3xl h-full"
      >
        <canvas ref={canvasRef} className="z-20" />
      </div>
    </EditorContextMenu>
  );
};

export default FabricEditor;
