import { Trophy } from 'lucide-react';
import { motion } from 'framer-motion';

const AchievementHeader = () => {
  // Animation variants
  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: 'easeOut',
      },
    },
  };

  return (
    <motion.div
      className='text-center mb-8'
      initial='hidden'
      animate='visible'
      variants={fadeIn}
    >
      <h1 className='text-3xl md:text-4xl font-bold mb-4 relative inline-block'>
        Your Achievements
        <motion.div
          className='absolute -right-8 -top-8'
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.5, type: 'spring', bounce: 0.5 }}
        >
          <span className='relative'>
            <span className='absolute inset-0 animate-ping opacity-30'>
              <Trophy className='w-6 h-6 text-yellow-500' />
            </span>
            <Trophy className='w-6 h-6 text-yellow-500' />
          </span>
        </motion.div>
      </h1>
      <motion.p
        className='text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto'
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        Track your progress and unlock new achievements as you use PreziQ
      </motion.p>
    </motion.div>
  );
};

export default AchievementHeader;
