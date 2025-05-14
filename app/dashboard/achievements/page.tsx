'use client';

import { Main } from '@/components/dashboard/layout/MainDB';
import { AchievementsProvider } from '@/components/dashboard/achievements/context/achievements-context';
import { AchievementGrid } from '@/components/dashboard/achievements/components/achievement-grid';
import { AchievementDialogs } from '@/components/dashboard/achievements/components/achievement-dialogs';
import { AchievementPrimaryButtons } from '@/components/dashboard/achievements/components/achievement-primary-buttons';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';
import { useAchievements } from '@/components/dashboard/achievements/context/achievements-context';

function AchievementsContent() {
  const { achievements, isLoading, error } = useAchievements();
  console.log('achievement', achievements);
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <>
      <div className="mb-2 flex items-center justify-between space-y-2 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Quản lý thành tựu
          </h2>
          <p className="text-muted-foreground">
            Quản lý thành tựu trong hệ thống tại đây.
          </p>
        </div>
        <AchievementPrimaryButtons />
      </div>
      <div className="-mx-4 flex-1 overflow-auto px-4 py-1">
        <AchievementGrid data={achievements} />
      </div>
      <AchievementDialogs />
    </>
  );
}

export default function AchievementsPage() {
  return (
    <AchievementsProvider>
      <Main>
        <AchievementsContent />
      </Main>
    </AchievementsProvider>
  );
}
