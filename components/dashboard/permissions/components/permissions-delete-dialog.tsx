import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useState } from 'react';
import { toast } from 'react-toastify';
import { usePermissions } from '../context/permissions-context';
import { permissionsApi } from '@/api-client';

interface Props {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	type: 'module' | 'permission';
	data: {
		id?: string;
		name: string;
		module?: string;
	};
}

export function PermissionsDeleteDialog({
	open,
	onOpenChange,
	type,
	data,
}: Props) {
	const [isLoading, setIsLoading] = useState(false);
	const { refetch } = usePermissions();

	const handleDelete = async () => {
		setIsLoading(true);
		try {
			let response;
			if (type === 'module') {
				response = await permissionsApi.deleteModule(data.module!);
			} else {
				response = await permissionsApi.deletePermission(data.id!);
			}

			if (!response.data.success) {
				toast.error(response.data.message || 'Có lỗi xảy ra khi xóa');
				return;
			}

			toast.success(response.data.message);
			await refetch();
			onOpenChange(false);
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Có lỗi xảy ra';
			toast.error(message);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<AlertDialog open={open} onOpenChange={onOpenChange}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>
						Bạn có chắc chắn muốn xóa{' '}
						{type === 'module' ? 'module' : 'permission'} này?
					</AlertDialogTitle>
					<AlertDialogDescription>
						{type === 'module'
							? 'Các permission trong module này sẽ không còn thuộc module nào.'
							: 'Hành động này không thể hoàn tác.'}
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel disabled={isLoading}>Hủy</AlertDialogCancel>
					<AlertDialogAction
						onClick={handleDelete}
						disabled={isLoading}
						className="bg-red-600 hover:bg-red-700"
					>
						Xóa
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
