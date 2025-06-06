import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
	DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { User as UserIcon, LogOut, FolderOpen, UserCircle, Settings, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useRoles } from '@/hooks/use-roles';
import { authApi } from '@/api-client/auth-api';

export default function UserMenu() {
	const router = useRouter();
	const { isLoggedIn, logout, user } = useAuth();
	const { isAdmin } = useRoles();
	const [loading, setLoading] = useState(false);

	const handleLogout = async () => {
		setLoading(true);

		try {
			await authApi.logout();
			logout();
			router.push('/auth/login');
		} catch (error) {
			console.error('Logout failed', error);
		} finally {
			setLoading(false);
		}
	};

	if (!isLoggedIn || !user) return null;

	// Get the main role for display
	const mainRole = user.rolesSecured && user.rolesSecured.length > 0
		? user.rolesSecured[0]
		: null;

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<button className="relative h-9 w-9 rounded-full overflow-hidden ring-2 ring-white dark:ring-gray-800 hover:ring-primary/50 transition-all duration-200 cursor-pointer">
					<div className="h-full w-full bg-primary/10 flex items-center justify-center">
						<UserIcon className="h-5 w-5 text-primary" />
					</div>
				</button>
			</DropdownMenuTrigger>
			<DropdownMenuContent
				align="end"
				className="w-56 p-2 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg"
			>
				<div className="px-2 py-1.5 mb-1">
					<div className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-2">
						{user.firstName} {user.lastName}
						{mainRole && (
							<Badge variant="outline" className="ml-1 text-xs px-1.5 py-0 h-5 flex items-center">
								<ShieldCheck className="h-3 w-3 mr-1" />
								{mainRole.name}
							</Badge>
						)}
					</div>
					<div className="text-xs text-gray-500 dark:text-gray-400 truncate">
						{user.email}
					</div>
				</div>
				<DropdownMenuSeparator className="my-1" />
				{isAdmin && (
					<DropdownMenuItem
						onClick={() => router.push('/dashboard')}
						className="flex items-center px-2 py-2 text-sm cursor-pointer rounded-md hover:bg-primary/5 focus:bg-primary/5 transition-colors duration-200"
					>
						<ShieldCheck className="h-4 w-4 mr-2 text-gray-500 dark:text-gray-400" />
						<span className="text-gray-700 dark:text-gray-200">Admin Dashboard</span>
					</DropdownMenuItem>
				)}
				<DropdownMenuItem
					onClick={() => router.push('/profile')}
					className="flex items-center px-2 py-2 text-sm cursor-pointer rounded-md hover:bg-primary/5 focus:bg-primary/5 transition-colors duration-200"
				>
					<UserCircle className="h-4 w-4 mr-2 text-gray-500 dark:text-gray-400" />
					<span className="text-gray-700 dark:text-gray-200">My profile</span>
				</DropdownMenuItem>
				<DropdownMenuItem
					onClick={() => router.push('/my-collections')}
					className="flex items-center px-2 py-2 text-sm cursor-pointer rounded-md hover:bg-primary/5 focus:bg-primary/5 transition-colors duration-200"
				>
					<FolderOpen className="h-4 w-4 mr-2 text-gray-500 dark:text-gray-400" />
					<span className="text-gray-700 dark:text-gray-200">
						My Collections
					</span>
				</DropdownMenuItem>
				<DropdownMenuItem
					onClick={() => router.push('/settings')}
					className="flex items-center px-2 py-2 text-sm cursor-pointer rounded-md hover:bg-primary/5 focus:bg-primary/5 transition-colors duration-200"
				>
					<Settings className="h-4 w-4 mr-2 text-gray-500 dark:text-gray-400" />
					<span className="text-gray-700 dark:text-gray-200">Setting</span>
				</DropdownMenuItem>
				<DropdownMenuSeparator className="my-1" />
				<DropdownMenuItem
					onClick={handleLogout}
					disabled={loading}
					className="flex items-center px-2 py-2 text-sm cursor-pointer rounded-md hover:bg-red-50 dark:hover:bg-red-950/50 focus:bg-red-50 dark:focus:bg-red-950/50 transition-colors duration-200 text-red-600 dark:text-red-400"
				>
					<LogOut className="h-4 w-4 mr-2" />
					{loading ? 'Logging out...' : 'Logout'}
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
