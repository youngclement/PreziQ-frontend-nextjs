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
import { API_URL, ACCESS_TOKEN } from '@/api/http';

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
	const [isMounted, setIsMounted] = useState(false);

	// Client-side rendering protection
	useEffect(() => {
		setIsMounted(true);
	}, []);

	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			moduleName: '',
			permissionIds: [],
		},
	});

	// Lọc ra các permission chưa có module
	const availablePermissions = permissions?.filter((p) => !p.module) || [];

	const onSubmit = async (values: z.infer<typeof formSchema>) => {
		setIsLoading(true);
		try {
			// Kiểm tra tên module đã tồn tại chưa
			if (modules?.includes(values.moduleName)) {
				form.setError('moduleName', {
					message: 'Tên module đã tồn tại',
				});
				return;
			}

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

			toast.success(data.message);

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

				{isMounted && (
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
															!field.value && 'text-muted-foreground'
														)}
													>
														{field.value && field.value.length > 0
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
														{availablePermissions.map((permission) => (
															<CommandItem
																key={permission.id}
																onSelect={() => {
																	// Ensure field.value is always an array before creating Set
																	const currentValue = new Set(
																		field.value || []
																	);
																	if (currentValue.has(permission.id)) {
																		currentValue.delete(permission.id);
																	} else {
																		currentValue.add(permission.id);
																	}
																	field.onChange(Array.from(currentValue));
																}}
															>
																<IconCheck
																	className={cn(
																		'mr-2 h-4 w-4',
																		Array.isArray(field.value) &&
																			field.value.includes(permission.id)
																			? 'opacity-100'
																			: 'opacity-0'
																	)}
																/>
																<div className="flex flex-col">
																	<span>{permission.name}</span>
																	<span className="text-xs text-muted-foreground">
																		{permission.httpMethod} {permission.apiPath}
																	</span>
																</div>
															</CommandItem>
														))}
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
									Tạo module
								</Button>
							</div>
						</form>
					</Form>
				)}
			</DialogContent>
		</Dialog>
	);
}
