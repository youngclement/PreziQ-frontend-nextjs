'use client';

import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { userApi } from '@/api-client/user-update-api';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '@/components/ui/form';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { toast as sonnerToast } from 'sonner';
// Schema validation
const passwordFormSchema = z
	.object({
		currentPassword: z
			.string()
			.min(6, 'Mật khẩu hiện tại phải có ít nhất 6 ký tự'),
		newPassword: z
			.string()
			.min(8, 'Mật khẩu mới phải có ít nhất 8 ký tự')
			.regex(
				/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
				'Mật khẩu phải có ít nhất 1 chữ hoa, 1 chữ thường, 1 số và 1 ký tự đặc biệt'
			),
		confirmPassword: z
			.string()
			.min(8, 'Xác nhận mật khẩu phải có ít nhất 8 ký tự'),
	})
	.refine((data) => data.newPassword === data.confirmPassword, {
		message: 'Mật khẩu xác nhận không khớp',
		path: ['confirmPassword'],
	});

type PasswordFormValues = z.infer<typeof passwordFormSchema>;

// Interface cho response từ API
interface ApiResponse {
	success: boolean;
	message: string;
	meta?: {
		timestamp: string;
		instance: string;
	};
}

interface ApiResponseWrapper {
	data: ApiResponse;
}

export function UserPasswordForm() {
	const router = useRouter();
	const { logout } = useAuth();
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [showCurrentPassword, setShowCurrentPassword] = useState(false);
	const [showNewPassword, setShowNewPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);

	const form = useForm<PasswordFormValues>({
		resolver: zodResolver(passwordFormSchema),
		defaultValues: {
			currentPassword: '',
			newPassword: '',
			confirmPassword: '',
		},
	});

	async function onSubmit(data: PasswordFormValues) {
		try {
			setIsSubmitting(true);

			// Call API to update password
			const response = (await userApi.updatePassword({
				currentPassword: data.currentPassword,
				newPassword: data.newPassword,
				confirmPassword: data.confirmPassword,
			})) as unknown as ApiResponseWrapper;

			// Handle response
			if (response?.data?.success) {
				toast({
					title: 'Thành công',
					description: 'Mật khẩu đã được cập nhật. Vui lòng đăng nhập lại.',
				});

				// Log out and redirect to login page
				await logout();
				router.push('/auth/login');
			}
		} catch (error: any) {
			console.error('Lỗi khi cập nhật email:', error);
	  
			sonnerToast.error(
			  error.message ||
				error.errors?.[0]?.message ||
				'Không thể cập nhật email. Vui lòng thử lại sau.',
			);
		} finally {
			setIsSubmitting(false);
		}
	}

	return (
		<Card className="border-0 shadow-none">
			<CardHeader className="space-y-1">
				<CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
					Mật khẩu
				</CardTitle>
				<CardDescription className="text-base">
					Cập nhật mật khẩu của bạn để bảo vệ tài khoản
				</CardDescription>
			</CardHeader>
			<CardContent>
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
						<FormField
							control={form.control}
							name="currentPassword"
							render={({ field }) => (
								<FormItem>
									<FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300">
										Mật khẩu hiện tại
									</FormLabel>
									<FormControl>
										<div className="relative">
											<Input
												{...field}
												type={showCurrentPassword ? 'text' : 'password'}
												className="transition-all duration-200 focus:ring-2 focus:ring-primary/20 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 pr-10"
												placeholder="Nhập mật khẩu hiện tại"
											/>
											<Button
												type="button"
												variant="ghost"
												size="icon"
												className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
												onClick={() =>
													setShowCurrentPassword(!showCurrentPassword)
												}
											>
												{showCurrentPassword ? (
													<EyeOff className="h-4 w-4 text-gray-500 dark:text-gray-400" />
												) : (
													<Eye className="h-4 w-4 text-gray-500 dark:text-gray-400" />
												)}
											</Button>
										</div>
									</FormControl>
									<FormMessage className="text-xs text-red-500 dark:text-red-400" />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="newPassword"
							render={({ field }) => (
								<FormItem>
									<FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300">
										Mật khẩu mới
									</FormLabel>
									<FormControl>
										<div className="relative">
											<Input
												{...field}
												type={showNewPassword ? 'text' : 'password'}
												className="transition-all duration-200 focus:ring-2 focus:ring-primary/20 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 pr-10"
												placeholder="Nhập mật khẩu mới"
											/>
											<Button
												type="button"
												variant="ghost"
												size="icon"
												className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
												onClick={() => setShowNewPassword(!showNewPassword)}
											>
												{showNewPassword ? (
													<EyeOff className="h-4 w-4 text-gray-500 dark:text-gray-400" />
												) : (
													<Eye className="h-4 w-4 text-gray-500 dark:text-gray-400" />
												)}
											</Button>
										</div>
									</FormControl>
									<FormMessage className="text-xs text-red-500 dark:text-red-400" />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="confirmPassword"
							render={({ field }) => (
								<FormItem>
									<FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300">
										Xác nhận mật khẩu mới
									</FormLabel>
									<FormControl>
										<div className="relative">
											<Input
												{...field}
												type={showConfirmPassword ? 'text' : 'password'}
												className="transition-all duration-200 focus:ring-2 focus:ring-primary/20 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 pr-10"
												placeholder="Xác nhận mật khẩu mới"
											/>
											<Button
												type="button"
												variant="ghost"
												size="icon"
												className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
												onClick={() =>
													setShowConfirmPassword(!showConfirmPassword)
												}
											>
												{showConfirmPassword ? (
													<EyeOff className="h-4 w-4 text-gray-500 dark:text-gray-400" />
												) : (
													<Eye className="h-4 w-4 text-gray-500 dark:text-gray-400" />
												)}
											</Button>
										</div>
									</FormControl>
									<FormMessage className="text-xs text-red-500 dark:text-red-400" />
								</FormItem>
							)}
						/>

						<div className="flex justify-end">
							<Button
								type="submit"
								disabled={isSubmitting}
								className="min-w-[120px] transition-all duration-200 hover:shadow-lg hover:shadow-primary/20 bg-primary hover:bg-primary/90"
							>
								{isSubmitting ? (
									<>
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
										Đang cập nhật...
									</>
								) : (
									'Cập nhật mật khẩu'
								)}
							</Button>
						</div>
					</form>
				</Form>
			</CardContent>
		</Card>
	);
}
