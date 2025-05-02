import { motion } from 'framer-motion';
import { Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { recentActivities } from './data';

const RecentActivities = () => {
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
      className='lg:col-span-4 rounded-xl border shadow-md dark:shadow-primary/5 bg-gradient-to-br from-white to-slate-50 dark:from-slate-950 dark:to-slate-900/80 p-6'
      variants={itemVariants}
      initial='hidden'
      animate='visible'
    >
      <h2 className='text-xl font-semibold mb-5 flex items-center'>
        <span className='bg-muted p-2 rounded-lg mr-3'>
          <Clock className='w-5 h-5 text-primary' />
        </span>
        Recent Activities
      </h2>
      <div className='space-y-4 max-h-[350px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-primary/10 scrollbar-track-transparent hover:scrollbar-thumb-primary/20'>
        {recentActivities.map((activity, index) => (
          <motion.div
            key={activity.id}
            className='flex items-start gap-3 p-3 rounded-lg border bg-card/50 hover:bg-card transition-colors'
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.3 + index * 0.1 }}
          >
            <div className='w-2 h-full min-h-[2.5rem] rounded-full bg-primary/30 relative'>
              <motion.div
                className='absolute top-0 bottom-0 w-full rounded-full bg-primary'
                animate={{
                  height: ['0%', '100%', '100%'],
                }}
                transition={{
                  duration: 1.5,
                  delay: 0.3 + index * 0.1,
                  ease: 'easeOut',
                }}
              />
            </div>
            <div className='flex-grow'>
              <p className='text-sm font-semibold'>{activity.action}</p>
              <p className='text-sm text-muted-foreground'>{activity.title}</p>
              <div className='flex justify-between items-center mt-1'>
                <span className='text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full'>
                  {activity.date}
                </span>
                <Badge
                  variant='outline'
                  className='text-xs bg-primary/5 border-primary/10'
                >
                  +{activity.points} points
                </Badge>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default RecentActivities;
