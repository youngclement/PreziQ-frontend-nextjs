import { motion } from 'framer-motion';
import { Target, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

const GoalsSection = () => {
  // Animation variants
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: 'spring', stiffness: 100 },
    },
  };

  return (
    <motion.div
      className='lg:col-span-6 rounded-xl border shadow-md dark:shadow-primary/5 bg-gradient-to-br from-white to-slate-50 dark:from-slate-950 dark:to-slate-900/80 p-6 overflow-hidden relative'
      variants={itemVariants}
      initial='hidden'
      animate='visible'
    >
      {/* Background decorative elements */}
      <div className='absolute -left-16 -bottom-16 w-40 h-40 bg-blue-500/5 rounded-full blur-3xl'></div>
      <div className='absolute -right-16 -top-16 w-40 h-40 bg-purple-500/5 rounded-full blur-3xl'></div>

      <h2 className='text-xl font-bold mb-5 flex items-center'>
        <span className='bg-blue-500/10 text-blue-500 p-2 rounded-lg mr-3'>
          <Target className='w-5 h-5' />
        </span>
        Your Goals
      </h2>

      <div className='space-y-5'>
        <motion.div
          className='space-y-2 p-4 rounded-lg border bg-card/50 hover:bg-card hover:shadow-sm transition-all'
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.7 }}
          whileHover={{ x: 3 }}
        >
          <div className='flex justify-between items-center'>
            <span className='text-sm font-medium flex items-center'>
              <span className='w-2 h-2 bg-blue-500 rounded-full mr-2'></span>
              Create 10 presentations this month
            </span>
            <span className='text-xs font-bold bg-blue-500/10 text-blue-500 px-2 py-1 rounded-full'>
              7/10
            </span>
          </div>
          <div className='w-full bg-muted rounded-full h-2.5 overflow-hidden'>
            <motion.div
              className='bg-blue-500 h-full rounded-full relative'
              initial={{ width: 0 }}
              animate={{ width: '70%' }}
              transition={{ duration: 1, delay: 0.8 }}
            >
              <motion.div
                className='absolute inset-0 bg-white/30'
                animate={{ x: ['-100%', '100%'] }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: 'linear',
                }}
              />
            </motion.div>
          </div>
        </motion.div>

        <motion.div
          className='space-y-2 p-4 rounded-lg border bg-card/50 hover:bg-card hover:shadow-sm transition-all'
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.8 }}
          whileHover={{ x: 3 }}
        >
          <div className='flex justify-between items-center'>
            <span className='text-sm font-medium flex items-center'>
              <span className='w-2 h-2 bg-purple-500 rounded-full mr-2'></span>
              Use 5 different templates
            </span>
            <span className='text-xs font-bold bg-purple-500/10 text-purple-500 px-2 py-1 rounded-full'>
              3/5
            </span>
          </div>
          <div className='w-full bg-muted rounded-full h-2.5 overflow-hidden'>
            <motion.div
              className='bg-purple-500 h-full rounded-full relative'
              initial={{ width: 0 }}
              animate={{ width: '60%' }}
              transition={{ duration: 1, delay: 0.9 }}
            >
              <motion.div
                className='absolute inset-0 bg-white/30'
                animate={{ x: ['-100%', '100%'] }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: 'linear',
                }}
              />
            </motion.div>
          </div>
        </motion.div>

        <motion.div
          className='space-y-2 p-4 rounded-lg border bg-card/50 hover:bg-card hover:shadow-sm transition-all'
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.9 }}
          whileHover={{ x: 3 }}
        >
          <div className='flex justify-between items-center'>
            <span className='text-sm font-medium flex items-center'>
              <span className='w-2 h-2 bg-green-500 rounded-full mr-2'></span>
              Get 100 views on your presentations
            </span>
            <span className='text-xs font-bold bg-green-500/10 text-green-500 px-2 py-1 rounded-full'>
              87/100
            </span>
          </div>
          <div className='w-full bg-muted rounded-full h-2.5 overflow-hidden'>
            <motion.div
              className='bg-green-500 h-full rounded-full relative'
              initial={{ width: 0 }}
              animate={{ width: '87%' }}
              transition={{ duration: 1, delay: 1 }}
            >
              <motion.div
                className='absolute inset-0 bg-white/30'
                animate={{ x: ['-100%', '100%'] }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: 'linear',
                }}
              />
            </motion.div>
          </div>
        </motion.div>

        <motion.div
          className='space-y-2 p-4 rounded-lg border bg-card/50 hover:bg-card hover:shadow-sm transition-all'
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 1 }}
          whileHover={{ x: 3 }}
        >
          <div className='flex justify-between items-center'>
            <span className='text-sm font-medium flex items-center'>
              <span className='w-2 h-2 bg-emerald-500 rounded-full mr-2'></span>
              Create 5 new quizzes
            </span>
            <span className='text-xs font-bold bg-emerald-500/10 text-emerald-500 px-2 py-1 rounded-full'>
              2/5
            </span>
          </div>
          <div className='w-full bg-muted rounded-full h-2.5 overflow-hidden'>
            <motion.div
              className='bg-emerald-500 h-full rounded-full relative'
              initial={{ width: 0 }}
              animate={{ width: '40%' }}
              transition={{ duration: 1, delay: 1.1 }}
            >
              <motion.div
                className='absolute inset-0 bg-white/30'
                animate={{ x: ['-100%', '100%'] }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: 'linear',
                }}
              />
            </motion.div>
          </div>
        </motion.div>
      </div>

      <div className='flex gap-3 mt-6'>
        <Button
          variant='default'
          className='flex-1 bg-gradient-to-r from-blue-500 to-primary text-white shadow-sm'
        >
          Set new goal
        </Button>
        <Button
          variant='outline'
          className='w-10 h-10 p-0 rounded-full'
          size='icon'
        >
          <Sparkles className='w-4 h-4' />
        </Button>
      </div>
    </motion.div>
  );
};

export default GoalsSection;
