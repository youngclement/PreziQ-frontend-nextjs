import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
	DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { User, LogOut, FolderOpen, UserCircle, Settings } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { authApi } from '@/api-client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface UserInfo {
	firstName: string;
	lastName: string;
	email: string;
	avatar?: string;
}

export default function UserMenu() {
	const router = useRouter();
	const { isLoggedIn, logout } = useAuth();
	const [loading, setLoading] = useState(false);
	const [userInfo, setUserInfo] = useState<UserInfo | null>(null);

	const handleLogout = async () => {
		setLoading(true);

		try {
			await authApi.logout();
			logout();
			localStorage.removeItem('accessToken');

			router.push('/auth/login');
		} catch (error) {
			console.error('Logout failed', error);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		const fetchAccount = async () => {
			const res = await authApi.getAccount();
			console.log('user: ', res.data.data.lastName);
			setUserInfo(res?.data?.data);
		};


		if (isLoggedIn) {
			fetchAccount();
		}
	}, [isLoggedIn]);

	if (!isLoggedIn) return null;

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<button className="relative h-9 w-9 rounded-full overflow-hidden ring-2 ring-white dark:ring-gray-800 hover:ring-primary/50 transition-all duration-200 cursor-pointer">
					{userInfo?.avatar ? (
						<Avatar className="h-full w-full">
							<AvatarImage src={userInfo.avatar} alt="Avatar" />
							<AvatarFallback className="bg-primary/10 text-primary">
								{userInfo.firstName?.[0]?.toUpperCase()}
								{userInfo.lastName?.[0]?.toUpperCase()}
							</AvatarFallback>
						</Avatar>
					) : (
						<div className="h-full w-full bg-primary/10 flex items-center justify-center">
							<User className="h-5 w-5 text-primary" />
						</div>
					)}
				</button>
			</DropdownMenuTrigger>
			<DropdownMenuContent
				align="end"
				className="w-56 p-2 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg"
			>
				<div className="px-2 py-1.5 mb-1">
					<div className="text-sm font-medium text-gray-900 dark:text-white">
						{userInfo?.firstName} {userInfo?.lastName}
					</div>
					<div className="text-xs text-gray-500 dark:text-gray-400 truncate">
						{userInfo?.email}
					</div>
				</div>
				<DropdownMenuSeparator className="my-1" />
				<DropdownMenuItem
					onClick={() => router.push('/profile')}
					className="flex items-center px-2 py-2 text-sm cursor-pointer rounded-md hover:bg-primary/5 focus:bg-primary/5 transition-colors duration-200"
				>
					<UserCircle className="h-4 w-4 mr-2 text-gray-500 dark:text-gray-400" />
					<span className="text-gray-700 dark:text-gray-200">My profile</span>
				</DropdownMenuItem>
				<DropdownMenuItem
					onClick={() => router.push('/collections')}
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
