import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { User, LogOut, FolderOpen } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { authApi } from '@/api-client';

export default function UserMenu() {
	const router = useRouter();
	const { isLoggedIn, logout } = useAuth();
	const [loading, setLoading] = useState(false);
	const [userInfo, setUserInfo] = useState(null);

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
				<button className="h-9 w-9 rounded-full bg-gray-300 flex items-center justify-center cursor-pointer">
					<User className="h-5 w-5 text-gray-600" />
				</button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end">
				<DropdownMenuItem onClick={() => router.push('/collections')}>
					<FolderOpen className="h-4 w-4 mr-2" />
					My Collection
				</DropdownMenuItem>
				<DropdownMenuItem onClick={handleLogout} disabled={loading}>
					<LogOut className="h-4 w-4 mr-2" />
					{loading ? 'Logging out...' : 'Logout'}
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
