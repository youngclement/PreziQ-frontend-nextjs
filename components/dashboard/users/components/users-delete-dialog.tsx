'use client';

import { useState } from 'react';
import { IconAlertTriangle } from '@tabler/icons-react';
import { toast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ConfirmDialog } from '@/components/dashboard/confirm-dialog';
import { User } from '../data/schema';
import { API_URL, ACCESS_TOKEN } from '@/api/http';

interface Props {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	currentRow: User;
	refetch: () => Promise<void>;
}

export function UsersDeleteDialog({
	open,
	onOpenChange,
	currentRow,
	refetch,
}: Props) {
	const [value, setValue] = useState('');

	const handleDelete = async () => {
		if (value.trim() !== currentRow.email) return;

		try {
			const response = await fetch(`${API_URL}/users/${currentRow.id}`, {
				method: 'DELETE',
				headers: {
					Authorization: `Bearer ${ACCESS_TOKEN}`,
				},
			});

			if (!response.ok) {
				throw new Error('Failed to delete user');
			}

			toast({
				title: 'Thành công',
				description: 'Xóa người dùng thành công.',
			});

			// Refetch lại dữ liệu sau khi xóa thành công
			await refetch();

			onOpenChange(false);
		} catch (error) {
			console.error('Error deleting user:', error);
			toast({
				title: 'Lỗi',
				description: 'Không thể xóa người dùng.',
				variant: 'destructive',
			});
		}
	};

	return (
		<ConfirmDialog
			open={open}
			onOpenChange={onOpenChange}
			handleConfirm={handleDelete}
			disabled={value.trim() !== currentRow.email}
			title={
				<span className="text-destructive">
					<IconAlertTriangle
						className="mr-1 inline-block stroke-destructive"
						size={18}
					/>{' '}
					Xóa người dùng
				</span>
			}
			desc={
				<div className="space-y-4">
					<p className="mb-2">
						Bạn có chắc chắn muốn xóa người dùng{' '}
						<span className="font-bold">{currentRow.email}</span>?
						<br />
						Hành động này sẽ xóa vĩnh viễn người dùng khỏi hệ thống và không thể
						hoàn tác.
					</p>

					<Label className="my-2">
						Email:
						<Input
							value={value}
							onChange={(e) => setValue(e.target.value)}
							placeholder="Nhập email để xác nhận xóa."
						/>
					</Label>

					<Alert variant="destructive">
						<AlertTitle>Cảnh báo!</AlertTitle>
						<AlertDescription>
							Vui lòng cẩn thận, hành động này không thể hoàn tác.
						</AlertDescription>
					</Alert>
				</div>
			}
			confirmText="Xóa"
			destructive
		/>
	);
}
