'use client';

import { Button } from '@/components/ui/button';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Main } from '@/components/dashboard/layout/MainDB';
import { Overview } from '@/components/dashboard/dashboard/components/overview';
import { RecentSales } from '@/components/dashboard/dashboard/components/recent-sales';
import { RoleGuard } from '@/components/auth/role-guard';
import { useLanguage } from '@/contexts/language-context';

export default function Dashboard() {
	const { t } = useLanguage();

	return (
		<RoleGuard allowedRoles={['ADMIN']}>
			{/* ===== Main ===== */}
			<Main>
				<div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
					<h1 className="text-2xl font-bold tracking-tight">{t('dashboard')}</h1>
					<div className="flex items-center space-x-2">
						<Button>{t('download')}</Button>
					</div>
				</div>
				<Tabs
					orientation="vertical"
					defaultValue="overview"
					className="space-y-4"
				>
					<div className="w-full overflow-x-auto pb-2">
						<TabsList className="w-full sm:w-auto">
							<TabsTrigger value="overview">{t('overview')}</TabsTrigger>
							<TabsTrigger value="analytics" disabled>
								{t('analytics')}
							</TabsTrigger>
							<TabsTrigger value="reports" disabled>
								{t('reports')}
							</TabsTrigger>
							<TabsTrigger value="notifications" disabled>
								{t('notifications')}
							</TabsTrigger>
						</TabsList>
					</div>
					<TabsContent value="overview" className="space-y-4">
						<div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
							<Card>
								<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
									<CardTitle className="text-sm font-medium">
										{t('totalRevenue')}
									</CardTitle>
									<svg
										xmlns="http://www.w3.org/2000/svg"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth="2"
										className="h-4 w-4 text-muted-foreground"
									>
										<path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
									</svg>
								</CardHeader>
								<CardContent>
									<div className="text-2xl font-bold">$45,231.89</div>
									<p className="text-xs text-muted-foreground">
										+20.1% {t('fromLastMonth')}
									</p>
								</CardContent>
							</Card>
							<Card>
								<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
									<CardTitle className="text-sm font-medium">
										{t('subscriptions')}
									</CardTitle>
									<svg
										xmlns="http://www.w3.org/2000/svg"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth="2"
										className="h-4 w-4 text-muted-foreground"
									>
										<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
										<circle cx="9" cy="7" r="4" />
										<path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
									</svg>
								</CardHeader>
								<CardContent>
									<div className="text-2xl font-bold">+2350</div>
									<p className="text-xs text-muted-foreground">
										+180.1% {t('fromLastMonth')}
									</p>
								</CardContent>
							</Card>
							<Card>
								<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
									<CardTitle className="text-sm font-medium">{t('sales')}</CardTitle>
									<svg
										xmlns="http://www.w3.org/2000/svg"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth="2"
										className="h-4 w-4 text-muted-foreground"
									>
										<rect width="20" height="14" x="2" y="5" rx="2" />
										<path d="M2 10h20" />
									</svg>
								</CardHeader>
								<CardContent>
									<div className="text-2xl font-bold">+12,234</div>
									<p className="text-xs text-muted-foreground">
										+19% {t('fromLastMonth')}
									</p>
								</CardContent>
							</Card>
							<Card>
								<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
									<CardTitle className="text-sm font-medium">
										{t('activeNow')}
									</CardTitle>
									<svg
										xmlns="http://www.w3.org/2000/svg"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth="2"
										className="h-4 w-4 text-muted-foreground"
									>
										<path d="M22 12h-4l-3 9L9 3l-3 9H2" />
									</svg>
								</CardHeader>
								<CardContent>
									<div className="text-2xl font-bold">+573</div>
									<p className="text-xs text-muted-foreground">
										+201 {t('sinceLastHour')}
									</p>
								</CardContent>
							</Card>
						</div>
						<div className="grid grid-cols-1 gap-4 lg:grid-cols-7">
							<Card className="col-span-1 lg:col-span-4">
								<CardHeader>
									<CardTitle>{t('overview')}</CardTitle>
								</CardHeader>
								<CardContent className="pl-2">
									<div className="h-[350px]">
										<Overview />
									</div>
								</CardContent>
							</Card>
							<Card className="col-span-1 lg:col-span-3">
								<CardHeader>
									<CardTitle>{t('recentSales')}</CardTitle>
									<CardDescription>
										{t('salesThisMonth')}
									</CardDescription>
								</CardHeader>
								<CardContent>
									<div className="h-[350px] overflow-y-auto">
										<RecentSales />
									</div>
								</CardContent>
							</Card>
						</div>
					</TabsContent>
				</Tabs>
			</Main>
		</RoleGuard>
	);
}
