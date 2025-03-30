import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
	Dialog,
	DialogContent,
	DialogDescription,
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
import { Button } from '@/components/ui/button';
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
} from '@/components/ui/command';
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from '@/components/ui/popover';
import { IconCheck, IconChevronDown } from '@tabler/icons-react';
import { cn } from '@/lib/utils';
import { usePermissions } from '../context/permissions-context';
import { toast } from 'react-toastify';
import { API_URL, ACCESS_TOKEN } from '@/api-mock/http';

const formSchema = z.object({
	moduleName: z
		.string()
		.min(1, 'Tên module không được để trống')
		.refine((value) => /^[A-Z]+$/.test(value), {
			message: 'Tên module phải viết hoa và không chứa ký tự đặc biệt',
		}),
	permissionIds: z
		.array(z.string())
		.refine((value) => new Set(value).size === value.length, {
			message: 'Không được chọn trùng lặp permission',
		}),
});

interface Props {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function CreateModuleDialog({ open, onOpenChange }: Props) {
	const { permissions = [], modules = [], refetch } = usePermissions();
	const [isLoading, setIsLoading] = useState(false);
	const [availablePermissions, setAvailablePermissions] = useState<any[]>([]);

	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			moduleName: '',
			permissionIds: [],
		},
	});

	// Cập nhật danh sách permissions mỗi khi dialog mở hoặc permissions thay đổi
	useEffect(() => {
		if (permissions && Array.isArray(permissions)) {
			// Lọc ra các permission chưa có module hoặc module là chuỗi rỗng
			const filtered = permissions.filter(
				(p) =>
					!p.module ||
					p.module === '' ||
					p.module === null ||
					p.module === undefined
			);
			setAvailablePermissions(filtered);

			if (open) {
				console.log('Tổng số permissions:', permissions.length);
				console.log('Số permissions khả dụng:', filtered.length);
			}
		}
	}, [permissions, open]);

	const onSubmit = async (values: z.infer<typeof formSchema>) => {
		setIsLoading(true);
		try {
			// Kiểm tra tên module đã tồn tại chưa
			if (modules.includes(values.moduleName)) {
				form.setError('moduleName', {
					message: 'Tên module đã tồn tại',
				});
				setIsLoading(false);
				return;
			}

			console.log('Gửi dữ liệu:', values);

			const response = await fetch(`${API_URL}/permissions/module`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${ACCESS_TOKEN}`,
				},
				body: JSON.stringify(values),
			});

			const data = await response.json();

			if (!response.ok) {
				toast.error(data.message || 'Không thể tạo module');
				return;
			}

			toast.success(data.message || 'Tạo module thành công');
			onOpenChange(false);
			form.reset();
			refetch(); // Cập nhật lại danh sách
		} catch (error) {
			const message =
				error instanceof Error ? error.message : 'Không thể tạo module';
			toast.error(message);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-[425px]">
				<DialogHeader>
					<DialogTitle>Tạo Module Mới</DialogTitle>
					<DialogDescription>
						Tạo một module mới và gán các permissions cho module đó.
					</DialogDescription>
				</DialogHeader>

				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
						<FormField
							control={form.control}
							name="moduleName"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Tên Module</FormLabel>
									<FormControl>
										<Input
											placeholder="Nhập tên module (viết hoa)"
											{...field}
											onChange={(e) =>
												field.onChange(e.target.value.toUpperCase())
											}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="permissionIds"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Permissions</FormLabel>
									<Popover>
										<PopoverTrigger asChild>
											<FormControl>
												<Button
													variant="outline"
													role="combobox"
													className={cn(
														'w-full justify-between',
														!field.value?.length && 'text-muted-foreground'
													)}
												>
													{field.value?.length
														? `Đã chọn ${field.value.length} permission`
														: 'Chọn permissions'}
													<IconChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
												</Button>
											</FormControl>
										</PopoverTrigger>
										<PopoverContent className="w-[400px] p-0">
											<Command>
												<CommandInput placeholder="Tìm permission..." />
												<CommandEmpty>Không tìm thấy permission</CommandEmpty>
												<CommandGroup className="max-h-[300px] overflow-auto">
													{availablePermissions.length === 0 ? (
														<div className="px-4 py-2 text-sm text-muted-foreground">
															Không có permission nào khả dụng
														</div>
													) : (
														availablePermissions.map((permission) => (
															<CommandItem
																key={permission.id}
																value={permission.id}
																onSelect={() => {
																	const currentValue = Array.isArray(
																		field.value
																	)
																		? [...field.value]
																		: [];

																	const index = currentValue.indexOf(
																		permission.id
																	);
																	if (index > -1) {
																		// Nếu đã chọn thì bỏ chọn
																		currentValue.splice(index, 1);
																	} else {
																		// Nếu chưa chọn thì thêm vào
																		currentValue.push(permission.id);
																	}

																	field.onChange(currentValue);
																	console.log(
																		'Đã cập nhật permissionIds:',
																		currentValue
																	);
																}}
																className="cursor-pointer hover:bg-accent hover:text-accent-foreground"
															>
																<div className="flex items-center space-x-2">
																	<div
																		className={cn(
																			'flex h-4 w-4 items-center justify-center rounded-sm border',
																			field.value?.includes(permission.id)
																				? 'bg-primary border-primary'
																				: 'opacity-50'
																		)}
																	>
																		{field.value?.includes(permission.id) && (
																			<IconCheck className="h-3 w-3 text-white" />
																		)}
																	</div>
																	<div className="flex flex-col">
																		<span className="font-medium">
																			{permission.name}
																		</span>
																		<span className="text-xs text-muted-foreground">
																			{permission.httpMethod}{' '}
																			{permission.apiPath}
																		</span>
																	</div>
																</div>
															</CommandItem>
														))
													)}
												</CommandGroup>
											</Command>
										</PopoverContent>
									</Popover>
									<FormMessage />
								</FormItem>
							)}
						/>

						<div className="flex justify-end pt-4">
							<Button type="submit" disabled={isLoading}>
								{isLoading ? 'Đang xử lý...' : 'Tạo module'}
							</Button>
						</div>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}
