'use client';

import { Cross2Icon } from '@radix-ui/react-icons';
import { Table } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DataTableFacetedFilter } from './data-table-faceted-filter';
import { DataTableViewOptions } from './data-table-view-options';
import { useLanguage } from '@/contexts/language-context';

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
}

export function DataTableToolbar<TData>({
  table,
}: DataTableToolbarProps<TData>) {
  const { t } = useLanguage();
  const isFiltered = table.getState().columnFilters.length > 0;

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-1 flex-col-reverse items-start gap-y-2 sm:flex-row sm:items-center sm:space-x-2 overflow-hidden">
        <Input
          placeholder={t('searchByEmail')}
          value={(table.getColumn('email')?.getFilterValue() as string) ?? ''}
          onChange={(event) =>
            table.getColumn('email')?.setFilterValue(event.target.value)
          }
          className="h-8 w-[150px] lg:w-[250px] truncate"
        />
        <div className="flex gap-x-2 flex-wrap">
          {table.getColumn('isVerified') && (
            <DataTableFacetedFilter
              column={table.getColumn('isVerified')}
              title={t('verificationStatus')}
              options={[
                { label: t('verified'), value: 'true' },
                { label: t('unverified'), value: 'false' },
              ]}
            />
          )}
          {table.getColumn('roles') && (
            <DataTableFacetedFilter
              column={table.getColumn('roles')}
              title={t('role')}
              options={[
                { label: 'ADMIN', value: 'ADMIN' },
                { label: 'USER', value: 'USER' },
              ]}
            />
          )}
        </div>
        {isFiltered && (
          <Button
            variant="ghost"
            onClick={() => table.resetColumnFilters()}
            className="h-8 px-2 lg:px-3 truncate"
          >
            {t('reset')}
            <Cross2Icon className="ml-2 h-4 w-4 flex-shrink-0" />
          </Button>
        )}
      </div>
      <DataTableViewOptions table={table} />
    </div>
  );
}
