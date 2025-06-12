import { useState } from 'react';
import { IconAlertTriangle } from '@tabler/icons-react';
import { toast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ConfirmDialog } from '@/components/dashboard/confirm-dialog';
import { useRoles } from '../context/roles-context';
import { useLanguage } from '@/contexts/language-context';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RolesDeleteDialog({ open, onOpenChange }: Props) {
  const [value, setValue] = useState('');
  const { currentRow, deleteRole } = useRoles();
  const { t } = useLanguage();

  if (!currentRow) return null;

  const handleDelete = async () => {
    if (value.trim() !== currentRow.name) return;

    try {
      await deleteRole(currentRow.roleId);
      toast({
        title: t('success'),
        description: t('roleDeleteSuccess', { roleName: currentRow.name }),
      });
      onOpenChange(false);
      setValue(''); // Reset input after successful deletion
    } catch (error) {
      toast({
        variant: 'destructive',
        title: t('error'),
        description:
          error instanceof Error ? error.message : t('roleDeleteError'),
      });
    }
  };

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={(open) => {
        onOpenChange(open);
        if (!open) setValue(''); // Reset input when dialog closes
      }}
      title={t('confirmDelete')}
      desc={t('roleDeleteConfirmation', { roleName: currentRow.name })}
      handleConfirm={handleDelete}
      disabled={value.trim() !== currentRow.name}
      className="gap-6"
    >
      <div className="space-y-4">
        <Label className="space-y-2">
          <span>
            {t('enterRoleNameToConfirm', { roleName: currentRow.name })}
          </span>
          <Input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={t('enterRoleNamePlaceholder')}
          />
        </Label>

        <Alert variant="destructive">
          <IconAlertTriangle className="h-4 w-4" />
          <AlertTitle>{t('warning')}</AlertTitle>
          <AlertDescription>{t('roleDeleteWarning')}</AlertDescription>
        </Alert>
      </div>
    </ConfirmDialog>
  );
}
