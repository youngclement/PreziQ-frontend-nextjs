// src/utils/animationMap.ts
import { gsap } from 'gsap';
import * as fabric from 'fabric';

export type AnimationFunction = (
  target: fabric.Object,
  canvas: fabric.Canvas,
  callback?: () => void
) => void;

export const animationMap: Record<string, AnimationFunction> = {
  Fade: (
    target: fabric.Object,
    canvas: fabric.Canvas,
    callback?: () => void
  ) => {
    const initialOpacity = target.opacity ?? 1;
    target.set('opacity', 0);
    canvas.renderAll();
    gsap.to(target, {
      duration: 1,
      opacity: initialOpacity,
      onUpdate: () => canvas.renderAll(),
      onComplete: callback,
    });
  },
  SlideInLeft: (
    target: fabric.Object,
    canvas: fabric.Canvas,
    callback?: () => void
  ) => {
    const initialLeft = target.left ?? 0;
    target.set('left', initialLeft - 100);
    canvas.renderAll();
    gsap.to(target, {
      duration: 0.5,
      left: initialLeft,
      opacity: 1,
      ease: 'power2.out',
      onUpdate: () => canvas.renderAll(),
      onComplete: callback,
    });
  },
  Bounce: (
    target: fabric.Object,
    canvas: fabric.Canvas,
    callback?: () => void
  ) => {
    const initialTop = target.top ?? 0;
    target.set('top', initialTop - 100);
    target.set('opacity', 0);
    canvas.renderAll();
    gsap.to(target, {
      duration: 0.5,
      top: initialTop,
      opacity: 1,
      ease: 'bounce.out',
      onUpdate: () => canvas.renderAll(),
      onComplete: callback,
    });
  },
};
