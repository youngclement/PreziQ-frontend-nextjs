'use client';

import { useAchievements } from '../context/achievements-context';
import { AchievementActionDialog } from './achievement-action-dialog';
import { AchievementDeleteDialog } from './achievement-delete-dialog';

export function AchievementDialogs() {
  const { open, setOpen, currentRow, setCurrentRow } = useAchievements();

  return (
    <>
      <AchievementActionDialog
        key="achievement-add"
        open={open === 'add'}
        onOpenChange={(state) => {
          if (!state) setOpen(null);
        }}
      />

      {currentRow && (
        <>
          <AchievementActionDialog
            key={`achievement-edit-${currentRow.achievementId}`}
            open={open === 'edit'}
            onOpenChange={(state) => {
              if (!state) {
                setOpen(null);
                setCurrentRow(null);
              }
            }}
            currentRow={currentRow}
          />

          <AchievementDeleteDialog
            key={`achievement-delete-${currentRow.achievementId}`}
            open={open === 'delete'}
            onOpenChange={(state) => {
              if (!state) {
                setOpen(null);
                setCurrentRow(null);
              }
            }}
            currentRow={currentRow}
          />
        </>
      )}
    </>
  );
}
