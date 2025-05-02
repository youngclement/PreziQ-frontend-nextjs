import * as fabric from 'fabric';
import { useRef } from 'react';

export const useFabricCanvas = () => {
  const fabricCanvas = useRef<fabric.Canvas>();

  const initCanvas = (el: HTMLCanvasElement, background: string, width: number = 1024) => {
    const canvas = new fabric.Canvas(el, {
      preserveObjectStacking: true,
      backgroundColor: background,
      width: width,
      height: 400,
    });
    fabricCanvas.current = canvas;
    return canvas;
  };

  return { fabricCanvas, initCanvas };
};
