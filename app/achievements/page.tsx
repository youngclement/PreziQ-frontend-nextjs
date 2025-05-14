'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/header';
import Footer from '@/components/footer';
import AchievementHeader from '@/components/achievements/AchievementHeader';
import UserStats from '@/components/achievements/UserStats';
import RecentActivities from '@/components/achievements/RecentActivities';
import AchievementsList from '@/components/achievements/AchievementsList';
import GoalsSection from '@/components/achievements/GoalsSection';
import UpcomingAchievements from '@/components/achievements/UpcomingAchievements';
import { achievementsApi } from '@/api-client/achievements-api';
import { toast } from 'sonner';
import Loading from '@/components/common/loading';

interface AchievementWithUI {
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

export default function AchievementsPage() {
  const [achievements, setAchievements] = useState<AchievementWithUI[]>([]);
  const [loading, setLoading] = useState(true);
  const [myAchievements, setMyAchievements] = useState<any>(null);

  // Map API achievements to UI model
  const mapToUIModel = (apiAchievements: any[], unlocked: boolean = false) => {
    // Default colors and icons if not specified
    const defaultColors = [
      'bg-blue-500',
      'bg-purple-500',
      'bg-green-500',
      'bg-yellow-500',
      'bg-emerald-500',
      'bg-cyan-500',
      'bg-amber-500',
      'bg-rose-500',
    ];

    return apiAchievements.map((achievement, index) => ({
      id: achievement.achievementId,
      name: achievement.name,
      description:
        achievement.description || 'Complete this achievement to earn points',
      iconUrl: achievement.iconUrl,
      unlocked: unlocked,
      progress: unlocked ? 100 : Math.floor(Math.random() * 80), // Mock progress for locked achievements
      date: unlocked ? formatDate(achievement.updatedAt) : undefined,
      points: achievement.requiredPoints,
      type: 'presentation', // Default type
      color: defaultColors[index % defaultColors.length],
      icon: null, // Will be set in the component
    }));
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString();
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch all achievements and my achievements
        const [allAchievements, myAchievementsData] = await Promise.all([
          achievementsApi.getAllAchievements(),
          achievementsApi.getMyAchievements(),
        ]);

        // Get the IDs of achievements I've unlocked
        const myAchievementIds = myAchievementsData.content.map(
          (a: any) => a.achievementId
        );

        // Mark achievements as unlocked or locked
        const uiAchievements = allAchievements.map((achievement) => {
          const isUnlocked = myAchievementIds.includes(
            achievement.achievementId
          );
          const myAchievement = isUnlocked
            ? myAchievementsData.content.find(
                (a: any) => a.achievementId === achievement.achievementId
              )
            : null;

          return {
            id: achievement.achievementId,
            name: achievement.name,
            description:
              achievement.description ||
              'Complete this achievement to earn points',
            iconUrl: achievement.iconUrl,
            unlocked: isUnlocked,
            progress: isUnlocked ? 100 : Math.floor(Math.random() * 80), // Mock progress for locked achievements
            date: isUnlocked
              ? formatDate(myAchievement?.updatedAt || achievement.updatedAt)
              : undefined,
            points: achievement.requiredPoints,
            type: 'presentation', // Default type
            color: `bg-${
              [
                'blue',
                'purple',
                'green',
                'yellow',
                'emerald',
                'cyan',
                'amber',
                'rose',
              ][Math.floor(Math.random() * 8)]
            }-500`,
            icon: null,
          };
        });

        setAchievements(uiAchievements);
        setMyAchievements(myAchievementsData);
      } catch (error) {
        console.error('Failed to fetch achievements:', error);
        toast.error('Could not load achievements data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <Loading />;
  }

  return (
    <div className='mx-8 md:mx-16 lg:mx-32 mt-8 mb-12 w-full'>
      <Header />
      <main className='flex-1 overflow-hidden'>
        <section className='container py-6 md:py-10'>
          <AchievementHeader />

          <div className='grid grid-cols-1 lg:grid-cols-12 gap-6 mb-12'>
            {/* Stats and Levels - Column 1 (8/12) */}
            <UserStats achievements={achievements} />

            {/* Recent Activities - Column 2 (4/12) */}
            <RecentActivities />
          </div>

          {/* Achievement List */}
          <AchievementsList achievements={achievements} />

          {/* Goals and Upcoming Achievements - Two columns */}
          <div className='grid grid-cols-1 lg:grid-cols-12 gap-6'>
            {/* Your Goals - Column 1 (6/12) */}
            <GoalsSection />

            {/* Upcoming Achievements - Column 2 (6/12) */}
            <UpcomingAchievements />
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
