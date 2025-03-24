'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { Permission } from '../data/schema';

type DialogType = 'add' | 'edit' | 'delete' | null;

interface ModuleResponse {
	code: number;
	message: string;
	data: string[];
}

interface PermissionsContextType {
	open: DialogType;
	setOpen: (type: DialogType) => void;
	currentRow: Permission | null;
	setCurrentRow: React.Dispatch<React.SetStateAction<Permission | null>>;
	permissions: Permission[];
	modules: string[];
	isLoading: boolean;
	error: string | null;
	refetch: () => Promise<void>;
}

export interface PermissionContextState {
	permissions: {
		id: string;
		name: string;
		apiPath: string;
		httpMethod: string;
		module: string;
		createdAt: Date;
		updatedAt: Date;
	}[];
}

const PermissionsContext = createContext<PermissionsContextType | undefined>(
	undefined
);

export function PermissionsProvider({
	children,
}: {
	children: React.ReactNode;
}) {
	const [open, setOpen] = useState<DialogType>(null);
	const [currentRow, setCurrentRow] = useState<Permission | null>(null);
	const [permissions, setPermissions] = useState<Permission[]>([]);
	const [modules, setModules] = useState<string[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const fetchData = async () => {
		setIsLoading(true);
		setError(null);
		try {
			// Mô phỏng API call
			setTimeout(() => {
				setPermissions([
					{
						id: '1',
						name: 'Xem người dùng',
						apiPath: '/api/users',
						httpMethod: 'GET',
						module: 'users',
						createdAt: new Date(),
						updatedAt: new Date(),
					},
					{
						id: '2',
						name: 'Tạo người dùng',
						apiPath: '/api/users',
						httpMethod: 'POST',
						module: 'users',
						createdAt: new Date(),
						updatedAt: new Date(),
					},
				]);
				setModules(['users', 'roles', 'products']);
				setIsLoading(false);
			}, 1000);
		} catch (error) {
			const message =
				error instanceof Error
					? error.message
					: 'Có lỗi xảy ra khi tải dữ liệu';
			setError(message);
			toast.error(message);
			setIsLoading(false);
		}
	};

	useEffect(() => {
		fetchData();
	}, []);

	return (
		<PermissionsContext.Provider
			value={{
				open,
				setOpen,
				currentRow,
				setCurrentRow,
				permissions,
				modules,
				isLoading,
				error,
				refetch: fetchData,
			}}
		>
			{children}
		</PermissionsContext.Provider>
	);
}

export function usePermissions() {
	const context = useContext(PermissionsContext);
	if (!context) {
		throw new Error('usePermissions must be used within PermissionsProvider');
	}
	return context;
}
