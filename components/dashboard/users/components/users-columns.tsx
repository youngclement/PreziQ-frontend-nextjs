'use client';

import { ColumnDef } from '@tanstack/react-table';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { DataTableColumnHeader } from './data-table-column-header';
import { DataTableRowActions } from './data-table-row-actions';
import LongText from '@/components/dashboard/long-text';
import { User } from '../data/schema';
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from '@/components/ui/tooltip';

export const columns: ColumnDef<User>[] = [
	{
		id: 'select',
		header: ({ table }) => (
			<Checkbox
				checked={table.getIsAllPageRowsSelected()}
				onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
				aria-label="Select all"
				className="translate-y-[2px]"
			/>
		),
		cell: ({ row }) => (
			<Checkbox
				checked={row.getIsSelected()}
				onCheckedChange={(value) => row.toggleSelected(!!value)}
				aria-label="Select row"
				className="translate-y-[2px]"
			/>
		),
		enableSorting: false,
		enableHiding: false,
	},
	{
		accessorKey: 'email',
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Email" />
		),
		cell: ({ row }) => (
			<LongText maxLength={25}>{row.getValue('email')}</LongText>
		),
	},
	{
		accessorKey: 'firstName',
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Họ" />
		),
		cell: ({ row }) => (
			<LongText maxLength={20}>{row.getValue('firstName')}</LongText>
		),
	},
	{
		accessorKey: 'lastName',
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Tên" />
		),
		cell: ({ row }) => (
			<LongText maxLength={20}>{row.getValue('lastName')}</LongText>
		),
	},
	{
		accessorKey: 'isVerified',
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Xác thực" />
		),
		cell: ({ row }) => {
			const isVerified = row.getValue('isVerified') as boolean;
			return (
				<Badge variant={isVerified ? 'default' : 'secondary'}>
					{isVerified ? 'Đã xác thực' : 'Chưa xác thực'}
				</Badge>
			);
		},
	},
	{
		accessorKey: 'roles',
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Vai trò" />
		),
		cell: ({ row }) => {
			const roles = row.getValue('roles') as User['roles'];

			if (!roles || roles.length === 0) {
				return <span className="text-muted-foreground italic">Không có</span>;
			}

			// Hiển thị tối đa 2 vai trò, nếu nhiều hơn thì hiển thị "+n"
			const maxVisibleRoles = 2;
			const visibleRoles = roles.slice(0, maxVisibleRoles);
			const remainingCount = roles.length - maxVisibleRoles;

			return (
				<div className="flex flex-wrap gap-1 max-w-[180px]">
					{visibleRoles.map((role) => (
						<Badge key={role.id} variant="outline">
							{role.name}
						</Badge>
					))}
					{remainingCount > 0 && (
						<TooltipProvider>
							<Tooltip>
								<TooltipTrigger asChild>
									<Badge variant="secondary" className="cursor-help">
										+{remainingCount}
									</Badge>
								</TooltipTrigger>
								<TooltipContent side="top">
									<div className="flex flex-col gap-1">
										{roles.slice(maxVisibleRoles).map((role) => (
											<span key={role.id}>{role.name}</span>
										))}
									</div>
								</TooltipContent>
							</Tooltip>
						</TooltipProvider>
					)}
				</div>
			);
		},
	},
	{
		accessorKey: 'createdAt',
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Ngày tạo" />
		),
		cell: ({ row }) => {
			const dateString = row.getValue('createdAt') as string;
			const [datePart, timePart] = dateString.split(' ');
			const [time, period] = timePart.split(' ');
			const [hours, minutes] = time.split(':');
			const hour = parseInt(hours);
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

			const date = new Date(isoString);
			return date
				.toLocaleString('vi-VN', {
					hour: '2-digit',
					minute: '2-digit',
					day: 'numeric',
					month: 'long',
					year: 'numeric',
					hour12: false,
					timeZone: 'Asia/Ho_Chi_Minh',
				})
				.replace('lúc ', '');
		},
	},
	{
		id: 'actions',
		cell: ({ row }) => <DataTableRowActions row={row} />,
	},
];
