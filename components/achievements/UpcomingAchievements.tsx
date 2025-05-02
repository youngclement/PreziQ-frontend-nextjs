import { motion } from 'framer-motion';
import { Zap, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { achievements, cssColorVariables } from './data';

const UpcomingAchievements = () => {
  // Animation variants
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: 'spring', stiffness: 100 },
    },
  };

  // Lọc và sắp xếp các thành tựu sắp đạt được
  const upcomingAchievements = achievements
    .filter((a) => !a.unlocked && a.progress > 0)
    .sort((a, b) => b.progress - a.progress)
    .slice(0, 4);

  return (
    <motion.div
      className="lg:col-span-6 rounded-xl border shadow-md dark:shadow-primary/5 bg-gradient-to-br from-white to-slate-50 dark:from-slate-950 dark:to-slate-900/80 p-6 overflow-hidden relative"
      variants={itemVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Background decorative elements */}
      <div className="absolute -left-16 -top-16 w-40 h-40 bg-yellow-500/5 rounded-full blur-3xl"></div>
      <div className="absolute -right-16 -bottom-16 w-40 h-40 bg-primary/5 rounded-full blur-3xl"></div>

      <h2 className="text-xl font-bold mb-5 flex items-center">
        <span className="bg-primary/10 text-primary p-2 rounded-lg mr-3">
          <Zap className="w-5 h-5" />
        </span>
        Achievements Coming Soon
      </h2>

      <div className="space-y-5">
        {upcomingAchievements.map((achievement, index) => (
          <motion.div
            key={achievement.id}
            className="flex items-center gap-4 p-4 rounded-lg border bg-card/50 hover:bg-card hover:shadow-sm transition-all"
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.7 + index * 0.1 }}
            whileHover={{ x: -3 }}
          >
            <div
              className={`w-12 h-12 rounded-lg flex items-center justify-center relative overflow-hidden`}
              style={{
                background: `linear-gradient(135deg, ${
                  achievement.color.split('-')[1]
                }-500/20, ${achievement.color.split('-')[1]}-500/40)`,
              }}
            >
              <achievement.icon className="w-6 h-6 text-primary" />
              <motion.div
                className="absolute inset-0 rounded-lg"
                animate={{
                  background: [
                    `rgba(var(--${
                      achievement.color.split('-')[1]
                    }-500-rgb), 0.1)`,
                    `rgba(var(--${
                      achievement.color.split('-')[1]
                    }-500-rgb), 0.2)`,
                    `rgba(var(--${
                      achievement.color.split('-')[1]
                    }-500-rgb), 0.1)`,
                  ],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                style={cssColorVariables as React.CSSProperties}
              />
            </div>
            <div className="flex-grow">
              <div className="flex justify-between items-center mb-1">
                <h3 className="text-sm font-bold">
                  {achievement.name}
                </h3>
                <span className="text-xs font-medium bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                  {achievement.progress}%
                </span>
              </div>
              <div className="w-full bg-muted/50 rounded-full h-1.5 mb-1.5 overflow-hidden">
                <motion.div
                  className={`h-1.5 rounded-full ${achievement.color}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${achievement.progress}%` }}
                  transition={{
                    duration: 1,
                    delay: 0.8 + index * 0.1,
                  }}
                >
                  <motion.div
                    className="absolute inset-0 bg-white/30 h-full w-full"
                    animate={{ x: ['-100%', '100%'] }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: 'linear',
                    }}
                  />
                </motion.div>
              </div>
              <p className="text-xs text-muted-foreground flex justify-between items-center">
                <span className="inline-flex items-center">
                  <Badge
                    variant="outline"
                    className="text-[10px] h-4 mr-2 border-0 bg-muted"
                  >
                    {achievement.type === 'presentation'
                      ? 'Presentation'
                      : 'Quiz'}
                  </Badge>
                  {achievement.description}
                </span>
                <span className="font-mono">
                  {achievement.points} pts
                </span>
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Motivational message */}
      <motion.div
        className="mt-6 p-5 rounded-lg bg-gradient-to-r from-primary/20 to-primary/5 border border-primary/20 relative overflow-hidden"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
      >
        <motion.div
          className="absolute inset-0 bg-white/10"
          animate={{
            x: ['-100%', '100%'],
            opacity: [0, 0.5, 0],
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        <p className="text-sm font-medium flex items-center relative z-10">
          <Sparkles className="w-4 h-4 mr-2 text-primary" />
          Continue using PreziQ to unlock more achievements and earn
          rewards!
        </p>
      </motion.div>
    </motion.div>
  );
};

export default UpcomingAchievements; 