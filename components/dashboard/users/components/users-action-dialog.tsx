'use client';

import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PasswordInput } from '@/components/dashboard/password-input';
import { SelectDropdown } from '@/components/dashboard/select-dropdown';
import { userTypes } from '../../users/data/data';
import { User } from '../data/schema';
import { useState, useEffect } from 'react';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { API_URL, ACCESS_TOKEN } from '@/api/http';

type UpdateUserData = {
	email?: string;
	firstName?: string;
	lastName?: string;
	isVerified?: boolean;
	roles?: string[];
};

const formSchema = z.object({
	email: z
		.string()
		.min(1, { message: 'Email là bắt buộc.' })
		.email({ message: 'Email không hợp lệ.' }),
	firstName: z.string().min(1, { message: 'Họ là bắt buộc.' }),
	lastName: z.string().min(1, { message: 'Tên là bắt buộc.' }),
	isVerified: z.boolean(),
	roles: z.array(
		z.object({
			id: z.string(),
			name: z.string(),
		})
	),
});

type UserForm = z.infer<typeof formSchema>;

interface Props {
	currentRow?: User;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	refetch: () => Promise<void>;
}

export function UsersActionDialog({
	currentRow,
	open,
	onOpenChange,
	refetch,
}: Props) {
	const isEdit = !!currentRow;
	const [roles, setRoles] = useState<Array<{ id: string; name: string }>>([]);

	const form = useForm<UserForm>({
		resolver: zodResolver(formSchema),
		defaultValues: isEdit
			? {
					email: currentRow.email,
					firstName: currentRow.firstName,
					lastName: currentRow.lastName,
					isVerified: currentRow.isVerified,
					roles: currentRow.roles,
			  }
			: {
					email: '',
					firstName: '',
					lastName: '',
					isVerified: false,
					roles: [],
			  },
	});

	useEffect(() => {
		const fetchRoles = async () => {
			try {
				const response = await fetch(`${API_URL}/roles`, {
					method: 'GET',
					headers: {
						'Content-Type': 'application/json',
						Authorization: `Bearer ${ACCESS_TOKEN}`,
					},
				});
				const data = await response.json();
				if (data.data?.content && Array.isArray(data.data.content)) {
					setRoles(data.data.content);
				} else {
					console.error('Invalid roles data:', data);
					setRoles([]);
				}
			} catch (error) {
				console.error('Error fetching roles:', error);
				toast({
					title: 'Lỗi',
					description: 'Không thể tải danh sách vai trò.',
					variant: 'destructive',
				});
				setRoles([]);
			}
		};

		if (open) {
			fetchRoles();
		}
	}, [open]);

	const onSubmit = async (values: UserForm) => {
		try {
			if (!isEdit || !currentRow?.id) return;

			const changedFields: UpdateUserData = {};

			// Kiểm tra từng trường và chỉ thêm vào changedFields nếu có thay đổi
			if (values.email !== currentRow.email) {
				changedFields.email = values.email;
			}
			if (values.firstName !== currentRow.firstName) {
				changedFields.firstName = values.firstName;
			}
			if (values.lastName !== currentRow.lastName) {
				changedFields.lastName = values.lastName;
			}
			if (values.isVerified !== currentRow.isVerified) {
				changedFields.isVerified = values.isVerified;
			}
			if (JSON.stringify(values.roles) !== JSON.stringify(currentRow.roles)) {
				changedFields.roles = values.roles.map((role) => role.id);
			}

			// Nếu không có trường nào thay đổi, không gửi request
			if (Object.keys(changedFields).length === 0) {
				toast({
					title: 'Thông báo',
					description: 'Không có thông tin nào được thay đổi.',
				});
				return;
			}

			const response = await fetch(`${API_URL}/users/${currentRow.id}`, {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${ACCESS_TOKEN}`,
				},
				body: JSON.stringify(changedFields),
			});

			if (!response.ok) {
				throw new Error('Failed to update user');
			}

			toast({
				title: 'Thành công',
				description: 'Cập nhật thông tin người dùng thành công.',
			});

			// Refetch lại dữ liệu sau khi update thành công
			await refetch();

			onOpenChange(false);
		} catch (error) {
			console.error('Error updating user:', error);
			toast({
				title: 'Lỗi',
				description: 'Không thể cập nhật thông tin người dùng.',
				variant: 'destructive',
			});
		}
	};

	return (
		<Dialog
			open={open}
			onOpenChange={(state) => {
				form.reset();
				onOpenChange(state);
			}}
		>
			<DialogContent className="sm:max-w-lg">
				<DialogHeader className="text-left">
					<DialogTitle>Chỉnh sửa người dùng</DialogTitle>
					<DialogDescription>
						Cập nhật thông tin người dùng. Nhấn lưu khi hoàn tất.
					</DialogDescription>
				</DialogHeader>
				<ScrollArea className="h-[26.25rem] w-full pr-4 -mr-4 py-1">
					<Form {...form}>
						<form
							id="user-form"
							onSubmit={form.handleSubmit(onSubmit)}
							className="space-y-4 p-0.5"
						>
							<FormField
								control={form.control}
								name="email"
								render={({ field }) => (
									<FormItem className="grid grid-cols-6 items-center gap-x-4 gap-y-1 space-y-0">
										<FormLabel className="col-span-2 text-right">
											Email
										</FormLabel>
										<FormControl>
											<Input
												placeholder="john.doe@gmail.com"
												className="col-span-4"
												{...field}
											/>
										</FormControl>
										<FormMessage className="col-span-4 col-start-3" />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="firstName"
								render={({ field }) => (
									<FormItem className="grid grid-cols-6 items-center gap-x-4 gap-y-1 space-y-0">
										<FormLabel className="col-span-2 text-right">Họ</FormLabel>
										<FormControl>
											<Input
												placeholder="Nguyễn"
												className="col-span-4"
												{...field}
											/>
										</FormControl>
										<FormMessage className="col-span-4 col-start-3" />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="lastName"
								render={({ field }) => (
									<FormItem className="grid grid-cols-6 items-center gap-x-4 gap-y-1 space-y-0">
										<FormLabel className="col-span-2 text-right">Tên</FormLabel>
										<FormControl>
											<Input
												placeholder="Văn A"
												className="col-span-4"
												{...field}
											/>
										</FormControl>
										<FormMessage className="col-span-4 col-start-3" />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="isVerified"
								render={({ field }) => (
									<FormItem className="grid grid-cols-6 items-center gap-x-4 gap-y-1 space-y-0">
										<FormLabel className="col-span-2 text-right">
											Xác thực
										</FormLabel>
										<FormControl>
											<Checkbox
												checked={field.value}
												onCheckedChange={field.onChange}
												className="col-span-4"
											/>
										</FormControl>
										<FormMessage className="col-span-4 col-start-3" />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="roles"
								render={({ field }) => (
									<FormItem className="grid grid-cols-6 items-center gap-x-4 gap-y-1 space-y-0">
										<FormLabel className="col-span-2 text-right">
											Vai trò
										</FormLabel>
										<FormControl>
											<div className="col-span-4">
												<Select
													value={field.value[0]?.id || ''}
													onValueChange={(value: string) => {
														const selectedRole = roles.find(
															(role) => role.id === value
														);
														if (selectedRole) {
															field.onChange([selectedRole]);
														}
													}}
												>
													<SelectTrigger>
														<SelectValue placeholder="Chọn vai trò" />
													</SelectTrigger>
													<SelectContent>
														{Array.isArray(roles) &&
															roles.map((role) => (
																<SelectItem key={role.id} value={role.id}>
																	{role.name}
																</SelectItem>
															))}
													</SelectContent>
												</Select>
											</div>
										</FormControl>
										<FormMessage className="col-span-4 col-start-3" />
									</FormItem>
								)}
							/>
						</form>
					</Form>
				</ScrollArea>
				<DialogFooter>
					<Button
						type="button"
						variant="outline"
						onClick={() => onOpenChange(false)}
					>
						Hủy
					</Button>
					<Button type="submit" form="user-form">
						Lưu
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
