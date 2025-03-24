'use client';

import { useUsers } from '../context/users-context';
import { UsersActionDialog } from './users-action-dialog';
import { UsersDeleteDialog } from './users-delete-dialog';
import { UsersInviteDialog } from './users-invite-dialog';

interface Props {
	refetch: () => Promise<void>;
}

export function UsersDialogs({ refetch }: Props) {
	const { open, setOpen, currentRow, setCurrentRow } = useUsers();
	return (
		<>
			<UsersActionDialog
				key="user-add"
				open={open === 'add'}
				onOpenChange={() => setOpen('add')}
				refetch={refetch}
			/>

			<UsersInviteDialog
				key="user-invite"
				open={open === 'invite'}
				onOpenChange={() => setOpen('invite')}
				refetch={refetch}
			/>

			{currentRow && (
				<>
					<UsersActionDialog
						key={`user-edit-${currentRow.id}`}
						open={open === 'edit'}
						onOpenChange={() => {
							setOpen('edit');
							setTimeout(() => {
								setCurrentRow(null);
							}, 500);
						}}
						currentRow={currentRow}
						refetch={refetch}
					/>

					<UsersDeleteDialog
						key={`user-delete-${currentRow.id}`}
						open={open === 'delete'}
						onOpenChange={() => {
							setOpen('delete');
							setTimeout(() => {
								setCurrentRow(null);
							}, 500);
						}}
						currentRow={currentRow}
						refetch={refetch}
					/>
				</>
			)}
		</>
	);
}
