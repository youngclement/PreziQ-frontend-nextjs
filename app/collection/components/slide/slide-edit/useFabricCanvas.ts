import * as fabric from 'fabric';
import { useRef } from 'react';
import { FabricImage } from 'fabric';
export const useFabricCanvas = () => {
  const fabricCanvas = useRef<fabric.Canvas>();

  const initCanvas = (el: HTMLCanvasElement, background: string, width: number = 812) => {
    const canvas = new fabric.Canvas(el, {
      preserveObjectStacking: true,
      backgroundColor: background,
      width: width,
      height: 460,
    });

    if (background) {
          FabricImage.fromURL(background).then((img) => {
            img.set({
              scaleX: canvas.getWidth() / img.width,
              scaleY: canvas.getHeight() / img.height,
              originX: 'left',
              originY: 'top',
            });
            canvas.backgroundImage = img;
          });
        }

    fabricCanvas.current = canvas;
    return canvas;
  };

  return { fabricCanvas, initCanvas };
};
