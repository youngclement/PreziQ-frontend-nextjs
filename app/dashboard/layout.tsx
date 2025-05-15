'use client';

import { AppSidebar } from '@/components/dashboard/layout/SidebarDB';
import { Header } from '@/components/dashboard/layout/HeaderDB';
import { ThemeSwitch } from '@/components/dashboard/layout/ThemeSwitch';
import { ProfileDropdown } from '@/components/dashboard/ProfileDropdown';
import { Search } from '@/components/dashboard/Search';
import { SidebarProvider } from '@/components/ui/sidebar';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Loading from '@/components/common/loading';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { hasRole, isLoggedIn, user } = useAuth();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Only proceed if we know the user's login state for sure
    // For logged in users, wait until user data is available
    if (!isLoggedIn) {
      setIsLoading(false);
      router.push('/auth/login');
    }
    else if (isLoggedIn && user !== null) {
      const isAdmin = hasRole('ADMIN');

      setIsAuthorized(isAdmin);
      setIsLoading(false);

      // Only redirect if user is definitely not admin
      if (!isAdmin) {
        router.push('/forbidden');
      }
    }
    // If logged in but user data not loaded yet, keep loading state true
  }, [isLoggedIn, hasRole, router, user]);

  // Show loading state initially
  if (isLoading) {
    return (
      <Loading />
    );
  }

  // Show dashboard only if authorized
  if (isAuthorized) {
    return (
      <SidebarProvider>       
        <div className='flex min-h-[calc(100vh-4rem)] flex-col w-full mt-4'>
          <div className='flex flex-1'>
            <AppSidebar />
            <div className='flex flex-1 flex-col min-w-0'>
              <main className='flex-1 overflow-x-hidden p-6'>{children}</main>
            </div>
          </div>
        </div>
      </SidebarProvider>
    );
  }

  // This should never render as we redirect unauthorized users
  return (
    <div className="flex h-screen w-full items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
    </div>
  );
}
