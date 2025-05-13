'use client';

import { Cross2Icon } from '@radix-ui/react-icons';
import type { Table } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DataTableViewOptions } from '../../users/components/data-table-view-options';
import { DataTableFacetedFilter } from '../../users/components/data-table-faceted-filter';
import { Search, X } from 'lucide-react';

interface AchievementToolbarProps<TData> {
  table: Table<TData>;
}

export function AchievementToolbar<TData>({
  table,
}: AchievementToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0;

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-1 items-center space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm thành tựu..."
            value={(table.getColumn('name')?.getFilterValue() as string) ?? ''}
            onChange={(event) =>
              table.getColumn('name')?.setFilterValue(event.target.value)
            }
            className="w-full pl-8 bg-white"
          />
          {(table.getColumn('name')?.getFilterValue() as string) && (
            <Button
              variant="ghost"
              onClick={() => table.getColumn('name')?.setFilterValue('')}
              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Xóa tìm kiếm</span>
            </Button>
          )}
        </div>
        <div className="flex items-center gap-2">
          {table.getColumn('requiredPoints') && (
            <DataTableFacetedFilter
              column={table.getColumn('requiredPoints')}
              title="Điểm yêu cầu"
              options={[
                { label: '< 100 điểm', value: 'lt100' },
                { label: '100 - 500 điểm', value: '100-500' },
                { label: '500 - 1000 điểm', value: '500-1000' },
                { label: '> 1000 điểm', value: 'gt1000' },
              ]}
            />
          )}
          <DataTableViewOptions table={table} />
          {isFiltered && (
            <Button
              variant="ghost"
              onClick={() => table.resetColumnFilters()}
              className="h-8 px-2 lg:px-3"
            >
              Xóa bộ lọc
              <Cross2Icon className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
