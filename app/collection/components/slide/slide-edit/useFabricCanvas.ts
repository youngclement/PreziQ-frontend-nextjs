import * as fabric from 'fabric';
import { useRef } from 'react';

export const useFabricCanvas = () => {
  const fabricCanvas = useRef<fabric.Canvas>();

  const initCanvas = (el: HTMLCanvasElement, background: string) => {
    const canvas = new fabric.Canvas(el, {
      preserveObjectStacking: true,
      backgroundColor: background,
      width: 800,
      height: 400,
    });
    fabricCanvas.current = canvas;
    return canvas;
  };

  return { fabricCanvas, initCanvas };
};
