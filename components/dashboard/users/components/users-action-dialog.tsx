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
import { Switch } from '@/components/ui/switch';

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
			<DialogContent className="max-w-2xl max-h-[90vh] p-0 gap-0">
				<DialogHeader className="px-6 py-4 border-b bg-slate-50">
					<DialogTitle className="text-xl font-semibold text-slate-900">
						Chỉnh sửa người dùng
					</DialogTitle>
					<DialogDescription className="text-sm text-slate-500">
						Cập nhật thông tin người dùng. Nhấn lưu khi hoàn tất.
					</DialogDescription>
				</DialogHeader>

				<ScrollArea className="flex-1 max-h-[80vh]">
					<Form {...form}>
						<form
							id="user-form"
							onSubmit={form.handleSubmit(onSubmit)}
							className="space-y-6"
						>
							<div className="px-6 py-4 space-y-6">
								{/* Basic Info Section */}
								<div className="space-y-4 p-4 bg-white rounded-lg border border-slate-200 shadow-sm">
									<h3 className="text-sm font-medium text-slate-900 mb-3">
										Thông tin cơ bản
									</h3>

									<div className="grid grid-cols-2 gap-4">
										<FormField
											control={form.control}
											name="firstName"
											render={({ field }) => (
												<FormItem>
													<FormLabel className="text-sm font-medium text-slate-700">
														Họ
													</FormLabel>
													<FormControl>
														<Input
															placeholder="Nguyễn"
															className="bg-white border-slate-200 focus:border-slate-900 focus:ring-slate-900"
															{...field}
														/>
													</FormControl>
													<FormMessage className="text-xs text-red-500" />
												</FormItem>
											)}
										/>

										<FormField
											control={form.control}
											name="lastName"
											render={({ field }) => (
												<FormItem>
													<FormLabel className="text-sm font-medium text-slate-700">
														Tên
													</FormLabel>
													<FormControl>
														<Input
															placeholder="Văn A"
															className="bg-white border-slate-200 focus:border-slate-900 focus:ring-slate-900"
															{...field}
														/>
													</FormControl>
													<FormMessage className="text-xs text-red-500" />
												</FormItem>
											)}
										/>
									</div>

									<FormField
										control={form.control}
										name="email"
										render={({ field }) => (
											<FormItem>
												<FormLabel className="text-sm font-medium text-slate-700">
													Email
												</FormLabel>
												<FormControl>
													<Input
														placeholder="john.doe@gmail.com"
														className="bg-white border-slate-200 focus:border-slate-900 focus:ring-slate-900"
														{...field}
													/>
												</FormControl>
												<FormMessage className="text-xs text-red-500" />
											</FormItem>
										)}
									/>
								</div>

								{/* Role Section */}
								<div className="space-y-4 p-4 bg-white rounded-lg border border-slate-200 shadow-sm">
									<h3 className="text-sm font-medium text-slate-900 mb-3">
										Vai trò
									</h3>

									<FormField
										control={form.control}
										name="roles"
										render={({ field }) => (
											<FormItem>
												<FormLabel className="text-sm font-medium text-slate-700">
													Chọn vai trò
												</FormLabel>
												<FormControl>
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
														<SelectTrigger className="bg-white border-slate-200 focus:border-slate-900 focus:ring-slate-900">
															<SelectValue placeholder="Chọn vai trò" />
														</SelectTrigger>
														<SelectContent>
															{Array.isArray(roles) &&
																roles.map((role) => (
																	<SelectItem
																		key={role.id}
																		value={role.id}
																		className="text-slate-900"
																	>
																		{role.name}
																	</SelectItem>
																))}
														</SelectContent>
													</Select>
												</FormControl>
												<FormMessage className="text-xs text-red-500" />
											</FormItem>
										)}
									/>
								</div>

								{/* Verification Section */}
								<div className="space-y-4 p-4 bg-white rounded-lg border border-slate-200 shadow-sm">
									<h3 className="text-sm font-medium text-slate-900 mb-3">
										Xác thực
									</h3>

									<FormField
										control={form.control}
										name="isVerified"
										render={({ field }) => (
											<FormItem className="flex items-center justify-between rounded-lg bg-slate-50 p-4 border border-slate-200">
												<div className="space-y-1">
													<FormLabel className="text-sm font-medium text-slate-700">
														Trạng thái xác thực
													</FormLabel>
													<div className="text-sm text-slate-500">
														Tài khoản{' '}
														{field.value ? 'đã xác thực' : 'chưa xác thực'}
													</div>
												</div>
												<FormControl>
													<Switch
														checked={field.value}
														onCheckedChange={field.onChange}
														className="data-[state=checked]:bg-slate-900 data-[state=unchecked]:bg-slate-100 data-[state=unchecked]:border-slate-300"
													/>
												</FormControl>
											</FormItem>
										)}
									/>
								</div>
							</div>

							{/* Footer */}
							<div className="flex justify-end gap-4 px-6 py-4 border-t bg-slate-50">
								<Button
									type="button"
									variant="outline"
									onClick={() => onOpenChange(false)}
									className="border-slate-200 hover:bg-slate-100"
								>
									Hủy
								</Button>
								<Button
									type="submit"
									form="user-form"
									className="bg-slate-900 hover:bg-slate-800 text-white"
								>
									Lưu
								</Button>
							</div>
						</form>
					</Form>
				</ScrollArea>
			</DialogContent>
		</Dialog>
	);
}
