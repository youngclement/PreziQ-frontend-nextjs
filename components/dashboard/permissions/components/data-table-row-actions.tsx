import { DotsHorizontalIcon } from '@radix-ui/react-icons';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Row } from '@tanstack/react-table';
import { Permission } from '../data/schema';
import { usePermissions } from '../context/permissions-context';

interface DataTableRowActionsProps {
  row: Row<Permission>;
  onDelete?: (permission: Permission) => void;
}

export function DataTableRowActions({
  row,
  onDelete,
}: DataTableRowActionsProps) {
  const { setOpen, setCurrentRow } = usePermissions();

  const handleEdit = () => {
    setCurrentRow(row.original);
    setOpen('edit');
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(row.original);
    }
  };

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="flex h-8 w-8 p-0 data-[state=open]:bg-muted"
        >
          <DotsHorizontalIcon className="h-4 w-4" />
          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[160px]">
        <DropdownMenuItem onClick={handleEdit}>Chỉnh sửa</DropdownMenuItem>
        <DropdownMenuItem onClick={handleDelete} className="text-red-600">
          Xóa
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
