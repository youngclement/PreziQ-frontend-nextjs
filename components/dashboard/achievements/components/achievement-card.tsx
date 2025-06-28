'use client';

import type { Achievement } from '../data/schema';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, Award, Star } from 'lucide-react';
import { useAchievements } from '../context/achievements-context';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/language-context';

interface AchievementCardProps {
  achievement: Achievement;
  isSelected: boolean;
  onSelect: (selected: boolean) => void;
}

export function AchievementCard({
  achievement,
  isSelected,
  onSelect,
}: AchievementCardProps) {
  const { setOpen, setCurrentRow } = useAchievements();
  const { t } = useLanguage();

  const handleEdit = () => {
    setCurrentRow(achievement);
    setOpen('edit');
  };

  const handleDelete = () => {
    setCurrentRow(achievement);
    setOpen('delete');
  };

  // Format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';

    try {
      let date: Date;

      if (dateString.includes(' ')) {
        const [datePart, timePart] = dateString.split(' ');
        const [time, period] = timePart.split(' ');
        const [hours, minutes] = time.split(':');
        const hour = Number.parseInt(hours);
        const adjustedHour =
          period === 'PM' && hour !== 12
            ? hour + 12
            : period === 'AM' && hour === 12
            ? 0
            : hour;
        const formattedTime = `${adjustedHour
          .toString()
          .padStart(2, '0')}:${minutes}`;
        const isoString = `${datePart}T${formattedTime}`;
        date = new Date(isoString);
      } else if (dateString.includes('T')) {
        date = new Date(dateString);
      } else {
        date = new Date(Number.parseInt(dateString));
      }

      if (isNaN(date.getTime())) throw new Error('Ngày không hợp lệ');

      return date
        .toLocaleString('vi-VN', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
          hour12: false,
          timeZone: 'Asia/Ho_Chi_Minh',
        })
        .replace('lúc ', '');
    } catch (error) {
      console.error('Lỗi khi định dạng ngày:', error);
      return 'N/A';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ scale: 1.02 }}
      className="h-full"
    >
      <Card
        className={cn(
          'h-full border-slate-200 transition-all duration-200 hover:shadow-md',
          isSelected && 'border-primary bg-primary/5'
        )}
      >
        <CardHeader className="relative pb-2">
          <div className="absolute top-2 left-2">
            <Checkbox
              checked={isSelected}
              onCheckedChange={onSelect}
              aria-label="Select achievement"
              className="h-5 w-5"
            />
          </div>
          <div className="flex justify-center pt-4">
            <Avatar className="h-20 w-20 rounded-md border-2 border-slate-200">
              <AvatarImage
                src={
                  achievement.iconUrl || '/placeholder.svg?height=80&width=80'
                }
                alt={achievement.name}
              />
              <AvatarFallback className="rounded-md bg-primary/10">
                <Award className="h-10 w-10 text-primary" />
              </AvatarFallback>
            </Avatar>
          </div>
          <div className="mt-2 text-center">
            <h3
              className="font-semibold text-lg truncate"
              title={achievement.name}
            >
              {achievement.name}
            </h3>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="min-h-[60px] text-sm text-slate-600 dark:text-slate-200">
            {achievement.description || (
              <span className="text-slate-400 italic">
                {t('achievementDescriptionPlaceholder')}
              </span>
            )}
          </div>
          <div className="flex items-center justify-between">
            <Badge
              variant="outline"
              className="bg-amber-50 text-amber-700 hover:bg-amber-100 flex items-center gap-1"
            >
              <Star className="h-3 w-3" />
              <span>
                {achievement.requiredPoints} {t('achievementRequiredPoints')}
              </span>
            </Badge>
            <Badge
              variant="outline"
              className="bg-slate-50 text-slate-700 hover:bg-slate-100"
            >
              {formatDate(achievement.createdAt)}
            </Badge>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end gap-2 pt-2 border-t">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleEdit}
            className="text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:bg-zinc-600 dark:text-slate-200 dark:hover:bg-slate-900"
          >
            <Edit className="h-4 w-4 mr-1" />
            {t('achievementEdit')}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4 mr-1" />
            {t('achievementDelete')}
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
}
