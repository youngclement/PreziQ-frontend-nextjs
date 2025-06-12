'use client';

import { IconMailPlus, IconUserPlus } from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { useUsers } from '../context/users-context';
import { useLanguage } from '@/contexts/language-context';

export function UsersPrimaryButtons() {
  const { setOpen } = useUsers();
  const { t } = useLanguage();

  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        className="space-x-1"
        onClick={() => setOpen('invite')}
      >
        <span>{t('userManagement.inviteUser')}</span> <IconMailPlus size={18} />
      </Button>
      <Button className="space-x-1" onClick={() => setOpen('add')}>
        <span>{t('userManagement.addUser')}</span> <IconUserPlus size={18} />
      </Button>
    </div>
  );
}
