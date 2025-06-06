'use client';

import { useAchievements } from '../context/achievements-context';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { Achievement } from '../data/schema';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';
import { storageApi } from '@/api-client/storage-api';
import { useLanguage } from '@/contexts/language-context';

interface Props {
  currentRow: Achievement;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AchievementDeleteDialog({
  currentRow,
  open,
  onOpenChange,
}: Props) {
  const { deleteAchievement } = useAchievements();
  const [isDeleting, setIsDeleting] = useState(false);
  const { t } = useLanguage();

  const handleDelete = async () => {
    try {
      setIsDeleting(true);

      const imageUrl = currentRow.iconUrl;
      if (imageUrl && imageUrl.includes('s3.amazonaws.com')) {
        const filePath = imageUrl.split('s3.amazonaws.com/')[1];
        await storageApi.deleteSingleFile(filePath);
        console.log(`Ảnh ${filePath} đã được xóa từ AWS S3`);
      }

      // Xóa thành tựu
      await deleteAchievement(currentRow.achievementId);
      onOpenChange(false);
    } catch (error) {
      console.error('Error deleting achievement or image:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[450px] p-0 gap-0 overflow-hidden border-slate-200 shadow-lg">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="w-full"
        >
          <DialogHeader className="p-6 pb-2 border-b bg-slate-50">
            <DialogTitle className="text-xl flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              {t('achievementConfirmDelete')}
            </DialogTitle>
            <DialogDescription className="text-slate-500">
              {t('achievementDeleteDesc')}
            </DialogDescription>
          </DialogHeader>
          <div className="p-6">
            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
              <p className="text-sm text-red-700">
                {t('achievementDeleteWarn')}{' '}
                <span className="font-semibold">{currentRow.name}</span>?
              </p>
            </div>
            <p className="text-sm text-slate-600">
              {t('achievementDeleteWarn2')}
            </p>
          </div>
          <DialogFooter className="p-6 border-t flex gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="transition-all duration-200 hover:bg-slate-100 hover:border-slate-300 hover:text-slate-900"
            >
              {t('achievementCancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
              className="transition-all duration-200 hover:bg-red-600 hover:shadow-lg"
            >
              {isDeleting ? (
                <div className="flex items-center gap-2">
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  {t('achievementDeleting')}
                </div>
              ) : (
                t('achievementDeleteBtn')
              )}
            </Button>
          </DialogFooter>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
