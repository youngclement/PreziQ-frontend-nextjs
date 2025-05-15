'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

const Loading = () => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const PulsingDots = () => (
    <div className="flex space-x-2">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={cn(
            "w-3 h-3 bg-white rounded-full",
            "animate-pulse",
            i === 0 ? "animate-delay-0" :
              i === 1 ? "animate-delay-150" :
                "animate-delay-300"
          )}
          style={{
            animationDuration: '1.5s'
          }}
        />
      ))}
    </div>
  );

  const LoadingAnimation = () => (
    <div className="flex flex-col items-center">
      <div className="relative w-24 h-24">
        {/* Outer circle */}
        <div className="absolute inset-0 border-4 border-white/20 rounded-full" />

        {/* Spinning arc */}
        <div className="absolute inset-0 border-4 border-transparent border-t-white rounded-full animate-spin" />

        {/* Inner circle with pulsing effect */}
        <div className="absolute inset-4 border-2 border-white/30 rounded-full animate-pulse"
          style={{ animationDuration: '2s' }} />
      </div>

      <div className="mt-8 text-white font-medium text-xl flex items-center">
        Loading<PulsingDots />
      </div>
    </div>
  );

  // Fallback khi đang render ở server
  if (!isClient) {
    return (
      <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50">
        <LoadingAnimation />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50">
      <LoadingAnimation />
    </div>
  );
};

export default Loading;
