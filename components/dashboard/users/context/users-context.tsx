'use client';

import React, { useState } from 'react';
import useDialogState from '@/hooks/use-dialog-state';
import { User } from '../data/schema';

type UsersDialogType = 'invite' | 'add' | 'edit' | 'delete';

interface UsersContextType {
	open: UsersDialogType | null;
	setOpen: (str: UsersDialogType | null) => void;
	currentRow: User | null;
	setCurrentRow: React.Dispatch<React.SetStateAction<User | null>>;
	refetch: () => Promise<void>;
	setRefetch: React.Dispatch<React.SetStateAction<() => Promise<void>>>;
}

const UsersContext = React.createContext<UsersContextType | null>(null);

interface Props {
	children: React.ReactNode;
}

export default function UsersProvider({ children }: Props) {
	const [open, setOpen] = useDialogState<UsersDialogType>(null);
	const [currentRow, setCurrentRow] = useState<User | null>(null);
	const [refetch, setRefetch] = useState<() => Promise<void>>(async () => {});

	return (
		<UsersContext.Provider
			value={{ open, setOpen, currentRow, setCurrentRow, refetch, setRefetch }}
		>
			{children}
		</UsersContext.Provider>
	);
}

// eslint-disable-next-line react-refresh/only-export-components
export const useUsers = () => {
	const usersContext = React.useContext(UsersContext);

	if (!usersContext) {
		throw new Error('useUsers has to be used within <UsersContext>');
	}

	return usersContext;
};
