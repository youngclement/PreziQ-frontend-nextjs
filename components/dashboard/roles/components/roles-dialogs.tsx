import { useRoles } from '../context/roles-context';
import { RolesFormDialog } from './roles-form-dialog';
import { RolesDeleteDialog } from './roles-delete-dialog';

export function RolesDialogs() {
	const { open, setOpen, currentRow, setCurrentRow } = useRoles();

	const handleOpenChange = (dialogType: 'add' | 'edit' | 'delete') => {
		setOpen(dialogType);
		if (!['edit'].includes(dialogType)) {
			setTimeout(() => {
				setCurrentRow(null);
			}, 500);
		}
	};

	const handleFormOpenChange = (isOpen: boolean) => {
		if (!isOpen) {
			setOpen(null);
			setTimeout(() => {
				setCurrentRow(null);
			}, 500);
		}
	};

	return (
		<>
			<RolesFormDialog
				key={currentRow ? `role-${currentRow.id}` : 'role-add'}
				open={open === 'add' || open === 'edit'}
				onOpenChange={handleFormOpenChange}
				currentRow={currentRow}
			/>

			{currentRow && (
				<RolesDeleteDialog
					key={`role-delete-${currentRow.id}`}
					open={open === 'delete'}
					onOpenChange={() => handleOpenChange('delete')}
				/>
			)}
		</>
	);
}
