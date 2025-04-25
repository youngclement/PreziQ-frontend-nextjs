'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Star,
  Award,
  Trophy,
  Target,
  Clock,
  Users,
  Zap,
  BrainCircuit,
  Crown,
  Sparkles,
} from 'lucide-react';
import Header from '@/components/header';
import Footer from '@/components/footer';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

// Danh sách thành tựu
const achievements = [
  {
    id: 1,
    name: 'Người mới tập sự',
    description: 'Hoàn thành bài thuyết trình đầu tiên',
    icon: Star,
    color: 'bg-blue-500',
    unlocked: true,
    progress: 100,
    date: '12/05/2023',
    points: 100,
    type: 'presentation',
  },
  {
    id: 2,
    name: 'Tiến sĩ thuyết trình',
    description: 'Tạo 10 bài thuyết trình',
    icon: Award,
    color: 'bg-purple-500',
    unlocked: true,
    progress: 100,
    date: '28/06/2023',
    points: 250,
    type: 'presentation',
  },
  {
    id: 3,
    name: 'Ngôi sao nội dung',
    description: 'Nhận 50 lượt thích cho bài thuyết trình của bạn',
    icon: Trophy,
    color: 'bg-yellow-500',
    unlocked: true,
    progress: 100,
    date: '03/08/2023',
    points: 300,
    type: 'presentation',
  },
  {
    id: 4,
    name: 'Nhà thiết kế tài ba',
    description: 'Sử dụng tất cả các mẫu cao cấp',
    icon: Sparkles,
    color: 'bg-pink-500',
    unlocked: false,
    progress: 65,
    date: null,
    points: 400,
    type: 'presentation',
  },
  {
    id: 5,
    name: 'Người hùng AI',
    description: 'Tạo 20 slide sử dụng công cụ AI',
    icon: BrainCircuit,
    color: 'bg-cyan-500',
    unlocked: false,
    progress: 50,
    date: null,
    points: 350,
    type: 'presentation',
  },
  {
    id: 6,
    name: 'Diễn giả nhanh nhẹn',
    description: 'Hoàn thành bài thuyết trình trong 30 phút',
    icon: Clock,
    color: 'bg-green-500',
    unlocked: false,
    progress: 80,
    date: null,
    points: 200,
    type: 'presentation',
  },
  {
    id: 7,
    name: 'Cộng tác viên xuất sắc',
    description: 'Cộng tác với 5 người dùng khác nhau',
    icon: Users,
    color: 'bg-amber-500',
    unlocked: false,
    progress: 40,
    date: null,
    points: 300,
    type: 'presentation',
  },
  {
    id: 8,
    name: 'Bậc thầy thuyết trình',
    description: 'Tạo 50 bài thuyết trình',
    icon: Crown,
    color: 'bg-rose-500',
    unlocked: false,
    progress: 24,
    date: null,
    points: 500,
    type: 'presentation',
  },
  // Quiz achievements
  {
    id: 9,
    name: 'Nhà khảo sát mới',
    description: 'Tạo quiz đầu tiên',
    icon: Target,
    color: 'bg-emerald-500',
    unlocked: true,
    progress: 100,
    date: '15/07/2023',
    points: 100,
    type: 'quiz',
  },
  {
    id: 10,
    name: 'Chuyên gia câu hỏi',
    description: 'Tạo 10 quiz khác nhau',
    icon: BrainCircuit,
    color: 'bg-indigo-500',
    unlocked: false,
    progress: 40,
    date: null,
    points: 250,
    type: 'quiz',
  },
  {
    id: 11,
    name: 'Thách thức tư duy',
    description: 'Nhận 100 lượt tham gia quiz',
    icon: Users,
    color: 'bg-orange-500',
    unlocked: false,
    progress: 72,
    date: null,
    points: 300,
    type: 'quiz',
  },
  {
    id: 12,
    name: 'Kiểm tra toàn diện',
    description: 'Tạo quiz với ít nhất 5 loại câu hỏi khác nhau',
    icon: Sparkles,
    color: 'bg-sky-500',
    unlocked: true,
    progress: 100,
    date: '25/08/2023',
    points: 200,
    type: 'quiz',
  },
];

// Danh sách cấp độ thành tựu
const levels = [
  { level: 1, name: 'Người mới', points: 0, color: 'bg-slate-500' },
  {
    level: 2,
    name: 'Người thuyết trình nghiệp dư',
    points: 500,
    color: 'bg-blue-500',
  },
  {
    level: 3,
    name: 'Chuyên gia nội dung',
    points: 1000,
    color: 'bg-purple-500',
  },
  {
    level: 4,
    name: 'Bậc thầy trình bày',
    points: 2000,
    color: 'bg-yellow-500',
  },
  {
    level: 5,
    name: 'Diễn giả huyền thoại',
    points: 5000,
    color: 'bg-rose-500',
  },
];

