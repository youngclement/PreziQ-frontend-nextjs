'use client';

import { useEffect, useState } from 'react';
import { Main } from '@/components/dashboard/layout/MainDB';
import { columns } from '@/components/dashboard/users/components/users-columns';
import { UsersDialogs } from '@/components/dashboard/users/components/users-dialogs';
import { UsersPrimaryButtons } from '@/components/dashboard/users/components/users-primary-buttons';
import { UsersTable } from '@/components/dashboard/users/components/users-table';
import UsersProvider from '@/components/dashboard/users/context/users-context';
import { User } from '@/components/dashboard/users/data/schema';
import { API_URL, ACCESS_TOKEN } from '@/api/http';

interface ApiResponse {
	code: number;
	statusCode: number;
	message: string;
	data: {
		meta: {
			currentPage: number;
			pageSize: number;
			totalPages: number;
			totalElements: number;
			hasNext: boolean;
		};
		content: User[];
	};
	timestamp: string;
}

export default function UsersPage() {
	const [users, setUsers] = useState<User[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const fetchUsers = async () => {
		try {
			const response = await fetch(`${API_URL}/users`, {
				headers: {
					Authorization: `Bearer ${ACCESS_TOKEN}`,
				},
			});

			if (!response.ok) {
				throw new Error('Không thể tải danh sách người dùng');
			}

			const data: ApiResponse = await response.json();
			console.log('API Response:', data);
			console.log('Users content:', data.data.content);

			// Lấy mảng users từ data.content
			setUsers(data.data.content);
		} catch (err) {
			console.error('Error fetching users:', err);
			setError(err instanceof Error ? err.message : 'Đã xảy ra lỗi');
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchUsers();
	}, []);

	console.log('Current users state:', users);
	console.log('First user data:', users[0]);

	if (loading) {
		return (
			<Main>
				<div className="flex items-center justify-center h-full">
					<div className="text-lg">Đang tải...</div>
				</div>
			</Main>
		);
	}

	if (error) {
		return (
			<Main>
				<div className="flex items-center justify-center h-full">
					<div className="text-lg text-red-500">Lỗi: {error}</div>
				</div>
			</Main>
		);
	}

	return (
		<UsersProvider>
			<Main>
				<div className="mb-2 flex items-center justify-between space-y-2 flex-wrap">
					<div>
						<h2 className="text-2xl font-bold tracking-tight">
							Danh sách người dùng
						</h2>
						<p className="text-muted-foreground">
							Quản lý người dùng và vai trò của họ tại đây.
						</p>
					</div>
					<UsersPrimaryButtons />
				</div>
				<div className="-mx-4 flex-1 overflow-auto px-4 py-1 lg:flex-row lg:space-x-12 lg:space-y-0">
					<UsersTable data={users} columns={columns} />
				</div>
			</Main>
			<UsersDialogs refetch={fetchUsers} />
		</UsersProvider>
	);
}
