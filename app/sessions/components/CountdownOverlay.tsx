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
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.5 }}
          className='fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50'
        >
          <motion.div
            key={count}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.5, opacity: 0 }}
            className='text-9xl font-bold text-white'
          >
            {count}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
