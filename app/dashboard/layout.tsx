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
			<div className="flex min-h-screen flex-col w-full">
				<div className="flex flex-1">
					<AppSidebar />
					<div className="flex flex-1 flex-col">
						<Header fixed>
							<Search />
							<div className="ml-auto flex items-center gap-2">
								<ThemeSwitch />
								<ProfileDropdown />
							</div>
						</Header>
						{children}
					</div>
				</div>
			</div>
		</SidebarProvider>
	);
}
