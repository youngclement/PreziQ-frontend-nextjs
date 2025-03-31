'use client';

import { useState, useMemo } from 'react';
import {
	ColumnDef,
	ColumnFiltersState,
	RowData,
	SortingState,
	VisibilityState,
	flexRender,
	getCoreRowModel,
	getFacetedRowModel,
	getFacetedUniqueValues,
	getFilteredRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	useReactTable,
} from '@tanstack/react-table';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table';
import { User } from '../data/schema';
import { DataTablePagination } from './data-table-pagination';
import { DataTableToolbar } from './data-table-toolbar';
import { DataTableViewOptions } from './data-table-view-options';
import { useUsers } from '../context/users-context';
import { columns } from './users-columns';
import { cn } from '@/lib/utils';

declare module '@tanstack/react-table' {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	interface ColumnMeta<TData extends RowData, TValue> {
		className: string;
	}
}

export function UsersTable({ data }: { data: User[] }) {
	const [rowSelection, setRowSelection] = useState({});
	const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
	const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
	const [sorting, setSorting] = useState<SortingState>([]);

	// Kiểm tra và lọc dữ liệu không hợp lệ trước khi hiển thị
	const validData = useMemo(() => {
		return Array.isArray(data)
			? data.filter((user) => user && typeof user === 'object' && user.id)
			: [];
	}, [data]);

	const table = useReactTable({
		data: validData,
		columns: columns as ColumnDef<User, any>[],
		state: {
			sorting,
			columnVisibility,
			rowSelection,
			columnFilters,
		},
		enableRowSelection: true,
		onRowSelectionChange: setRowSelection,
		onSortingChange: setSorting,
		onColumnFiltersChange: setColumnFilters,
		onColumnVisibilityChange: setColumnVisibility,
		getCoreRowModel: getCoreRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getFacetedRowModel: getFacetedRowModel(),
		getFacetedUniqueValues: getFacetedUniqueValues(),
	});

	return (
		<div className="space-y-4">
			<DataTableToolbar table={table} />
			<div className="rounded-md border border-slate-300 shadow-sm overflow-hidden">
				{(() => {
					try {
						return (
							<Table>
								<TableHeader className="bg-slate-50">
									{table.getHeaderGroups().map((headerGroup) => (
										<TableRow
											key={headerGroup.id}
											className="border-b border-slate-300"
										>
											{headerGroup.headers.map((header) => (
												<TableHead
													key={header.id}
													colSpan={header.colSpan}
													className="font-semibold text-slate-700 truncate"
												>
													{header.isPlaceholder
														? null
														: flexRender(
																header.column.columnDef.header,
																header.getContext()
														  )}
												</TableHead>
											))}
										</TableRow>
									))}
								</TableHeader>
								<TableBody className="overflow-hidden">
									{table.getRowModel().rows?.length ? (
										table.getRowModel().rows.map((row) => (
											<TableRow
												key={row.id}
												data-state={row.getIsSelected() && 'selected'}
												className="border-b border-slate-200 hover:bg-slate-50 transition-colors cursor-default"
											>
												{row.getVisibleCells().map((cell) => (
													<TableCell
														key={cell.id}
														className={cn(
															cell.column.id === 'avatar' && 'text-center',
															'py-3 break-words',
															cell.column.id === 'email' &&
																'max-w-[200px] truncate',
															cell.column.id === 'firstName' &&
																'max-w-[150px] truncate',
															cell.column.id === 'lastName' &&
																'max-w-[150px] truncate',
															cell.column.id === 'roles' && 'max-w-[200px]',
															cell.column.id === 'createdAt' &&
																'max-w-[180px] truncate',
															cell.column.id === 'isVerified' &&
																'max-w-[130px] truncate'
														)}
													>
														{flexRender(
															cell.column.columnDef.cell,
															cell.getContext()
														)}
													</TableCell>
												))}
											</TableRow>
										))
									) : (
										<TableRow>
											<TableCell
												colSpan={columns.length}
												className="h-24 text-center text-slate-500"
											>
												Không tìm thấy kết quả
											</TableCell>
										</TableRow>
									)}
								</TableBody>
							</Table>
						);
					} catch (error) {
						console.error('Lỗi khi hiển thị bảng:', error);
						return (
							<div className="p-8 text-center text-red-500">
								<p>Đã xảy ra lỗi khi hiển thị dữ liệu.</p>
								<p className="mt-2 text-sm text-slate-500">
									Vui lòng thử làm mới trang.
								</p>
							</div>
						);
					}
				})()}
			</div>
			<DataTablePagination table={table} />
		</div>
	);
}
