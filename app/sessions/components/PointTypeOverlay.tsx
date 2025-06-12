'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Award, Ban, Zap } from 'lucide-react';

interface PointTypeOverlayProps {
  pointType: 'STANDARD' | 'NO_POINTS' | 'DOUBLE_POINTS';
  onComplete: () => void;
  duration?: number; // thời gian hiển thị overlay (milliseconds)
}

/**
 * Component hiển thị overlay thông báo loại điểm cho activities
 * Chỉ hiển thị cho DOUBLE_POINTS và NO_POINTS, bỏ qua STANDARD
 */
export default function PointTypeOverlay({
  pointType,
  onComplete,
  duration = 3000,
}: PointTypeOverlayProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onComplete, 500); // Chờ animation kết thúc
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onComplete]);

  // Không hiển thị overlay cho STANDARD points
  if (pointType === 'STANDARD') {
    onComplete();
    return null;
  }

  const getPointTypeConfig = () => {
    switch (pointType) {
      case 'DOUBLE_POINTS':
        return {
          title: 'ĐIỂM ĐÔI!',
          subtitle: 'Câu hỏi này có giá trị gấp đôi điểm số',
          icon: <Zap className='h-16 w-16' />,
          bgGradient: 'from-yellow-400 via-orange-500 to-red-500',
          textColor: 'text-white',
          iconColor: 'text-yellow-200',
          particleColor: '#FFD700',
        };
      case 'NO_POINTS':
        return {
          title: 'KHÔNG TÍNH ĐIỂM',
          subtitle: 'Câu hỏi này chỉ để thảo luận và không tính điểm',
          icon: <Ban className='h-16 w-16' />,
          bgGradient: 'from-gray-600 via-gray-700 to-gray-800',
          textColor: 'text-gray-200',
          iconColor: 'text-gray-400',
          particleColor: '#9CA3AF',
        };
      default:
        return null;
    }
  };

  const config = getPointTypeConfig();
  if (!config) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className='fixed inset-0 z-[10000] flex items-center justify-center'
        >
          {/* Background overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className='absolute inset-0 bg-black/80 backdrop-blur-sm'
          />

          {/* Floating particles effect */}
          <div className='absolute inset-0 overflow-hidden pointer-events-none'>
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                className='absolute w-2 h-2 rounded-full opacity-60'
                style={{ backgroundColor: config.particleColor }}
                initial={{
                  x: Math.random() * window.innerWidth,
                  y: window.innerHeight + 20,
                  scale: 0,
                }}
                animate={{
                  y: -20,
                  scale: [0, 1, 0],
                  opacity: [0, 1, 0],
                }}
                transition={{
                  duration: 3,
                  delay: Math.random() * 2,
                  repeat: Infinity,
                  ease: 'easeOut',
                }}
              />
            ))}
          </div>

          {/* Main content */}
          <motion.div
            initial={{ scale: 0, rotateY: 180 }}
            animate={{ scale: 1, rotateY: 0 }}
            exit={{ scale: 0, rotateY: -180 }}
            transition={{
              type: 'spring',
              stiffness: 300,
              damping: 20,
              duration: 0.8,
            }}
            className={`relative z-10 text-center bg-gradient-to-br ${config.bgGradient} p-12 rounded-3xl shadow-2xl border-4 border-white/20 max-w-md mx-4`}
          >
            {/* Glow effect */}
            <div
              className={`absolute inset-0 bg-gradient-to-br ${config.bgGradient} rounded-3xl blur-xl opacity-50 -z-10`}
            />

            {/* Icon with pulse animation */}
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                rotate: [0, 5, -5, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className={`${config.iconColor} mb-6 flex justify-center`}
            >
              {config.icon}
            </motion.div>

            {/* Title with typewriter effect */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className={`text-4xl font-bold ${config.textColor} mb-4 tracking-wider`}
            >
              {config.title}
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.5 }}
              className={`text-lg ${config.textColor} opacity-90 leading-relaxed`}
            >
              {config.subtitle}
            </motion.p>

            {/* Progress bar */}
            <motion.div
              className='mt-8 h-1 bg-white/20 rounded-full overflow-hidden'
              initial={{ width: '100%' }}
            >
              <motion.div
                className='h-full bg-white/60 rounded-full'
                initial={{ width: '100%' }}
                animate={{ width: '0%' }}
                transition={{ duration: duration / 1000, ease: 'linear' }}
              />
            </motion.div>
          </motion.div>

          {/* Ring effect around main content */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 3, opacity: 0 }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className={`absolute rounded-full border-2 border-white/30 w-96 h-96 pointer-events-none`}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
