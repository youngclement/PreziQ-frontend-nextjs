'use client';

import { AppSidebar } from '@/components/dashboard/layout/SidebarDB';
import { Header } from '@/components/dashboard/layout/HeaderDB';
import { ThemeSwitch } from '@/components/dashboard/layout/ThemeSwitch';
import { ProfileDropdown } from '@/components/dashboard/ProfileDropdown';
import { Search } from '@/components/dashboard/Search';
import { SidebarProvider } from '@/components/ui/sidebar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
