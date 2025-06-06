import { IconPlus } from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { useRoles } from '../context/roles-context';
import { useLanguage } from '@/contexts/language-context';

export function RolesPrimaryButtons() {
  const { setOpen } = useRoles();
  const { t } = useLanguage();

  return (
    <div className="flex gap-2">
      <Button className="space-x-1" onClick={() => setOpen('add')}>
        <span>{t('addNewRole')}</span> <IconPlus size={18} />
      </Button>
    </div>
  );
}
