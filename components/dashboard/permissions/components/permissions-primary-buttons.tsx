import { Button } from '@/components/ui/button';
import { IconPlus } from '@tabler/icons-react';
import { usePermissions } from '../context/permissions-context';

export function PermissionsPrimaryButtons() {
  const { setOpen } = usePermissions();

  return (
    <div className="flex items-center gap-x-2">
      <Button onClick={() => setOpen('add')} size="sm">
        <IconPlus className="mr-2 h-4 w-4" />
        New Permission
      </Button>
    </div>
  );
}
