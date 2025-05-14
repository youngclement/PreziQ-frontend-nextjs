import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Trophy, Award, Sparkles, Clock } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import Image from 'next/image';

interface Achievement {
  id: string;
  name: string;
  description: string;
  iconUrl?: string;
  unlocked: boolean;
  progress: number;
  date?: string;
  points: number;
  type: string;
  color: string;
  icon: any;
}

interface AchievementsListProps {
  achievements: Achievement[];
}

const AchievementsList = ({ achievements }: AchievementsListProps) => {
  const [currentTab, setCurrentTab] = useState('all');
  const [achievementType, setAchievementType] = useState('all');

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: 'spring', stiffness: 100 },
    },
  };

  // Filter achievements based on tab and type
  const filteredAchievements = achievements
    .filter((a) => {
      if (currentTab === 'all') return true;
      if (currentTab === 'unlocked') return a.unlocked;
      return !a.unlocked;
    })
    .filter((a) => {
      if (achievementType === 'all') return true;
      return a.type === achievementType;
    });

  return (
    <motion.div
      className='bg-gradient-to-br from-white via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900/80 rounded-xl border shadow-md dark:shadow-primary/5 p-6 mb-12'
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
    >
      <div className='flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 border-b pb-4'>
        <h2 className='text-2xl font-bold flex items-center'>
          <span className='bg-primary/10 text-primary p-2 rounded-lg mr-3'>
            <Trophy className='w-5 h-5' />
          </span>
          Achievement List
        </h2>
        <div className='flex flex-col sm:flex-row gap-3 w-full md:w-auto'>
          <Tabs
            defaultValue='all'
            value={currentTab}
            onValueChange={setCurrentTab}
            className='w-full sm:w-auto'
          >
            <TabsList className='grid w-full sm:w-auto grid-cols-3 bg-muted/50 p-1'>
              <TabsTrigger
                value='all'
                className='rounded-md data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-sm'
              >
                All
              </TabsTrigger>
              <TabsTrigger
                value='unlocked'
                className='rounded-md data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-sm'
              >
                Unlocked
              </TabsTrigger>
              <TabsTrigger
                value='locked'
                className='rounded-md data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-sm'
              >
                Locked
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <Tabs
            defaultValue='all'
            value={achievementType}
            onValueChange={setAchievementType}
            className='w-full sm:w-auto'
          >
            <TabsList className='grid w-full sm:w-auto grid-cols-3 bg-muted/50 p-1'>
              <TabsTrigger
                value='all'
                className='rounded-md data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-sm'
              >
                All
              </TabsTrigger>
              <TabsTrigger
                value='presentation'
                className='rounded-md data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-sm'
              >
                Presentation
              </TabsTrigger>
              <TabsTrigger
                value='quiz'
                className='rounded-md data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-sm'
              >
                Quiz
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {filteredAchievements.length > 0 ? (
        <motion.div
          className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5'
          variants={containerVariants}
          initial='hidden'
          animate='visible'
        >
          {filteredAchievements.map((achievement, index) => (
            <motion.div
              key={achievement.id}
              className={cn(
                'rounded-xl border p-5 relative overflow-hidden transition-all h-full hover:shadow-md',
                achievement.unlocked
                  ? 'bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800 shadow-sm'
                  : 'bg-muted/30'
              )}
              variants={itemVariants}
              whileHover={{
                y: -5,
                transition: { type: 'spring', stiffness: 300 },
              }}
            >
              {/* Achievement type badge */}
              <div className='absolute top-3 right-3 z-10'>
                <Badge
                  variant='outline'
                  className={cn(
                    'text-xs font-medium px-2 py-1',
                    achievement.type === 'presentation'
                      ? 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                      : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                  )}
                >
                  {achievement.type === 'presentation'
                    ? 'Presentation'
                    : 'Quiz'}
                </Badge>
              </div>

              {/* Progress bar */}
              <div className='absolute bottom-0 left-0 h-1 bg-primary/10 w-full'>
                <motion.div
                  className={`h-full ${achievement.color}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${achievement.progress}%` }}
                  transition={{ duration: 1, delay: 0.5 + index * 0.1 }}
                />
              </div>

              <div className='flex gap-4 mb-5'>
                <div
                  className={cn(
                    'w-14 h-14 rounded-lg flex items-center justify-center relative overflow-hidden',
                    achievement.unlocked ? achievement.color : 'bg-muted',
                    'text-white'
                  )}
                >
                  {/* Gradient overlay for unlocked achievements */}
                  {achievement.unlocked && (
                    <div
                      className='absolute inset-0 bg-white/20 rounded-lg'
                      style={{
                        clipPath: 'polygon(0 0, 100% 0, 100% 30%, 0 60%)',
                      }}
                    />
                  )}

                  {achievement.iconUrl ? (
                    <div className='relative w-10 h-10 overflow-hidden z-10'>
                      <img
                        src={achievement.iconUrl}
                        alt={achievement.name}
                        className='object-cover w-full h-full'
                      />
                    </div>
                  ) : achievement.icon ? (
                    <achievement.icon className='w-7 h-7 relative z-10' />
                  ) : (
                    <Trophy className='w-7 h-7 relative z-10' />
                  )}

                  {/* Background animation */}
                  {achievement.unlocked && (
                    <motion.div
                      className='absolute inset-0 z-0'
                      animate={{
                        background: [
                          'rgba(255,255,255,0.1)',
                          'rgba(255,255,255,0.2)',
                          'rgba(255,255,255,0.1)',
                        ],
                      }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: 'easeInOut',
                      }}
                    />
                  )}
                </div>
                <div>
                  <h3 className='font-bold text-base'>{achievement.name}</h3>
                  <p className='text-sm text-muted-foreground mt-1'>
                    {achievement.description}
                  </p>
                </div>
              </div>

              <div className='flex justify-between items-center mt-4 pt-3 border-t'>
                <span className='text-xs text-muted-foreground flex items-center'>
                  {achievement.unlocked ? (
                    <>
                      <span className='bg-green-500/10 text-green-500 p-0.5 rounded-full mr-1.5'>
                        <Check className='w-3 h-3' />
                      </span>
                      <span>Achieved on {achievement.date}</span>
                    </>
                  ) : (
                    <>
                      <span className='bg-slate-500/10 p-0.5 rounded-full mr-1.5'>
                        <Clock className='w-3 h-3 text-slate-500' />
                      </span>
                      <span>{achievement.progress}% completed</span>
                    </>
                  )}
                </span>
                <Badge
                  className={cn(
                    'px-2.5 py-0.5',
                    achievement.unlocked
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  )}
                >
                  {achievement.points} points
                </Badge>
              </div>

              {/* Badge effect */}
              {achievement.unlocked && (
                <motion.div
                  className='absolute -right-4 -top-4 w-16 h-16 rotate-12'
                  initial={{ opacity: 0, rotate: 45, scale: 0.5 }}
                  animate={{ opacity: 1, rotate: 12, scale: 1 }}
                  transition={{
                    delay: 0.8 + index * 0.1,
                    type: 'spring',
                    stiffness: 200,
                  }}
                >
                  <div className='w-full h-full relative'>
                    <div className='absolute inset-0 bg-yellow-500 opacity-80 blur-xl rounded-full'></div>
                    <Award className='absolute inset-0 w-10 h-10 m-auto text-yellow-200' />
                  </div>
                </motion.div>
              )}
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className='text-center py-10'
        >
          <div className='inline-flex items-center justify-center p-4 bg-muted/50 rounded-full mb-4'>
            <Trophy className='w-6 h-6 text-muted-foreground' />
          </div>
          <h3 className='text-lg font-medium mb-2'>No achievements found</h3>
          <p className='text-muted-foreground max-w-md mx-auto'>
            There are no achievements matching your current filters. Try
            changing your filter settings.
          </p>
        </motion.div>
      )}
    </motion.div>
  );
};

export default AchievementsList;
