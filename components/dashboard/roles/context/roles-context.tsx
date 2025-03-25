'use client';

import React, { useState, useCallback } from 'react';
import useDialogState from '@/hooks/use-dialog-state';
import { Role } from '../data/schema';
import { createContext, useContext } from 'react';
import { API_URL, ACCESS_TOKEN } from '@/api/http';
import { toast } from 'react-toastify';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

type RolesDialogType = 'add' | 'edit' | 'delete';

interface RolesContextType {
	roles: Role[];
	isLoading: boolean;
	error: string | null;
	refetch: () => void;
	createRole: (data: { name: string; description: string }) => Promise<void>;
	updateRole: (
		id: string,
		data: { name?: string; description?: string }
	) => Promise<void>;
	deleteRole: (id: string) => Promise<void>;
	open: RolesDialogType | null;
	setOpen: (type: RolesDialogType | null) => void;
	currentRow: Role | null;
	setCurrentRow: (role: Role | null) => void;
}

const RolesContext = createContext<RolesContextType | undefined>(undefined);

interface Props {
	children: React.ReactNode;
}

export default function RolesProvider({ children }: Props) {
	const queryClient = useQueryClient();
	const [open, setOpen] = useDialogState<RolesDialogType>(null);
	const [currentRow, setCurrentRow] = useState<Role | null>(null);

	// Fetch roles với React Query
	const {
		data: roles = [],
		isLoading,
		error,
		refetch,
	} = useQuery({
		queryKey: ['roles'],
		queryFn: async () => {
			const response = await fetch(`${API_URL}/roles`, {
				headers: {
					Authorization: `Bearer ${ACCESS_TOKEN}`,
				},
			});

			if (!response.ok) {
				throw new Error('Không thể tải danh sách vai trò');
			}

			const data = await response.json();
			return data.data.content;
		},
		staleTime: 5 * 60 * 1000, // Cache trong 5 phút
		gcTime: 30 * 60 * 1000, // Giữ cache 30 phút
	});

	// Mutation cho việc tạo role mới
	const createRoleMutation = useMutation({
		mutationFn: async (roleData: { name: string; description: string }) => {
			const response = await fetch(`${API_URL}/roles`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${ACCESS_TOKEN}`,
				},
				body: JSON.stringify(roleData),
			});

			if (!response.ok) {
				throw new Error('Không thể tạo vai trò');
			}

			return response.json();
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['roles'] });
			toast.success('Tạo vai trò thành công');
			setOpen(null);
		},
		onError: (error: Error) => {
			toast.error(error.message);
		},
	});

	// Mutation cho việc cập nhật role
	const updateRoleMutation = useMutation({
		mutationFn: async ({
			id,
			data,
		}: {
			id: string;
			data: { name?: string; description?: string };
		}) => {
			const response = await fetch(`${API_URL}/roles/${id}`, {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${ACCESS_TOKEN}`,
				},
				body: JSON.stringify(data),
			});

			if (!response.ok) {
				throw new Error('Không thể cập nhật vai trò');
			}

			return response.json();
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['roles'] });
			toast.success('Cập nhật vai trò thành công');
			setOpen(null);
			setCurrentRow(null);
		},
		onError: (error: Error) => {
			toast.error(error.message);
		},
	});

	// Mutation cho việc xóa role
	const deleteRoleMutation = useMutation({
		mutationFn: async (id: string) => {
			const response = await fetch(`${API_URL}/roles/${id}`, {
				method: 'DELETE',
				headers: {
					Authorization: `Bearer ${ACCESS_TOKEN}`,
				},
			});

			if (!response.ok) {
				throw new Error('Không thể xóa vai trò');
			}

			return response.json();
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['roles'] });
			toast.success('Xóa vai trò thành công');
			setOpen(null);
			setCurrentRow(null);
		},
		onError: (error: Error) => {
			toast.error(error.message);
		},
	});

	const createRole = useCallback(
		async (data: { name: string; description: string }) => {
			await createRoleMutation.mutateAsync(data);
		},
		[]
	);

	const updateRole = useCallback(
		async (id: string, data: { name?: string; description?: string }) => {
			await updateRoleMutation.mutateAsync({ id, data });
		},
		[]
	);

	const deleteRole = useCallback(async (id: string) => {
		await deleteRoleMutation.mutateAsync(id);
	}, []);

	return (
		<RolesContext.Provider
			value={{
				roles,
				isLoading,
				error: error as string | null,
				refetch,
				createRole,
				updateRole,
				deleteRole,
				open,
				setOpen,
				currentRow,
				setCurrentRow,
			}}
		>
			{children}
		</RolesContext.Provider>
	);
}

export function useRoles() {
	const context = useContext(RolesContext);
	if (context === undefined) {
		throw new Error('useRoles must be used within a RolesProvider');
	}
	return context;
}
