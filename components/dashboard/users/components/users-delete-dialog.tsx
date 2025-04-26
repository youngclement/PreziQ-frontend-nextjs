'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { User } from '../data/schema';
import { useUsers } from '../context/users-context';

interface Props {
  currentRow: User | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UsersDeleteDialog({ currentRow, open, onOpenChange }: Props) {
  const [value, setValue] = useState('');
  const { deleteUser } = useUsers();

  const handleDelete = async () => {
    if (!currentRow || value.trim() !== currentRow.email) return;

    await deleteUser(currentRow.userId);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[425px]'>
        <DialogHeader>
          <DialogTitle>Xóa người dùng</DialogTitle>
          <DialogDescription>
            Hành động này sẽ xoá vĩnh viễn người dùng này. Vui lòng nhập email{' '}
            <span className='font-medium'>{currentRow?.email}</span> để xác nhận
            xóa.
          </DialogDescription>
        </DialogHeader>
        <div className='py-4'>
          <Input
            placeholder='Nhập email để xác nhận'
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
        </div>
        <DialogFooter>
          <Button
            variant='destructive'
            onClick={handleDelete}
            disabled={value.trim() !== currentRow?.email}
          >
            Xóa
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
