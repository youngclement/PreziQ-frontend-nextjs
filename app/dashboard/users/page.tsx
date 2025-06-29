'use client';

import { Main } from '@/components/dashboard/layout/MainDB';
import { UsersProvider } from '@/components/dashboard/users/context/users-context';
import { UsersTable } from '@/components/dashboard/users/components/users-table';
import { UsersDialogs } from '@/components/dashboard/users/components/users-dialogs';
import { UsersPrimaryButtons } from '@/components/dashboard/users/components/users-primary-buttons';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';
import { useUsers } from '@/components/dashboard/users/context/users-context';
import RolesProvider from '@/components/dashboard/roles/context/roles-context';
import Loading from '@/components/common/loading';
import { useLanguage } from '@/contexts/language-context';

function UsersContent() {
  const { users, isLoading, error } = useUsers();
  const { t } = useLanguage();

  console.log('UsersContent - Dữ liệu từ context:', users);

  if (isLoading) {
    return <Loading />;
  }

  if (error) {
    console.error('UsersContent - Error:', error);
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
            {t('userManagement.title')}
          </h2>
          <p className="text-muted-foreground">
            {t('userManagement.description')}
          </p>
        </div>
        <UsersPrimaryButtons />
      </div>
      <div className="-mx-4 flex-1 overflow-auto px-4 py-1">
        <UsersTable data={users} />
      </div>
      <UsersDialogs />
    </>
  );
}

export default function UsersPage() {
  return (
    <UsersProvider>
      <RolesProvider>
        <Main>
          <UsersContent />
        </Main>
      </RolesProvider>
    </UsersProvider>
  );
}
