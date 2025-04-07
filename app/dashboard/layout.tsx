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
			<div className="flex min-h-screen flex-col w-screen pt-24">
				<div className="flex flex-1">
					<AppSidebar />
					<div className="flex flex-1 flex-col min-w-0">
						<Header fixed>
							<div className="flex items-center gap-2 w-full">
								<div className="flex-1 max-w-[300px]">
									<Search />
								</div>
								<div className="flex items-center gap-2 ml-auto">
									<ThemeSwitch />
									<ProfileDropdown />
								</div>
							</div>
						</Header>
						<main className="flex-1 overflow-x-hidden">{children}</main>
					</div>
				</div>
			</div>
		</SidebarProvider>
	);
}
