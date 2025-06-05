'use client';

import { Cross2Icon } from '@radix-ui/react-icons';
import type { Table } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DataTableViewOptions } from '../../users/components/data-table-view-options';
import { DataTableFacetedFilter } from '../../users/components/data-table-faceted-filter';
import { Search, X } from 'lucide-react';
import { useLanguage } from '@/contexts/language-context';

interface AchievementToolbarProps<TData> {
  table: Table<TData>;
}

export function AchievementToolbar<TData>({
  table,
}: AchievementToolbarProps<TData>) {
  const { t } = useLanguage();
  const isFiltered = table.getState().columnFilters.length > 0;

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-1 items-center space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('achievementSearchPlaceholder')}
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
              <span className="sr-only">{t('achievementClearSearch')}</span>
            </Button>
          )}
        </div>
        <div className="flex items-center gap-2">
          {table.getColumn('requiredPoints') && (
            <DataTableFacetedFilter
              column={table.getColumn('requiredPoints')}
              title={t('achievementRequiredPoints')}
              options={[
                { label: t('achievementPointsLt100'), value: 'lt100' },
                { label: t('achievementPoints100_500'), value: '100-500' },
                { label: t('achievementPoints500_1000'), value: '500-1000' },
                { label: t('achievementPointsGt1000'), value: 'gt1000' },
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
              {t('achievementClearFilter')}
              <Cross2Icon className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
