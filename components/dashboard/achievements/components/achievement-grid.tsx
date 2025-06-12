'use client';

import { useState, useMemo } from 'react';
import {
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import type { Achievement } from '../data/schema';
import { AchievementCard } from './achievement-card';
import { DataTablePagination } from '../../users/components/data-table-pagination';
import { AchievementToolbar } from './achievement-toolbar';
import { useLanguage } from '@/contexts/language-context';

export function AchievementGrid({ data }: { data: Achievement[] }) {
  const { t } = useLanguage();
  const [rowSelection, setRowSelection] = useState({});
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [sorting, setSorting] = useState<SortingState>([]);

  // Kiểm tra và lọc dữ liệu không hợp lệ trước khi hiển thị
  const validData = useMemo(() => {
    return Array.isArray(data)
      ? data?.filter(
          (achievement) =>
            achievement &&
            typeof achievement === 'object' &&
            achievement.achievementId
        )
      : [];
  }, [data]);

  const table = useReactTable({
    data: validData,
    columns: [
      {
        id: 'select',
        header: t('achievementSelect'),
        enableSorting: false,
        enableHiding: false,
      },
      {
        accessorKey: 'name',
        header: t('achievementName'),
        enableSorting: true,
        enableHiding: true,
      },
      {
        accessorKey: 'description',
        header: t('achievementDescription'),
        enableSorting: true,
        enableHiding: true,
      },
      {
        accessorKey: 'requiredPoints',
        header: t('achievementRequiredPoints'),
        enableSorting: true,
        enableHiding: true,
      },
      {
        accessorKey: 'createdAt',
        header: t('achievementCreatedAt'),
        enableSorting: true,
        enableHiding: true,
      },
    ],
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
      <AchievementToolbar table={table} />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {table?.getRowModel().rows?.length ? (
          table
            .getRowModel()
            .rows?.map((row) => (
              <AchievementCard
                key={row.id}
                achievement={row.original}
                isSelected={row.getIsSelected()}
                onSelect={(selected) => row.toggleSelected(!!selected)}
              />
            ))
        ) : (
          <div className="col-span-full h-24 flex items-center justify-center text-slate-500 bg-slate-50 rounded-md border border-slate-200">
            {t('achievementNoResults')}
          </div>
        )}
      </div>
      <DataTablePagination table={table} />
    </div>
  );
}
