'use client';

import { Main } from '@/components/dashboard/layout/MainDB';
import { PermissionsProvider } from '@/components/dashboard/permissions/context/permissions-context';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';
import { usePermissions } from '@/components/dashboard/permissions/context/permissions-context';
import { PermissionsTable } from '@/components/dashboard/permissions/components/permissions-table';
import { PermissionsDialogs } from '@/components/dashboard/permissions/components/permissions-dialogs';
import Loading from '@/components/common/loading';
import { useLanguage } from '@/contexts/language-context';

function PermissionsContent() {
  const { permissions, isLoading, error } = usePermissions();
  const { t } = useLanguage();

  if (isLoading) {
    return <Loading />;
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <>
      <div className="mb-2 flex items-center justify-between space-y-2 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            {t('permissionsManagement')}
          </h2>
          <p className="text-muted-foreground">
            {t('permissionsManagementDesc')}
          </p>
        </div>
      </div>
      <div className="-mx-4 flex-1 overflow-auto px-4 py-1">
        <PermissionsTable />
      </div>
    </>
  );
}

export default function PermissionsPage() {
  return (
    <PermissionsProvider>
      <Main>
        <PermissionsContent />
        <PermissionsDialogs />
      </Main>
    </PermissionsProvider>
  );
}
