import React, { useEffect, useRef } from 'react';
import * as fabric from 'fabric';
import { FabricImage } from 'fabric';

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
  onImageDrop,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvas = useRef<fabric.Canvas>();
  const containerRef = useRef<HTMLDivElement>(null);
  const selectedObjectInfoRef = useRef<any>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = new fabric.Canvas(canvasRef.current, {
      backgroundColor: backgroundColor || 'transparent',
      width: 800,
      height: 500,
    });

    const title = new fabric.Textbox(slideTitle || 'Slide Title', {
      left: 100,
      top: 50,
      fontSize: 28,
      fontWeight: 'bold',
      width: 600,
    });

    const content = new fabric.Textbox(slideContent || 'Slide Content...', {
      left: 100,
      top: 150,
      fontSize: 20,
      width: 600,
    });

    canvas.add(title);
    canvas.add(content);
    canvas.renderAll();

    fabricCanvas.current = canvas;

    const updateSlide = () => {
      onUpdate({
        title: title.text || '',
        content: content.text || '',
      });
    };

    canvas.on('object:modified', updateSlide);
    canvas.on('text:changed', updateSlide);

    canvas.on('object:selected', (e) => {
      const obj = e.target;
      if (obj) {
        const bounds = obj.getBoundingRect();
        selectedObjectInfoRef.current = {
          type: obj.type,
          left: obj.left,
          top: obj.top,
          width: bounds.width,
          height: bounds.height,
          scaleX: obj.scaleX,
          scaleY: obj.scaleY,
          text: (obj as fabric.Textbox).text,
        };
        console.log('🖱️ Object selected:', selectedObjectInfoRef.current);
      }
    });

    canvas.on('object:modified', (e) => {
      const obj = e.target;
      if (obj) {
        const bounds = obj.getBoundingRect();
        selectedObjectInfoRef.current = {
          type: obj.type,
          left: obj.left,
          top: obj.top,
          width: bounds.width,
          height: bounds.height,
          scaleX: obj.scaleX,
          scaleY: obj.scaleY,
          text: (obj as fabric.Textbox).text,
        };
        console.log('✏️ Object modified:', selectedObjectInfoRef.current);
      }
    });

    canvas.on('object:moving', (e) => {
      const obj = e.target;
      if (obj) {
        console.log('🚚 Object moving:', {
          type: obj.type,
          left: obj.left,
          top: obj.top,
        });
      }
    });

    canvas.on('object:scaling', (e) => {
      const obj = e.target;
      if (obj) {
        console.log('📐 Object scaling:', {
          type: obj.type,
          scaleX: obj.scaleX,
          scaleY: obj.scaleY,
        });
      }
    });

    canvas.on('selection:created', (e) => {
      console.log('selection:created', e.selected); // Mảng đối tượng đã chọn
    });

    canvas.on('selection:updated', (e) => {
      console.log('selection:updated', e.selected);
    });

    // Listener cho sự kiện từ toolbar (Add Text, Add Image, Clear)
    const handleAddText = () => {
      const textbox = new fabric.Textbox('New Text', {
        left: 150,
        top: 250,
        fontSize: 20,
        width: 300,
      });
      canvas.add(textbox);
      canvas.setActiveObject(textbox);
      canvas.renderAll();
    };

    const handleAddImage = (e: CustomEvent) => {
      const url = e.detail?.url;
      if (!url) return;
      FabricImage.fromURL(
        url,
        (img) => {
          img.set({
            left: 100,
            top: 100,
            scaleX: 0.5,
            scaleY: 0.5,
            crossOrigin: 'anonymous',
          });
          canvas.add(img);
          canvas.setActiveObject(img);
          canvas.renderAll();
        },
        { crossOrigin: 'anonymous' }
      );
    };

    const handleClear = () => {
      canvas.getObjects().forEach((obj) => {
        // Preserve title and content
        if (obj.type !== 'textbox' || (obj !== title && obj !== content)) {
          canvas.remove(obj);
        }
      });
      canvas.renderAll();
    };

    const handleAddRectangle = () => {
      const rect = new fabric.Rect({
        left: 150,
        top: 150,
        fill: '#3498db',
        width: 100,
        height: 60,
      });
      fabricCanvas.current?.add(rect);
      fabricCanvas.current?.setActiveObject(rect);
      fabricCanvas.current?.renderAll();
    };

    const handleAddCircle = () => {
      const circle = new fabric.Circle({
        left: 250,
        top: 200,
        radius: 40,
        fill: '#e74c3c',
      });
      fabricCanvas.current?.add(circle);
      fabricCanvas.current?.setActiveObject(circle);
      fabricCanvas.current?.renderAll();
    };

    const handleChangeTextColor: EventListener = (evt) => {
      const e = evt as CustomEvent<{
        color?: string;
        gradient?: { direction: string; stops: string[] };
      }>;

      const activeObjects = fabricCanvas.current?.getActiveObjects();
      if (!activeObjects?.length) {
        console.log('No active objects found for color change.');
        return;
      }

      activeObjects.forEach((obj) => {
        if ('set' in obj) {
          if (e.detail.gradient) {
            const { direction, stops } = e.detail.gradient;

            const gradient = new fabric.Gradient({
              type: 'linear',
              gradientUnits: 'pixels',
              coords:
                direction === 'horizontal'
                  ? { x1: 0, y1: 0, x2: obj.width ?? 100, y2: 0 }
                  : { x1: 0, y1: 0, x2: 0, y2: obj.height ?? 100 },
              colorStops: stops.map((color, index) => ({
                offset: index / (stops.length - 1),
                color,
              })),
            });

            obj.set('fill', gradient);
            //console.log('Applied gradient:', stops);
          } else if (e.detail.color) {
            obj.set({ fill: e.detail.color });
            //console.log('Applied solid color:', e.detail.color);
          } else {
            console.warn('No color or gradient provided.');
          }

          obj.dirty = true;
        }
      });

      fabricCanvas.current?.requestRenderAll();
    };



    window.addEventListener('fabric:add-text', handleAddText);
    window.addEventListener(
      'fabric:add-image',
      handleAddImage as EventListener
    );
    window.addEventListener('fabric:add-rect', handleAddRectangle);
    window.addEventListener('fabric:add-circle', handleAddCircle);
    window.addEventListener(
      'fabric:change-color',
      handleChangeTextColor as EventListener
    );

    window.addEventListener('fabric:clear', handleClear);

    return () => {
      window.removeEventListener('fabric:add-text', handleAddText);
      window.removeEventListener(
        'fabric:add-image',
        handleAddImage as EventListener
      );
      window.removeEventListener('fabric:clear', handleClear);
      window.removeEventListener('fabric:add-rect', handleAddRectangle);
      window.removeEventListener('fabric:add-circle', handleAddCircle);
      window.removeEventListener(
        'fabric:change-color',
        handleChangeTextColor as EventListener
      );

      canvas.dispose();
    };
  }, []);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    console.log('📥 Drop event:', e);

    const url = e.dataTransfer.getData('image-url');
    if (!url || !fabricCanvas.current) {
      console.log('❌ Drop aborted: No URL or canvas found.');
      return;
    }

    const canvas = fabricCanvas.current;
    const pointer = canvas.getPointer(e.nativeEvent);
    const target = canvas.findTarget(e.nativeEvent, true);

    //console.log('Drop position:', pointer);
    //console.log('Drop target:', target?.type);

    if (target && target.type === 'textbox') {
      // console.log('Drop blocked: Hovering over textbox.');
      return;
    }

    const tempImg = new window.Image();
    tempImg.crossOrigin = 'anonymous';

    tempImg.onload = () => {
      const maxWidth = canvas.width!;
      const maxHeight = canvas.height!;
      const scaleX = maxWidth / (tempImg.width * 2);
      const scaleY = maxHeight / (tempImg.height * 2);
      const scale = Math.min(1, Math.min(scaleX, scaleY, 0.5));

      const imgInstance = new fabric.Image(tempImg, {
        left: pointer.x || 100,
        top: pointer.y || 100,
        scaleX: scale,
        scaleY: scale,
      });

      canvas.add(imgInstance);
      canvas.setActiveObject(imgInstance);
      canvas.renderAll();

      console.log('Image successfully added to canvas:', {
        url,
        position: pointer,
        scale,
        originalSize: {
          width: tempImg.width,
          height: tempImg.height,
        },
      });
    };

    tempImg.onerror = () => {
      console.error('Image load failed:', url);
    };

    tempImg.src = url;
  };

  return (
    <div
      ref={containerRef}
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
      className="relative w-full max-w-3xl"
    >
      <canvas ref={canvasRef} />
    </div>
  );
};

export default FabricEditor;
