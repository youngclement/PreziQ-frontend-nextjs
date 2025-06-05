'use client';

import type React from 'react';
import { useState, useCallback } from 'react';
import useDialogState from '@/hooks/use-dialog-state';
import type { Achievement } from '../data/schema';
import { createContext, useContext } from 'react';
import { toast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { achievementsApi } from '@/api-client';
import { useLanguage } from '@/contexts/language-context';

type AchievementsDialogType = 'add' | 'edit' | 'delete';

interface AchievementsContextType {
  achievements: Achievement[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
  createAchievement: (data: any) => Promise<void>;
  updateAchievement: (id: string, data: any) => Promise<void>;
  deleteAchievement: (id: string) => Promise<void>;
  open: AchievementsDialogType | null;
  setOpen: (type: AchievementsDialogType | null) => void;
  currentRow: Achievement | null;
  setCurrentRow: (achievement: Achievement | null) => void;
}

const AchievementsContext = createContext<AchievementsContextType | undefined>(
  undefined
);

interface Props {
  children: React.ReactNode;
}

const AchievementsProvider = ({ children }: Props) => {
  const queryClient = useQueryClient();
  const [open, setOpen] = useDialogState<AchievementsDialogType>(null);
  const [currentRow, setCurrentRow] = useState<Achievement | null>(null);
  const { t } = useLanguage();

  // Fetch achievements with React Query
  const {
    data: achievements = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['achievements'],
    queryFn: async () => {
      try {
        const response = await achievementsApi.getAllAchievements();
        console.log('res: ', response);
        return response;
      } catch (error) {
        throw new Error(t('achievementLoadError'));
      }
    },
    staleTime: 5 * 60 * 1000, // Cache trong 5 phút
    gcTime: 30 * 60 * 1000, // Giữ cache 30 phút
  });

  // Mutation cho việc tạo achievement mới
  const createAchievementMutation = useMutation({
    mutationFn: async (achievementData: any) => {
      const response = await achievementsApi.createAchievement(achievementData);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['achievements'] });
      toast({
        title: t('success'),
        description: t('achievementCreateSuccess'),
      });
      setOpen(null);
    },
    onError: (error: Error) => {
      toast({
        title: t('error'),
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Mutation cho việc cập nhật achievement
  const updateAchievementMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await achievementsApi.updateAchievement(id, data);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['achievements'] });
      toast({
        title: t('success'),
        description: t('achievementUpdateSuccess'),
      });
      setOpen(null);
      setCurrentRow(null);
    },
    onError: (error: Error) => {
      toast({
        title: t('error'),
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Mutation cho việc xóa achievement
  const deleteAchievementMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await achievementsApi.deleteAchievement(id);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['achievements'] });
      toast({
        title: t('success'),
        description: t('achievementDeleteSuccess'),
      });
      setOpen(null);
      setCurrentRow(null);
    },
    onError: (error: Error) => {
      toast({
        title: t('error'),
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const createAchievement = useCallback(
    async (data: any) => {
      await createAchievementMutation.mutateAsync(data);
    },
    [createAchievementMutation]
  );

  const updateAchievement = useCallback(
    async (id: string, data: any) => {
      await updateAchievementMutation.mutateAsync({ id, data });
    },
    [updateAchievementMutation]
  );

  const deleteAchievement = useCallback(
    async (id: string) => {
      await deleteAchievementMutation.mutateAsync(id);
    },
    [deleteAchievementMutation]
  );

  return (
    <AchievementsContext.Provider
      value={{
        achievements,
        isLoading,
        error: error as string | null,
        refetch,
        createAchievement,
        updateAchievement,
        deleteAchievement,
        open,
        setOpen,
        currentRow,
        setCurrentRow,
      }}
    >
      {children}
    </AchievementsContext.Provider>
  );
};

export { AchievementsProvider };

export function useAchievements() {
  const context = useContext(AchievementsContext);
  if (context === undefined) {
    throw new Error(
      'useAchievements must be used within a AchievementsProvider'
    );
  }
  return context;
}
