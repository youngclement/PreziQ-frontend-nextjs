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

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { hasRole, isLoggedIn } = useAuth();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in and has admin role
    if (isLoggedIn) {
      const isAdmin = hasRole('ADMIN');
      setIsAuthorized(isAdmin);
      setIsLoading(false);

      // If not admin, redirect to forbidden page
      if (!isAdmin) {
        router.push('/forbidden');
      }
    } else {
      // If not logged in yet, let the auth provider handle it first
      setIsLoading(true);
      // Add a timeout to avoid infinite loading if auth doesn't complete
      const timer = setTimeout(() => {
        setIsLoading(false);
        if (!isLoggedIn) {
          router.push('/auth/login');
        } else if (!hasRole('ADMIN')) {
          router.push('/forbidden');
        }
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [isLoggedIn, hasRole, router]);

  // Show loading state initially
  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  // Show dashboard only if authorized
  if (isAuthorized) {
    return (
      <SidebarProvider>
        <div className='flex min-h-[calc(100vh-4rem)] flex-col w-full mt-[4rem]'>
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
  return null;
}
