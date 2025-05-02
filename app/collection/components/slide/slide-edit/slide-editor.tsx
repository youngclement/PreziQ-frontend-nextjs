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

    const canvas = initCanvas(
      canvasRef.current,
      backgroundColor || '#fff',
      width
    );
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

    // Sự kiện khi đối tượng được chọn
    canvas.on('selection:created', (e) => {
      const active = e.selected?.[0];
      if (active && active.type === 'image') {
        console.log('Thuộc tính của hình ảnh được chọn:');
        console.log(JSON.stringify(active.toJSON(), null, 2));
      }
    });

    // Sự kiện khi lựa chọn được cập nhật
    canvas.on('selection:updated', (e) => {
      const active = e.selected?.[0];
      if (active && active.type === 'image') {
        console.log('Thuộc tính của hình ảnh được cập nhật:');
        console.log(JSON.stringify(active.toJSON(), null, 2));
      }
    });

    // Thêm sự kiện khi đối tượng được tạo
    canvas.on('object:added', (e) => {
      const obj = e.target;
      if (obj) {
        console.log('Đối tượng vừa được tạo:');
        console.log(JSON.stringify(obj.toJSON(), null, 2));
      }
    });

    // Thêm sự kiện khi đối tượng được thay đổi
    canvas.on('object:modified', (e) => {
      const obj = e.target;
      if (obj) {
        console.log('Đối tượng vừa được thay đổi:');
        console.log(JSON.stringify(obj.toJSON(), null, 2));
      }
    });

    // Ngăn Fabric.js chèn URL vào textbox nhưng không chặn sự kiện hoàn toàn
    canvas.on('drop', (e) => {
      const target = e.target;
        console.log('Đối tượng target: ', target);
      if (target && target instanceof fabric.Textbox) {
        e.e.preventDefault(); // Ngăn Fabric.js chèn URL vào textbox
        return false; // Ngăn Fabric.js xử lý thêm
      }
    });

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      canvas.dispose();
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [backgroundColor, width]);

  useEffect(() => {
    const handleDragStart = () => {
      if (fabricCanvas.current) {
        fabricCanvas.current.getObjects().forEach((obj) => {
          if (obj instanceof fabric.Textbox) {
            obj.lockMovementX = true;
            obj.lockMovementY = true;
            obj.set('editable', false); // Tạm thời vô hiệu hóa khả năng chỉnh sửa
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
            obj.set('editable', true); // Khôi phục khả năng chỉnh sửa
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
      // Thoát chế độ chỉnh sửa của tất cả textbox khi kéo qua
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
    console.log('image-url: ', url); // Kiểm tra giá trị URL
    if (!url || !fabricCanvas.current) return;

    const canvas = fabricCanvas.current;
    const pointer = canvas.getPointer(e.nativeEvent);

    const tempImg = new Image();
    tempImg.crossOrigin = 'anonymous';
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
