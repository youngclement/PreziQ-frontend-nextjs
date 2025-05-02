import { useEffect } from 'react';

export default function usePreventImageDrop() {
  useEffect(() => {
    const handler = (e: DragEvent) => {
      // 1) Nếu đang focus trên một INPUT/TEXTAREA (kể cả Fabric textarea)
      const active = document.activeElement as HTMLElement | null;
      const activeIsText =
        active?.tagName === 'INPUT' ||
        active?.tagName === 'TEXTAREA' ||
        active?.dataset.fabric === 'textarea' ||
        active?.classList.contains('canvas-textarea');

      // 2) Hoặc nếu event path có chạm tới một INPUT/TEXTAREA
      const path = e.composedPath?.() as any[];
      const pathHasText =
        Array.isArray(path) &&
        path.some(
          (el) =>
            el instanceof HTMLElement &&
            (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA')
        );

      if (activeIsText || pathHasText) {
        // ngăn mọi default (chèn URL), clear data, stop propagate
        e.preventDefault();
        e.stopImmediatePropagation();
        e.dataTransfer?.clearData();
      }
    };

    // Capture-phase để chạy trước React, Fabric.js, browser default
    document.addEventListener('dragover', handler, true);
    document.addEventListener('drop', handler, true);

    return () => {
      document.removeEventListener('dragover', handler, true);
      document.removeEventListener('drop', handler, true);
    };
  }, []);
}
