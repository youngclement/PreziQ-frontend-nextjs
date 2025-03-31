'use client';

import React, { useState, useCallback, useEffect } from 'react';
import useDialogState from '@/hooks/use-dialog-state';
import { Role } from '../data/schema';
import { createContext, useContext } from 'react';
import { toast } from 'react-toastify';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rolesApi } from '@/api-client';

type RolesDialogType = 'add' | 'edit' | 'delete';

interface RolesContextType {
	roles: Role[];
	isLoading: boolean;
	error: string | null;
	refetch: () => void;
	meta: {
		totalPages: number;
		currentPage: number;
		totalElements: number;
	};
	fetchRoles: (page: number) => void;
	createRole: (data: {
		name: string;
		description: string;
		active: boolean;
		permissions: string[];
	}) => Promise<void>;
	updateRole: (
		id: string,
		data: {
			name?: string;
			description?: string;
			active?: boolean;
			permissions?: string[];
		}
	) => Promise<void>;
	deleteRole: (id: string) => Promise<void>;
	updateRolePermissions: (id: string, permissions: string[]) => Promise<void>;
	open: RolesDialogType | null;
	setOpen: (type: RolesDialogType | null) => void;
	currentRow: Role | null;
	setCurrentRow: (role: Role | null) => void;
	handleCloseDialog: () => void;
}

const RolesContext = createContext<RolesContextType | undefined>(undefined);

interface Props {
	children: React.ReactNode;
}

export default function RolesProvider({ children }: Props) {
	const queryClient = useQueryClient();
	const [open, setOpen] = useDialogState<RolesDialogType>(null);
	const [currentRow, setCurrentRow] = useState<Role | null>(null);
	const [meta, setMeta] = useState({
		totalPages: 1,
		currentPage: 1,
		totalElements: 0,
	});

	// Fetch roles với React Query
	const {
		data: roles = [],
		isLoading,
		error,
		refetch,
	} = useQuery({
		queryKey: ['roles'],
		queryFn: async () => {
			const response = await rolesApi.getRoles();
			if (response.data.success) {
				setMeta(response.data.data.meta);
				return response.data.data.content;
			}
			throw new Error(
				response.data.message || 'Không thể tải danh sách vai trò'
			);
		},
		staleTime: 5 * 60 * 1000, // Cache trong 5 phút
		gcTime: 30 * 60 * 1000, // Giữ cache 30 phút
	});

	const fetchRoles = useCallback(
		(page: number) => {
			queryClient.setQueryData(['roles', page], () => {
				return rolesApi.getRoles({ page });
			});
		},
		[queryClient]
	);

	// Mutation cho việc tạo role mới
	const createRoleMutation = useMutation({
		mutationFn: async (roleData: {
			name: string;
			description: string;
			active: boolean;
			permissions: string[];
		}) => {
			const response = await rolesApi.createRole(roleData);
			if (!response.data.success) {
				throw new Error(response.data.message || 'Không thể tạo vai trò');
			}
			return response.data;
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
			data: {
				name?: string;
				description?: string;
				active?: boolean;
				permissions?: string[];
			};
		}) => {
			const response = await rolesApi.updateRole(id, data);
			if (!response.data.success) {
				throw new Error(response.data.message || 'Không thể cập nhật vai trò');
			}
			return response.data;
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
			const response = await rolesApi.deleteRole(id);
			if (!response.data.success) {
				throw new Error(response.data.message || 'Không thể xóa vai trò');
			}
			return response.data;
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

	// Mutation cho việc cập nhật quyền của role
	const updateRolePermissionsMutation = useMutation({
		mutationFn: async ({
			id,
			permissions,
		}: {
			id: string;
			permissions: string[];
		}) => {
			const response = await rolesApi.updateRolePermissions(id, permissions);
			if (!response.data.success) {
				throw new Error(response.data.message || 'Không thể cập nhật quyền');
			}
			return response.data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['roles'] });
			toast.success('Cập nhật quyền thành công');
		},
		onError: (error: Error) => {
			toast.error(error.message);
		},
	});

	const createRole = useCallback(
		async (data: {
			name: string;
			description: string;
			active: boolean;
			permissions: string[];
		}) => {
			await createRoleMutation.mutateAsync(data);
		},
		[]
	);

	const updateRole = useCallback(
		async (
			id: string,
			data: {
				name?: string;
				description?: string;
				active?: boolean;
				permissions?: string[];
			}
		) => {
			await updateRoleMutation.mutateAsync({ id, data });
		},
		[]
	);

	const deleteRole = useCallback(async (id: string) => {
		await deleteRoleMutation.mutateAsync(id);
	}, []);

	const updateRolePermissions = useCallback(
		async (id: string, permissions: string[]) => {
			await updateRolePermissionsMutation.mutateAsync({ id, permissions });
		},
		[]
	);

	const handleCloseDialog = useCallback(() => {
		setOpen(null);
		setCurrentRow(null);
	}, []);

	return (
		<RolesContext.Provider
			value={{
				roles,
				isLoading,
				error: error instanceof Error ? error.message : null,
				refetch,
				meta,
				fetchRoles,
				createRole,
				updateRole,
				deleteRole,
				updateRolePermissions,
				open,
				setOpen,
				currentRow,
				setCurrentRow,
				handleCloseDialog,
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
