'use client';

import { useState, useEffect } from 'react';

interface WindowSize {
  width: number;
  height: number;
}

export function useWindowSize(): WindowSize {
  const [windowSize, setWindowSize] = useState<WindowSize>({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  });

  useEffect(() => {
    // Chỉ thực hiện ở phía client
    if (typeof window === 'undefined') {
      return;
    }

    function handleResize() {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }

    // Thêm event listener
    window.addEventListener('resize', handleResize);

    // Gọi handler ngay lập tức để cập nhật state với kích thước cửa sổ hiện tại
    handleResize();

    // Xóa event listener khi component unmount
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return windowSize;
}
