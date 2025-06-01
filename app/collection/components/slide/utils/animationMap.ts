// src/utils/animationMap.ts
import { gsap } from 'gsap';
import * as fabric from 'fabric';

export type AnimationFunction = (
  target: fabric.Object,
  canvas: fabric.Canvas,
  callback?: () => void
) => void;

export const animationMap: Record<string, AnimationFunction> = {
  // Hiệu ứng chung (cả TEXT và IMAGE)
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
      ease: 'sine.inOut',
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
    target.set('opacity', 0);
    canvas.renderAll();
    gsap.to(target, {
      duration: 0.6,
      left: initialLeft,
      opacity: 1,
      ease: 'power2.out',
      onUpdate: () => canvas.renderAll(),
      onComplete: callback,
    });
  },
  SlideInRight: (
    target: fabric.Object,
    canvas: fabric.Canvas,
    callback?: () => void
  ) => {
    const initialLeft = target.left ?? 0;
    target.set('left', initialLeft + 100);
    target.set('opacity', 0);
    canvas.renderAll();
    gsap.to(target, {
      duration: 0.6,
      left: initialLeft,
      opacity: 1,
      ease: 'power2.out',
      onUpdate: () => canvas.renderAll(),
      onComplete: callback,
    });
  },

  // ScaleIn: (
  //   target: fabric.Object,
  //   canvas: fabric.Canvas,
  //   callback?: () => void
  // ) => {
  //   target.set({
  //     scaleX: 0.2,
  //     scaleY: 0.2,
  //     opacity: 0,
  //   });
  //   canvas.renderAll();
  //   gsap.to(target, {
  //     duration: 0.7,
  //     scaleX: 1,
  //     scaleY: 1,
  //     opacity: 1,
  //     ease: 'elastic.out(1, 0.75)',
  //     onUpdate: () => canvas.renderAll(),
  //     onComplete: callback,
  //   });
  // },

  RotateIn: (
    target: fabric.Object,
    canvas: fabric.Canvas,
    callback?: () => void
  ) => {
    target.set({
      angle: -90,
      opacity: 0,
    });
    canvas.renderAll();
    gsap.to(target, {
      duration: 0.8,
      angle: 0,
      opacity: 1,
      ease: 'power3.out',
      onUpdate: () => canvas.renderAll(),
      onComplete: callback,
    });
  },

  // Hiệu ứng dành riêng cho TEXT
  // Typewriter: (
  //   target: fabric.Object,
  //   canvas: fabric.Canvas,
  //   callback?: () => void
  // ) => {
  //   if (!(target instanceof fabric.Textbox)) {
  //     // Fallback về Fade nếu không phải Textbox
  //     return animationMap.Fade(target, canvas, callback);
  //   }
  //   const originalText = target.text || '';
  //   target.set('text', '');
  //   target.set('opacity', 1);
  //   canvas.renderAll();

  //   let currentIndex = 0;
  //   const charInterval = 50; // Thời gian giữa mỗi ký tự (ms)
  //   let lastTime = performance.now();

  //   const renderFrame = () => {
  //     const currentTime = performance.now();
  //     if (
  //       currentTime - lastTime >= charInterval &&
  //       currentIndex < originalText.length
  //     ) {
  //       target.set('text', originalText.slice(0, currentIndex + 1));
  //       canvas.renderAll();
  //       currentIndex++;
  //       lastTime = currentTime;
  //     }

  //     if (currentIndex < originalText.length) {
  //       requestAnimationFrame(renderFrame);
  //     } else if (callback) {
  //       target.set('text', originalText);
  //       canvas.renderAll();
  //       callback();
  //     }
  //   };

  //   requestAnimationFrame(renderFrame);
  // },

  // FadeInChar: (
  //   target: fabric.Object,
  //   canvas: fabric.Canvas,
  //   callback?: () => void
  // ) => {
  //   if (!(target instanceof fabric.Textbox)) {
  //     return animationMap.Fade(target, canvas, callback);
  //   }
  //   const originalText = target.text || '';
  //   const chars = originalText.split('');
  //   target.set('text', '');
  //   target.set('opacity', 1);
  //   canvas.renderAll();

  //   let currentIndex = 0;
  //   const charInterval = 100; // 100ms giữa mỗi ký tự
  //   let lastTime = performance.now();

  //   const renderFrame = () => {
  //     const currentTime = performance.now();
  //     if (
  //       currentTime - lastTime >= charInterval &&
  //       currentIndex < chars.length
  //     ) {
  //       target.set('text', (target.text || '') + chars[currentIndex]);
  //       gsap.to(target, {
  //         duration: 0.3,
  //         opacity: 1,
  //         onUpdate: () => canvas.renderAll(),
  //       });
  //       currentIndex++;
  //       lastTime = currentTime;
  //     }

  //     if (currentIndex < chars.length) {
  //       requestAnimationFrame(renderFrame);
  //     } else {
  //       target.set('text', originalText);
  //       canvas.renderAll();
  //       if (callback) callback();
  //     }
  //   };

  //   requestAnimationFrame(renderFrame);
  // },

  // Hiệu ứng dành riêng cho IMAGE
  // ZoomIn: (
  //   target: fabric.Object,
  //   canvas: fabric.Canvas,
  //   callback?: () => void
  // ) => {
  //   if (!(target instanceof fabric.Image)) {
  //     // Nếu không phải Image, fallback về ScaleIn
  //     return animationMap.ScaleIn(target, canvas, callback);
  //   }
  //   target.set({
  //     scaleX: 0.5,
  //     scaleY: 0.5,
  //     opacity: 0,
  //   });
  //   canvas.renderAll();
  //   gsap.to(target, {
  //     duration: 0.6,
  //     scaleX: 1,
  //     scaleY: 1,
  //     opacity: 1,
  //     ease: 'power2.inOut',
  //     onUpdate: () => canvas.renderAll(),
  //     onComplete: callback,
  //   });
  // },

  FlipIn: (
    target: fabric.Object,
    canvas: fabric.Canvas,
    callback?: () => void
  ) => {
    if (!(target instanceof fabric.Image)) {
      // Nếu không phải Image, fallback về RotateIn
      return animationMap.RotateIn(target, canvas, callback);
    }
    target.set({
      scaleY: 0,
      opacity: 0,
    });
    canvas.renderAll();
    gsap.to(target, {
      duration: 0.7,
      scaleY: 1,
      opacity: 1,
      ease: 'back.out(1.7)',
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
