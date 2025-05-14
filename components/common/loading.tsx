'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import loadingAnimation from '@/public/images/loading.json';

// Dynamic import với ssr: false để tránh lỗi 'document is not defined'
const Lottie = dynamic(() => import('lottie-react'), {
  ssr: false,
  loading: () => (
    <div className='w-48 h-48 rounded-full border-4 border-t-transparent border-indigo-600 animate-spin'></div>
  ),
});

const Loading = () => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Fallback khi đang render ở server
  if (!isClient) {
    return (
      <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50'>
        <div className='w-48 h-48 rounded-full border-4 border-t-transparent border-indigo-600 animate-spin'></div>
      </div>
    );
  }

  return (
    <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50'>
      <div className='relative w-48 h-48'>
        <Lottie animationData={loadingAnimation} loop={true} />
      </div>
    </div>
  );
};

export default Loading;
