import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { format, parse } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Role } from '../data/schema';
import { DataTableColumnHeader } from './data-table-column-header';
import { DataTableRowActions } from './data-table-row-actions';

export const columns: ColumnDef<Role>[] = [
	{
		id: 'select',
		header: ({ table }) => (
			<Checkbox
				checked={
					table.getIsAllPageRowsSelected() ||
					(table.getIsSomePageRowsSelected() && 'indeterminate')
				}
				onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
				aria-label="Select all"
			/>
		),
		cell: ({ row }) => (
			<Checkbox
				checked={row.getIsSelected()}
				onCheckedChange={(value) => row.toggleSelected(!!value)}
				aria-label="Select row"
			/>
		),
		enableSorting: false,
		enableHiding: false,
	},
	{
		accessorKey: 'name',
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Tên vai trò" />
		),
	},
	{
		accessorKey: 'description',
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Mô tả" />
		),
	},
	{
		accessorKey: 'permissions',
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Số quyền" />
		),
		cell: ({ row }) => {
			const permissions = row.getValue('permissions') as Array<any>;
			return <div>{permissions.length}</div>;
		},
	},
	{
		accessorKey: 'active',
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Trạng thái" />
		),
		cell: ({ row }) => {
			const active = row.getValue('active') as boolean;
			return (
				<Badge
					variant="outline"
					className={
						active ? 'bg-green-100 text-green-900' : 'bg-red-100 text-red-900'
					}
				>
					{active ? 'Hoạt động' : 'Không hoạt động'}
				</Badge>
			);
		},
		filterFn: (row, id, value) => {
			return value === String(row.getValue(id));
		},
	},
	{
		accessorKey: 'createdAt',
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Ngày tạo" />
		),
		cell: ({ row }) => {
			const dateStr = row.getValue('createdAt') as string;
			try {
				const date = parse(dateStr, 'yyyy-MM-dd HH:mm:ss a', new Date());

				return format(date, 'dd/MM/yyyy HH:mm', {
					locale: vi,
				});
			} catch (error) {
				return dateStr || 'Không có dữ liệu';
			}
		},
	},
	{
		accessorKey: 'createdBy',
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Người tạo" />
		),
	},
	{
		id: 'actions',
		cell: DataTableRowActions,
	},
];
