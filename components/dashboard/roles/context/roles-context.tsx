import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import useDialogState from '@/hooks/use-dialog-state';
import { Role, Meta, roleResponseSchema } from '../data/schema';
import { API_URL, ACCESS_TOKEN } from '@/api/http';

type RolesDialogType = 'add' | 'edit' | 'delete';

interface CreateRoleData {
	name: string;
	description?: string;
	active?: boolean;
	permissionIds?: string[];
}

interface UpdateRoleData {
	name?: string;
	description?: string;
	active?: boolean;
	permissionIds?: string[];
}

interface RolesContextType {
	open: RolesDialogType | null;
	setOpen: (str: RolesDialogType | null) => void;
	currentRow: Role | null;
	setCurrentRow: React.Dispatch<React.SetStateAction<Role | null>>;
	roles: Role[];
	meta: Meta | null;
	isLoading: boolean;
	error: string | null;
	fetchRoles: (page?: number, size?: number) => Promise<void>;
	createRole: (data: CreateRoleData) => Promise<void>;
	updateRole: (id: string, data: UpdateRoleData) => Promise<void>;
	deleteRolePermissions: (
		roleId: string,
		permissionIds: string[]
	) => Promise<void>;
	deleteRole: (roleId: string) => Promise<void>;
}

const RolesContext = React.createContext<RolesContextType | null>(null);

interface Props {
	children: React.ReactNode;
}

export default function RolesProvider({ children }: Props) {
	const [open, setOpen] = useDialogState<RolesDialogType>(null);
	const [currentRow, setCurrentRow] = useState<Role | null>(null);
	const [roles, setRoles] = useState<Role[]>([]);
	const [meta, setMeta] = useState<Meta | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const fetchRoles = async (page = 1, size = 10) => {
		try {
			setIsLoading(true);
			setError(null);

			const response = await fetch(
				`${API_URL}/roles?page=${page}&size=${size}`,
				{
          method: 'GET',
					headers: {
						Authorization: `Bearer ${ACCESS_TOKEN}`,
					},
				}
			);

			const data = await response.json();
			const parsedData = roleResponseSchema.parse(data);

			setRoles(parsedData.data.content);
			setMeta(parsedData.data.meta);
		} catch (err) {
			setError(
				err instanceof Error ? err.message : 'Có lỗi xảy ra khi tải dữ liệu'
			);
		} finally {
			setIsLoading(false);
		}
	};

	const createRole = async (data: CreateRoleData) => {
		try {
			const response = await fetch(`${API_URL}/roles`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${ACCESS_TOKEN}`,
				},
				body: JSON.stringify(data),
			});

			const result = await response.json();

			if (!response.ok) {
				throw new Error(result.message || 'Có lỗi xảy ra khi tạo vai trò');
			}

			await fetchRoles();
			toast.success(result.message, {
				position: 'top-right',
				autoClose: 3000,
			});
		} catch (error) {
			toast.error(
				error instanceof Error
					? error.message
					: 'Có lỗi xảy ra khi tạo vai trò',
				{
					position: 'top-right',
					autoClose: 3000,
				}
			);
			throw error;
		}
	};

	const updateRole = async (id: string, data: UpdateRoleData) => {
		try {
			const response = await fetch(`${API_URL}/roles/${id}`, {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${ACCESS_TOKEN}`,
				},
				body: JSON.stringify(data),
			});

			const result = await response.json();

			if (!response.ok) {
				throw new Error(result.message || 'Có lỗi xảy ra khi cập nhật vai trò');
			}

			await fetchRoles();
			toast.success(result.message, {
				position: 'top-right',
				autoClose: 3000,
			});
		} catch (error) {
			toast.error(
				error instanceof Error
					? error.message
					: 'Có lỗi xảy ra khi cập nhật vai trò',
				{
					position: 'top-right',
					autoClose: 3000,
				}
			);
			throw error;
		}
	};

	const deleteRolePermissions = async (
		roleId: string,
		permissionIds: string[]
	) => {
		try {
			const response = await fetch(`${API_URL}/roles/${roleId}/permissions`, {
				method: 'DELETE',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${ACCESS_TOKEN}`,
				},
				body: JSON.stringify({ permissionIds }),
			});

			const result = await response.json();

			if (!response.ok) {
				throw new Error(result.message || 'Có lỗi xảy ra khi xóa quyền');
			}

			await fetchRoles();
			// toast.success(result.message, {
			//   position: 'top-right',
			//   autoClose: 3000,
			// });
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : 'Có lỗi xảy ra khi xóa quyền',
				{
					position: 'top-right',
					autoClose: 3000,
				}
			);
			throw error;
		}
	};

	const deleteRole = async (roleId: string) => {
		try {
			const response = await fetch(`${API_URL}/roles/${roleId}`, {
				method: 'DELETE',
				headers: {
					Authorization: `Bearer ${ACCESS_TOKEN}`,
				},
			});

			const result = await response.json();

			if (!response.ok) {
				throw new Error(result.message || 'Có lỗi xảy ra khi xóa vai trò');
			}

			await fetchRoles();
			toast.success(result.message, {
				position: 'top-right',
				autoClose: 3000,
			});
		} catch (error) {
			toast.error(
				error instanceof Error
					? error.message
					: 'Có lỗi xảy ra khi xóa vai trò',
				{
					position: 'top-right',
					autoClose: 3000,
				}
			);
			throw error;
		}
	};

	useEffect(() => {
		fetchRoles();
	}, []);

	return (
		<RolesContext.Provider
			value={{
				open,
				setOpen,
				currentRow,
				setCurrentRow,
				roles,
				meta,
				isLoading,
				error,
				fetchRoles,
				createRole,
				updateRole,
				deleteRolePermissions,
				deleteRole,
			}}
		>
			{children}
		</RolesContext.Provider>
	);
}

export const useRoles = () => {
	const rolesContext = React.useContext(RolesContext);

	if (!rolesContext) {
		throw new Error('useRoles has to be used within <RolesContext.Provider>');
	}

	return rolesContext;
};
