'use client';

import { useUsers } from '../context/users-context';
import { useRoles } from '../../roles/context/roles-context';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
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
	email: z.string().email('Email không hợp lệ'),
	firstName: z.string().min(1, 'Vui lòng nhập tên'),
	lastName: z.string().min(1, 'Vui lòng nhập họ'),
	isVerified: z.boolean(),
	roles: z.array(z.string()),
});

type UserForm = z.infer<typeof formSchema>;

interface Props {
	currentRow?: User | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function UsersActionDialog({ currentRow, open, onOpenChange }: Props) {
	const { updateUser, createUser } = useUsers();
	const { roles } = useRoles();
	const isEdit = !!currentRow;

	const form = useForm<UserForm>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			email: currentRow?.email || '',
			firstName: currentRow?.firstName || '',
			lastName: currentRow?.lastName || '',
			isVerified: currentRow?.isVerified || false,
			roles: currentRow?.roles.map((role) => role.id) || [],
		},
	});

	const onSubmit = async (values: UserForm) => {
		if (isEdit && currentRow?.id) {
			const changedFields: any = {};

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
			if (
				JSON.stringify(values.roles) !==
				JSON.stringify(currentRow.roles.map((role) => role.id))
			) {
				changedFields.roles = values.roles;
			}

			// Nếu không có trường nào thay đổi, không gửi request
			if (Object.keys(changedFields).length === 0) {
				toast({
					title: 'Thông báo',
					description: 'Không có thông tin nào được thay đổi.',
				});
				return;
			}

			await updateUser(currentRow.id, changedFields);
		} else {
			await createUser(values);
		}
		onOpenChange(false);
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-[425px]">
				<DialogHeader>
					<DialogTitle>
						{isEdit ? 'Chỉnh sửa người dùng' : 'Thêm người dùng mới'}
					</DialogTitle>
					<DialogDescription>
						{isEdit
							? 'Chỉnh sửa thông tin người dùng tại đây.'
							: 'Thêm người dùng mới vào hệ thống.'}
					</DialogDescription>
				</DialogHeader>
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
						<FormField
							control={form.control}
							name="email"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Email</FormLabel>
									<FormControl>
										<Input placeholder="example@email.com" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="firstName"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Tên</FormLabel>
									<FormControl>
										<Input placeholder="Tên" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="lastName"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Họ</FormLabel>
									<FormControl>
										<Input placeholder="Họ" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="roles"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Vai trò</FormLabel>
									<Select
										value={field.value[0] || ''}
										onValueChange={(value) => {
											field.onChange([value]);
										}}
									>
										<FormControl>
											<SelectTrigger>
												<SelectValue placeholder="Chọn vai trò" />
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											{roles.map((role) => (
												<SelectItem key={role.id} value={role.id}>
													{role.name}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="isVerified"
							render={({ field }) => (
								<FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
									<div className="space-y-0.5">
										<FormLabel className="text-base">Xác thực email</FormLabel>
									</div>
									<FormControl>
										<Switch
											checked={field.value}
											onCheckedChange={field.onChange}
										/>
									</FormControl>
								</FormItem>
							)}
						/>
						<DialogFooter>
							<Button type="submit">{isEdit ? 'Cập nhật' : 'Thêm mới'}</Button>
						</DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}
