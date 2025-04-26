'use client';

import React, { useEffect, useRef } from 'react';
import * as fabric from 'fabric';
import { useFabricCanvas } from './useFabricCanvas';
import { initFabricEvents } from './useFabricEvents';
import { ToolbarHandlers } from './useToolbarHandlers';
import { EditorContextMenu } from '../sidebar/editor-context-menu';

export interface FabricEditorProps {
  slideTitle: string;
  slideContent: string;
  onUpdate: (data: { title: string; content: string }) => void;
  backgroundColor?: string;
  width?: number;
}

const FabricEditor: React.FC<FabricEditorProps> = ({
  slideTitle,
  slideContent,
  onUpdate,
  backgroundColor,
  width = 1024,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { fabricCanvas, initCanvas } = useFabricCanvas();

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = initCanvas(canvasRef.current, backgroundColor || '#fff', width);
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

    canvas.on('selection:created', (e) => {
      const active = e.selected?.[0];
      if (active && active.type === 'image') {
        console.log('Thuộc tính của hình ảnh được chọn:');
        console.log(JSON.stringify(active.toJSON(), null, 2));
      }
    });

    canvas.on('selection:updated', (e) => {
      const active = e.selected?.[0];
      if (active && active.type === 'image') {
        console.log('Thuộc tính của hình ảnh được cập nhật:');
        console.log(JSON.stringify(active.toJSON(), null, 2));
      }
    });

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      canvas.dispose();
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [backgroundColor, width]);

  useEffect(() => {
    const handleDrop = (e: DragEvent) => {
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
        if (e.dataTransfer) {
          e.dataTransfer.clearData();
        }
      }
    };

    const handleDragOver = (e: DragEvent) => {
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

    document.addEventListener('drop', handleDrop, true);
    document.addEventListener('dragover', handleDragOver, true);

    return () => {
      document.removeEventListener('drop', handleDrop, true);
      document.removeEventListener('dragover', handleDragOver, true);
    };
  }, []);

  useEffect(() => {
    const observer = new MutationObserver(() => {
      const textareas = document.querySelectorAll<HTMLTextAreaElement>(
        'textarea[data-fabric="textarea"]'
      );
      textareas.forEach((textarea) => {
        textarea.style.pointerEvents = 'none';
      });
    });

    if (containerRef.current) {
      observer.observe(containerRef.current, {
        childList: true,
        subtree: true,
      });
    }

    return () => observer.disconnect();
  }, []);

  const handleDrop = (e: React.DragEvent) => {
    const target = e.target as HTMLElement;
    const isInputOrTextarea =
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.getAttribute('data-fabric') === 'textarea';

    if (isInputOrTextarea) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }

    if (fabricCanvas.current) {
      fabricCanvas.current.getObjects().forEach((obj) => {
        if (obj.type === 'textbox' && (obj as fabric.Textbox).isEditing) {
          (obj as fabric.Textbox).exitEditing();
        }
      });
    }

    e.preventDefault();
    e.stopPropagation();

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

  return (
    <EditorContextMenu>
      <div
        ref={containerRef}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        className="relative w-full max-w-3xl h-full"
      >
        <canvas ref={canvasRef} />
      </div>
    </EditorContextMenu>
  );
};

export default FabricEditor;