// Danh sách hoạt động gần đây
const recentActivities = [
  {
    id: 1,
    action: 'Đã hoàn thành bài thuyết trình',
    title: 'Kế hoạch marketing 2023',
    date: 'Hôm nay',
    points: 100,
  },
  {
    id: 2,
    action: 'Đã nhận thành tựu mới',
    title: 'Ngôi sao nội dung',
    date: 'Hôm qua',
    points: 300,
  },
  {
    id: 3,
    action: 'Đã sử dụng mẫu mới',
    title: 'Mẫu báo cáo tài chính Q2',
    date: '3 ngày trước',
    points: 50,
  },
  {
    id: 4,
    action: 'Đã cộng tác với người dùng mới',
    title: 'Nguyễn Văn A',
    date: '1 tuần trước',
    points: 75,
  },
];

export default function AchievementsPage() {
  const [currentTab, setCurrentTab] = useState('all');
  const [achievementType, setAchievementType] = useState('all');
  const [totalPoints, setTotalPoints] = useState(0);
  const [currentLevel, setCurrentLevel] = useState(null);
  const [progress, setProgress] = useState(0);
  const [nextLevel, setNextLevel] = useState(null);

  useEffect(() => {
    // Tính tổng điểm
    const points = achievements.reduce((sum, achievement) => {
      if (achievement.unlocked) {
        return sum + achievement.points;
      }
      return sum;
    }, 0);
    setTotalPoints(points);

    // Xác định cấp độ hiện tại và cấp độ tiếp theo
    let current = levels[0];
    let next = levels[1];

    for (let i = levels.length - 1; i >= 0; i--) {
      if (points >= levels[i].points) {
        current = levels[i];
        next = i < levels.length - 1 ? levels[i + 1] : null;
        break;
      }
    }

    setCurrentLevel(current);
    setNextLevel(next);

    // Tính phần trăm tiến độ đến cấp độ tiếp theo
    if (next) {
      const levelProgress =
        ((points - current.points) / (next.points - current.points)) * 100;
      setProgress(levelProgress);
    } else {
      setProgress(100);
    }
  }, []);

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

  // Lọc thành tựu theo tab và loại
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
    <div className='mx-8 md:mx-16 lg:mx-32 mt-8 mb-12 w-full'>
      <Header />
      <main className='flex-1 overflow-hidden'>
        <section className='container py-6 md:py-10'>
          <motion.div
            className='text-center mb-8'
            initial='hidden'
            animate='visible'
            variants={fadeIn}
          >
            <h1 className='text-3xl md:text-4xl font-bold mb-4 relative inline-block'>
              Thành tựu của bạn
              <motion.div
                className='absolute -right-8 -top-8'
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.5, type: 'spring', bounce: 0.5 }}
              >
                <Trophy className='w-6 h-6 text-yellow-500' />
              </motion.div>
            </h1>
            <p className='text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto'>
              Theo dõi tiến độ và mở khóa các thành tựu mới khi bạn sử dụng
              PreziQ
            </p>
          </motion.div>

          <div className='grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8'>
            {/* Thống kê điểm và cấp độ - Cột 1 (8/12) */}
            <motion.div
              className='lg:col-span-8 bg-card rounded-xl border p-6 relative overflow-hidden'
              variants={itemVariants}
              initial='hidden'
              animate='visible'
            >
              <div className='flex flex-col md:flex-row items-start md:items-center gap-4 mb-6'>
                <div className='flex-shrink-0'>
                  {currentLevel && (
                    <div
                      className={`w-16 h-16 rounded-full flex items-center justify-center text-white ${currentLevel.color}`}
                    >
                      <span className='text-2xl font-bold'>
                        {currentLevel.level}
                      </span>
                    </div>
                  )}
                </div>
                <div className='flex-grow'>
                  <h3 className='text-xl font-bold flex items-center gap-2'>
                    {currentLevel?.name}
                    {currentLevel?.level >= 3 && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.8, type: 'spring' }}
                      >
                        <Badge
                          variant='outline'
                          className='ml-2 bg-amber-500/10 text-amber-500 border-amber-500/20'
                        >
                          VIP
                        </Badge>
                      </motion.div>
                    )}
                  </h3>
                  <p className='text-muted-foreground mb-2'>
                    Tổng điểm:{' '}
                    <span className='font-semibold text-primary'>
                      {totalPoints}
                    </span>
                  </p>

                  {nextLevel ? (
                    <div className='w-full'>
                      <div className='flex justify-between text-sm mb-1'>
                        <span>{currentLevel?.points} điểm</span>
                        <span>{nextLevel?.points} điểm</span>
                      </div>
                      <div className='relative'>
                        <Progress value={progress} className='h-2' />
                        <motion.div
                          className='absolute left-0 top-0 h-2 bg-primary rounded-full'
                          initial={{ width: 0 }}
                          animate={{ width: `${progress}%` }}
                          transition={{ duration: 1, delay: 0.5 }}
                        />
                      </div>
                      <p className='text-xs text-muted-foreground mt-1'>
                        Cần thêm{' '}
                        <span className='font-semibold'>
                          {nextLevel?.points - totalPoints}
                        </span>{' '}
                        điểm để đạt cấp độ tiếp theo
                      </p>
                    </div>
                  ) : (
                    <p className='text-sm text-muted-foreground'>
                      Bạn đã đạt cấp độ cao nhất!
                    </p>
                  )}
                </div>
              </div>

              <h3 className='font-semibold mb-3'>Cấp độ thành tựu</h3>
              <div className='grid grid-cols-2 md:grid-cols-5 gap-3'>
                {levels.map((level, index) => (
                  <motion.div
                    key={level.level}
                    className={cn(
                      'rounded-lg p-3 text-center border',
                      currentLevel && level.level <= currentLevel.level
                        ? level.color +
                            '/20 border-' +
                            level.color.split('-')[1] +
                            '-500/30'
                        : 'bg-muted/30'
                    )}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2 + index * 0.1 }}
                  >
                    <div className='text-lg font-bold'>{level.level}</div>
                    <div className='text-xs'>{level.name}</div>
                    <div className='text-xs text-muted-foreground mt-1'>
                      {level.points} điểm
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Hoạt động gần đây - Cột 2 (4/12) */}
            <motion.div
              className='lg:col-span-4 bg-card rounded-xl border p-6'
              variants={itemVariants}
              initial='hidden'
              animate='visible'
            >
              <h2 className='text-xl font-semibold mb-4 flex items-center'>
                <Clock className='w-5 h-5 mr-2 text-muted-foreground' />
                Hoạt động gần đây
              </h2>
              <div className='space-y-4 max-h-[320px] overflow-y-auto pr-2'>
                {recentActivities.map((activity, index) => (
                  <motion.div
                    key={activity.id}
                    className='flex items-start gap-3 pb-3 border-b last:border-0'
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.3 + index * 0.1 }}
                  >
                    <div className='w-2 h-2 rounded-full bg-primary mt-2' />
                    <div className='flex-grow'>
                      <p className='text-sm font-medium'>{activity.action}</p>
                      <p className='text-sm text-muted-foreground'>
                        {activity.title}
                      </p>
                      <div className='flex justify-between items-center mt-1'>
                        <span className='text-xs text-muted-foreground'>
                          {activity.date}
                        </span>
                        <Badge variant='outline' className='text-xs'>
                          +{activity.points} điểm
                        </Badge>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Danh sách thành tựu */}
          <motion.div
            className='bg-card rounded-xl border p-6 mb-8'
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className='flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4'>
              <h2 className='text-2xl font-semibold'>Danh sách thành tựu</h2>
              <div className='flex flex-col sm:flex-row gap-3 w-full md:w-auto'>
                <Tabs
                  defaultValue='all'
                  value={currentTab}
                  onValueChange={setCurrentTab}
                  className='w-full sm:w-auto'
                >
                  <TabsList className='grid w-full sm:w-auto grid-cols-3'>
                    <TabsTrigger value='all'>Tất cả</TabsTrigger>
                    <TabsTrigger value='unlocked'>Đã mở khóa</TabsTrigger>
                    <TabsTrigger value='locked'>Chưa mở khóa</TabsTrigger>
                  </TabsList>
                </Tabs>

                <Tabs
                  defaultValue='all'
                  value={achievementType}
                  onValueChange={setAchievementType}
                  className='w-full sm:w-auto'
                >
                  <TabsList className='grid w-full sm:w-auto grid-cols-3'>
                    <TabsTrigger value='all'>Tất cả</TabsTrigger>
                    <TabsTrigger value='presentation'>Thuyết trình</TabsTrigger>
                    <TabsTrigger value='quiz'>Quiz</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </div>

            {filteredAchievements.length > 0 ? (
              <motion.div
                className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
                variants={containerVariants}
                initial='hidden'
                animate='visible'
              >
                {filteredAchievements.map((achievement, index) => (
                  <motion.div
                    key={achievement.id}
                    className={cn(
                      'rounded-xl border p-5 relative overflow-hidden transition-all h-full',
                      achievement.unlocked
                        ? 'bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800'
                        : 'bg-muted/30'
                    )}
                    variants={itemVariants}
                    whileHover={{
                      y: -5,
                      transition: { type: 'spring', stiffness: 300 },
                    }}
                  >
                    {/* Badge showing achievement type */}
                    <div className='absolute top-2 right-2'>
                      <Badge
                        variant='outline'
                        className={cn(
                          'text-xs',
                          achievement.type === 'presentation'
                            ? 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                            : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                        )}
                      >
                        {achievement.type === 'presentation'
                          ? 'Thuyết trình'
                          : 'Quiz'}
                      </Badge>
                    </div>

                    {/* Mức độ hoàn thành */}
                    <div className='absolute bottom-0 left-0 h-1 bg-primary/20'>
                      <motion.div
                        className={`h-full ${achievement.color}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${achievement.progress}%` }}
                        transition={{ duration: 1, delay: 0.5 + index * 0.1 }}
                      />
                    </div>

                    <div className='flex gap-4 mb-4'>
                      <div
                        className={cn(
                          'w-12 h-12 rounded-lg flex items-center justify-center',
                          achievement.unlocked ? achievement.color : 'bg-muted',
                          'text-white'
                        )}
                      >
                        <achievement.icon className='w-6 h-6' />
                      </div>
                      <div>
                        <h3 className='font-semibold'>{achievement.name}</h3>
                        <p className='text-sm text-muted-foreground'>
                          {achievement.description}
                        </p>
                      </div>
                    </div>

                    <div className='flex justify-between items-center mt-4'>
                      <span className='text-xs text-muted-foreground'>
                        {achievement.unlocked
                          ? `Đạt được ngày ${achievement.date}`
                          : `Hoàn thành ${achievement.progress}%`}
                      </span>
                      <Badge
                        className={cn(
                          achievement.unlocked ? 'bg-primary' : 'bg-muted'
                        )}
                      >
                        {achievement.points} điểm
                      </Badge>
                    </div>

                    {/* Hiệu ứng huy hiệu */}
                    {achievement.unlocked && (
                      <motion.div
                        className='absolute -right-4 -top-4 w-16 h-16 rotate-12'
                        initial={{ opacity: 0, rotate: 45, scale: 0.5 }}
                        animate={{ opacity: 1, rotate: 12, scale: 1 }}
                        transition={{
                          delay: 0.8 + index * 0.1,
                          type: 'spring',
                        }}
                      >
                        <div className='absolute inset-0 bg-primary/10 rounded-full blur-xl' />
                        <Award className='w-8 h-8 text-primary absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2' />
                      </motion.div>
                    )}
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <div className='py-10 text-center'>
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className='inline-flex flex-col items-center'
                >
                  <div className='rounded-full bg-muted/30 p-6 mb-4'>
                    <Sparkles className='w-10 h-10 text-muted-foreground' />
                  </div>
                  <h3 className='text-lg font-semibold mb-2'>
                    Không tìm thấy thành tựu nào
                  </h3>
                  <p className='text-muted-foreground max-w-md'>
                    Thử thay đổi bộ lọc hoặc tiếp tục sử dụng PreziQ để mở khóa
                    thêm thành tựu mới
                  </p>
                </motion.div>
              </div>
            )}
          </motion.div>

          {/* Phần thống kê và mục tiêu - Chia thành 2 cột */}
          <div className='grid grid-cols-1 lg:grid-cols-12 gap-6'>
            {/* Mục tiêu của bạn - Cột 1 (6/12) */}
            <motion.div
              className='lg:col-span-6 bg-card rounded-xl border p-6'
              variants={itemVariants}
              initial='hidden'
              animate='visible'
            >
              <h2 className='text-xl font-semibold mb-4 flex items-center'>
                <Target className='w-5 h-5 mr-2 text-muted-foreground' />
                Mục tiêu của bạn
              </h2>

              <div className='space-y-4'>
                <div className='space-y-2'>
                  <div className='flex justify-between items-center'>
                    <span className='text-sm font-medium'>
                      Tạo 10 bài thuyết trình trong tháng
                    </span>
                    <span className='text-xs font-medium'>7/10</span>
                  </div>
                  <div className='w-full bg-muted/30 rounded-full h-2'>
                    <motion.div
                      className='bg-blue-500 h-2 rounded-full'
                      initial={{ width: 0 }}
                      animate={{ width: '70%' }}
                      transition={{ duration: 1, delay: 0.7 }}
                    />
                  </div>
                </div>

                <div className='space-y-2'>
                  <div className='flex justify-between items-center'>
                    <span className='text-sm font-medium'>
                      Sử dụng 5 mẫu khác nhau
                    </span>
                    <span className='text-xs font-medium'>3/5</span>
                  </div>
                  <div className='w-full bg-muted/30 rounded-full h-2'>
                    <motion.div
                      className='bg-purple-500 h-2 rounded-full'
                      initial={{ width: 0 }}
                      animate={{ width: '60%' }}
                      transition={{ duration: 1, delay: 0.8 }}
                    />
                  </div>
                </div>

                <div className='space-y-2'>
                  <div className='flex justify-between items-center'>
                    <span className='text-sm font-medium'>
                      Nhận 100 lượt xem cho bài thuyết trình
                    </span>
                    <span className='text-xs font-medium'>87/100</span>
                  </div>
                  <div className='w-full bg-muted/30 rounded-full h-2'>
                    <motion.div
                      className='bg-green-500 h-2 rounded-full'
                      initial={{ width: 0 }}
                      animate={{ width: '87%' }}
                      transition={{ duration: 1, delay: 0.9 }}
                    />
                  </div>
                </div>

                <div className='space-y-2'>
                  <div className='flex justify-between items-center'>
                    <span className='text-sm font-medium'>
                      Tạo 5 bài quiz mới
                    </span>
                    <span className='text-xs font-medium'>2/5</span>
                  </div>
                  <div className='w-full bg-muted/30 rounded-full h-2'>
                    <motion.div
                      className='bg-emerald-500 h-2 rounded-full'
                      initial={{ width: 0 }}
                      animate={{ width: '40%' }}
                      transition={{ duration: 1, delay: 1 }}
                    />
                  </div>
                </div>
              </div>

              <div className='flex gap-3 mt-6'>
                <Button variant='outline' className='flex-1'>
                  Thiết lập mục tiêu mới
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

            {/* Thành tựu sắp đạt được - Cột 2 (6/12) */}
            <motion.div
              className='lg:col-span-6 bg-card rounded-xl border p-6'
              variants={itemVariants}
              initial='hidden'
              animate='visible'
            >
              <h2 className='text-xl font-semibold mb-4 flex items-center'>
                <Zap className='w-5 h-5 mr-2 text-muted-foreground' />
                Thành tựu sắp đạt được
              </h2>

              <div className='space-y-5'>
                {achievements
                  .filter((a) => !a.unlocked && a.progress > 0)
                  .sort((a, b) => b.progress - a.progress)
                  .slice(0, 4)
                  .map((achievement, index) => (
                    <motion.div
                      key={achievement.id}
                      className='flex items-center gap-4'
                      initial={{ x: 20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.7 + index * 0.1 }}
                    >
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center bg-muted text-muted-foreground`}
                      >
                        <achievement.icon className='w-5 h-5' />
                      </div>
                      <div className='flex-grow'>
                        <div className='flex justify-between'>
                          <h3 className='text-sm font-medium'>
                            {achievement.name}
                          </h3>
                          <span className='text-xs text-muted-foreground'>
                            {achievement.progress}%
                          </span>
                        </div>
                        <div className='w-full bg-muted/30 rounded-full h-1.5 mt-1'>
                          <motion.div
                            className={`h-1.5 rounded-full ${achievement.color}`}
                            initial={{ width: 0 }}
                            animate={{ width: `${achievement.progress}%` }}
                            transition={{
                              duration: 1,
                              delay: 0.8 + index * 0.1,
                            }}
                          />
                        </div>
                        <p className='text-xs text-muted-foreground mt-0.5'>
                          {achievement.type === 'presentation'
                            ? 'Thuyết trình'
                            : 'Quiz'}{' '}
                          • {achievement.points} điểm
                        </p>
                      </div>
                    </motion.div>
                  ))}
              </div>

              {/* Thông báo thêm */}
              <motion.div
                className='mt-6 p-4 bg-primary/10 rounded-lg border border-primary/20'
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1 }}
              >
                <p className='text-sm flex items-center'>
                  <Sparkles className='w-4 h-4 mr-2 text-primary' />
                  Tiếp tục sử dụng PreziQ để mở khóa thêm thành tựu và nhận
                  nhiều phần thưởng!
                </p>
              </motion.div>
            </motion.div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
