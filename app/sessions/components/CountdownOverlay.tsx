import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

interface CountdownOverlayProps {
  onComplete: () => void;
  duration?: number;
}

export default function CountdownOverlay({
  onComplete,
  duration = 3,
}: CountdownOverlayProps) {
  const [count, setCount] = useState(duration);

  useEffect(() => {
    if (count > 0) {
      const timer = setTimeout(() => {
        setCount(count - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      onComplete();
    }
  }, [count, onComplete]);

  return (
    <AnimatePresence>
      {count > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className='fixed inset-0 bg-black bg-opacity-70 backdrop-blur-md flex items-center justify-center z-50'
        >
          {/* Animated background elements */}
          <div className='absolute inset-0 overflow-hidden pointer-events-none'>
            {/* Gradient orbs */}
            <motion.div
              className='absolute top-1/3 left-1/3 w-32 h-32 bg-[rgb(198,234,132)] rounded-full filter blur-[80px]'
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.1, 0.3, 0.1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />

            {/* Dotted grid */}
            <div className='absolute inset-0 bg-[radial-gradient(rgba(198,234,132,0.05)_1px,transparent_1px)] bg-[size:20px_20px]' />

            {/* Pulse ring */}
            <motion.div
              className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-transparent rounded-full border-2 border-[rgb(198,234,132)]/30'
              animate={{
                scale: [1, 2.5],
                opacity: [0.6, 0],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: 'easeOut',
              }}
            />
            <motion.div
              className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-transparent rounded-full border-2 border-[rgb(198,234,132)]/20'
              animate={{
                scale: [1, 2.2],
                opacity: [0.5, 0],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: 'easeOut',
                delay: 0.3,
              }}
            />
          </div>

          <div className='relative'>
            <motion.div
              key={count}
              initial={{ scale: 0.5, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 1.5, opacity: 0, y: -20 }}
              transition={{
                type: 'spring',
                stiffness: 300,
                damping: 20,
              }}
              className='text-9xl font-bold relative'
            >
              <span className='text-[rgb(198,234,132)] drop-shadow-lg'>
                {count}
              </span>

              {/* Shadow underneath */}
              <motion.div
                className='absolute -bottom-4 left-1/2 -translate-x-1/2 w-16 h-2 bg-[rgb(198,234,132)]/20 rounded-full blur-md'
                animate={{
                  width: ['4rem', '5rem', '4rem'],
                  opacity: [0.2, 0.4, 0.2],
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />

              {/* Particles around number */}
              {[...Array(8)].map((_, i) => (
                <motion.div
                  key={i}
                  className='absolute w-1 h-1 bg-[rgb(198,234,132)] rounded-full'
                  style={{
                    left: `${50 + Math.cos((i * Math.PI) / 4) * 100}%`,
                    top: `${50 + Math.sin((i * Math.PI) / 4) * 100}%`,
                  }}
                  animate={{
                    scale: [0, 1, 0],
                    opacity: [0, 1, 0],
                  }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    delay: i * 0.1,
                    ease: 'easeInOut',
                  }}
                />
              ))}
            </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 0.7, y: 0 }}
              transition={{ delay: 0.3 }}
              className='mt-8 text-white/70 text-center text-lg'
            >
              Chuẩn bị...
            </motion.p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
