'use client';

import Header from '@/components/header';
import Footer from '@/components/footer';
import AchievementHeader from '@/components/achievements/AchievementHeader';
import UserStats from '@/components/achievements/UserStats';
import RecentActivities from '@/components/achievements/RecentActivities';
import AchievementsList from '@/components/achievements/AchievementsList';
import GoalsSection from '@/components/achievements/GoalsSection';
import UpcomingAchievements from '@/components/achievements/UpcomingAchievements';
import { achievements } from '@/components/achievements/data';

export default function AchievementsPage() {
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
          <AchievementsList />

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
