'use client';

import React, { useState, useCallback } from 'react';
import useDialogState from '@/hooks/use-dialog-state';
import { User } from '../data/schema';
import { createContext, useContext } from 'react';
import { API_URL, ACCESS_TOKEN } from '@/api/http';
import { toast } from 'react-toastify';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

type UsersDialogType = 'invite' | 'add' | 'edit' | 'delete';

interface UsersContextType {
	users: User[];
	isLoading: boolean;
	error: string | null;
	refetch: () => void;
	createUser: (data: any) => Promise<void>;
	updateUser: (id: string, data: any) => Promise<void>;
	deleteUser: (id: string) => Promise<void>;
	open: UsersDialogType | null;
	setOpen: (type: UsersDialogType | null) => void;
	currentRow: User | null;
	setCurrentRow: (user: User | null) => void;
}

const UsersContext = createContext<UsersContextType | undefined>(undefined);

interface Props {
	children: React.ReactNode;
}

const UsersProvider = ({ children }: Props) => {
	const queryClient = useQueryClient();
	const [open, setOpen] = useDialogState<UsersDialogType>(null);
	const [currentRow, setCurrentRow] = useState<User | null>(null);

	// Fetch users với React Query
	const {
		data: users = [],
		isLoading,
		error,
		refetch,
	} = useQuery({
		queryKey: ['users'],
		queryFn: async () => {
			const response = await fetch(`${API_URL}/users`, {
				headers: {
					Authorization: `Bearer ${ACCESS_TOKEN}`,
				},
			});

			if (!response.ok) {
				throw new Error('Không thể tải danh sách người dùng');
			}

			const data = await response.json();
			return data.data.content;
		},
		staleTime: 5 * 60 * 1000, // Cache trong 5 phút
		gcTime: 30 * 60 * 1000, // Giữ cache 30 phút
	});

	// Mutation cho việc tạo user mới
	const createUserMutation = useMutation({
		mutationFn: async (userData: any) => {
			const response = await fetch(`${API_URL}/users`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${ACCESS_TOKEN}`,
				},
				body: JSON.stringify(userData),
			});

			if (!response.ok) {
				throw new Error('Không thể tạo người dùng');
			}

			return response.json();
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['users'] });
			toast.success('Tạo người dùng thành công');
			setOpen(null);
		},
		onError: (error: Error) => {
			toast.error(error.message);
		},
	});

	// Mutation cho việc cập nhật user
	const updateUserMutation = useMutation({
		mutationFn: async ({ id, data }: { id: string; data: any }) => {
			const response = await fetch(`${API_URL}/users/${id}`, {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${ACCESS_TOKEN}`,
				},
				body: JSON.stringify(data),
			});

			if (!response.ok) {
				throw new Error('Không thể cập nhật người dùng');
			}

			return response.json();
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['users'] });
			toast.success('Cập nhật thông tin người dùng thành công');
			setOpen(null);
			setCurrentRow(null);
		},
		onError: (error: Error) => {
			toast.error(error.message);
		},
	});

	// Mutation cho việc xóa user
	const deleteUserMutation = useMutation({
		mutationFn: async (id: string) => {
			const response = await fetch(`${API_URL}/users/${id}`, {
				method: 'DELETE',
				headers: {
					Authorization: `Bearer ${ACCESS_TOKEN}`,
				},
			});

			if (!response.ok) {
				throw new Error('Không thể xóa người dùng');
			}

			return response.json();
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['users'] });
			toast.success('Xóa người dùng thành công');
			setOpen(null);
			setCurrentRow(null);
		},
		onError: (error: Error) => {
			toast.error(error.message);
		},
	});

	const createUser = useCallback(async (data: any) => {
		await createUserMutation.mutateAsync(data);
	}, []);

	const updateUser = useCallback(async (id: string, data: any) => {
		await updateUserMutation.mutateAsync({ id, data });
	}, []);

	const deleteUser = useCallback(async (id: string) => {
		await deleteUserMutation.mutateAsync(id);
	}, []);

	return (
		<UsersContext.Provider
			value={{
				users,
				isLoading,
				error: error as string | null,
				refetch,
				createUser,
				updateUser,
				deleteUser,
				open,
				setOpen,
				currentRow,
				setCurrentRow,
			}}
		>
			{children}
		</UsersContext.Provider>
	);
};

export { UsersProvider };

export function useUsers() {
	const context = useContext(UsersContext);
	if (context === undefined) {
		throw new Error('useUsers must be used within a UsersProvider');
	}
	return context;
}
