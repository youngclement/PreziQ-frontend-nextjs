import { useState } from 'react';
import { IconAlertTriangle } from '@tabler/icons-react';
import { toast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ConfirmDialog } from '@/components/dashboard/confirm-dialog';
import { useRoles } from '../context/roles-context';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RolesDeleteDialog({ open, onOpenChange }: Props) {
  const [value, setValue] = useState('');
  const { currentRow, deleteRole } = useRoles();

  if (!currentRow) return null;

  const handleDelete = async () => {
    if (value.trim() !== currentRow.name) return;

    try {
      await deleteRole(currentRow.id);
      toast({
        title: 'Xóa vai trò thành công',
        description: `Vai trò ${currentRow.name} đã được xóa.`,
      });
      onOpenChange(false);
      setValue(''); // Reset input sau khi xóa thành công
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Có lỗi xảy ra',
        description:
          error instanceof Error
            ? error.message
            : 'Không thể xóa vai trò. Vui lòng thử lại sau.',
      });
    }
  };

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={(open) => {
        onOpenChange(open);
        if (!open) setValue(''); // Reset input khi đóng dialog
      }}
      title="Bạn chắc chắn muốn xóa?"
      desc={`Hành động này sẽ xóa vĩnh viễn vai trò "${currentRow.name}" và không thể khôi phục.`}
      handleConfirm={handleDelete}
      disabled={value.trim() !== currentRow.name}
      className="gap-6"
    >
      <div className="space-y-4">
        <Label className="space-y-2">
          <span>
            Nhập "<span className="font-medium">{currentRow.name}</span>" để xác
            nhận:
          </span>
          <Input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Nhập tên vai trò để xác nhận xóa"
          />
        </Label>

        <Alert variant="destructive">
          <IconAlertTriangle className="h-4 w-4" />
          <AlertTitle>Cảnh báo!</AlertTitle>
          <AlertDescription>
            Việc xóa vai trò này sẽ loại bỏ tất cả các quyền liên quan và có thể
            ảnh hưởng đến người dùng được gán vai trò này.
          </AlertDescription>
        </Alert>
      </div>
    </ConfirmDialog>
  );
}
