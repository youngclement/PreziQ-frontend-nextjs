import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEffect, useState, useRef, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
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
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Collapse,
  CollapseContent,
  CollapseTrigger,
} from '@/components/ui/collapse';
import { useRoles } from '../context/roles-context';
import { toast } from '@/hooks/use-toast';
import { Permission } from '../data/schema';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { IconChevronRight } from '@tabler/icons-react';
import { usePermissions } from '@/components/dashboard/permissions/context/permissions-context';
import { Role } from '../data/schema';
import { permissionsApi } from '@/api-client';
import { rolesApi } from '@/api-client';
import { useQueryClient } from '@tanstack/react-query';
import { useLanguage } from '@/contexts/language-context';

const formSchema = z.object({
  name: z.string().min(1, 'Tên vai trò không được để trống'),
  description: z.string().min(1, 'Mô tả không được để trống'),
  active: z.boolean().default(true),
  permissionIds: z.array(z.string()).min(1, 'Phải chọn ít nhất một quyền'),
});

type FormValues = z.infer<typeof formSchema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentRow: Role | null;
}

interface GroupedPermissions {
  [key: string]: {
    permissionId: string;
    name: string;
    apiPath: string;
    httpMethod: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    module: string;
    createdAt: string;
    updatedAt: string;
    createdBy: string;
  }[];
}

export function RolesFormDialog({ open, onOpenChange, currentRow }: Props) {
  const { permissions: allPermissions } = usePermissions();
  const { updateRole, createRole, handleCloseDialog, fetchRoles } = useRoles();
  const queryClient = useQueryClient();
  const isEdit = !!currentRow;
  const [isLoading, setIsLoading] = useState(false);
  const [openModules, setOpenModules] = useState<Record<string, boolean>>({});
  const dialogRef = useRef<HTMLDivElement>(null);
  const { t } = useLanguage();

  // State để lưu permissions ban đầu
  const [initialPermissions, setInitialPermissions] = useState<string[]>([]);
  const [groupedPermissions, setGroupedPermissions] =
    useState<GroupedPermissions>({});

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      active: true,
      permissionIds: [],
    },
  });

  // Reset form khi mở dialog và có currentRow
  useEffect(() => {
    if (open && currentRow) {
      const currentPermissions = currentRow.permissions.map(
        (p) => p.permissionId
      );
      form.reset({
        name: currentRow.name,
        description: currentRow.description,
        active: currentRow.active,
        permissionIds: currentPermissions,
      });
      setInitialPermissions(currentPermissions);
    } else if (!open) {
      // Reset form khi đóng dialog
      form.reset({
        name: '',
        description: '',
        active: true,
        permissionIds: [],
      });
      setInitialPermissions([]);
    }
  }, [open, currentRow, form]);

  const handleClose = useCallback(() => {
    // Reset form trước khi đóng
    form.reset({
      name: '',
      description: '',
      active: true,
      permissionIds: [],
    });
    setInitialPermissions([]);
    setOpenModules({});

    // Đóng dialog thông qua prop onOpenChange
    onOpenChange(false);

    // Gọi handleCloseDialog để reset state trong context
    setTimeout(() => {
      handleCloseDialog();
    }, 100);
  }, [form, handleCloseDialog, onOpenChange]);

  const onSubmit = async (data: FormValues) => {
    try {
      if (isEdit && currentRow) {
        // Logic update role
        const updatedData: {
          name?: string;
          description?: string;
          active?: boolean;
        } = {};

        // Chỉ cập nhật những field đã thay đổi
        if (data.name !== currentRow.name) {
          updatedData.name = data.name;
        }
        if (data.description !== currentRow.description) {
          updatedData.description = data.description;
        }
        if (data.active !== currentRow.active) {
          updatedData.active = data.active;
        }

        const hasChanges = Object.keys(updatedData).length > 0;

        // Xử lý permissions bị thay đổi
        const currentPermissionIds = currentRow.permissions.map(
          (p) => p.permissionId
        );
        const addedPermissions = data.permissionIds.filter(
          (id) => !currentPermissionIds.includes(id)
        );
        const removedPermissions = currentPermissionIds.filter(
          (id) => !data.permissionIds.includes(id)
        );

        // Xử lý riêng cho từng loại thay đổi
        if (addedPermissions.length > 0) {
          // Thêm permissions mới vào role
          await rolesApi.updateRole(currentRow.roleId, {
            permissionIds: addedPermissions,
          });
        }

        if (removedPermissions.length > 0) {
          // Xóa permissions khỏi role
          await rolesApi.removePermissions(
            currentRow.roleId,
            removedPermissions
          );
        }

        // Nếu không có gì thay đổi, đóng dialog
        if (
          !hasChanges &&
          addedPermissions.length === 0 &&
          removedPermissions.length === 0
        ) {
          onOpenChange(false);
          return;
        }

        // Gọi API cập nhật thông tin cơ bản của role
        if (Object.keys(updatedData).length > 0) {
          await updateRole(currentRow.roleId, updatedData);
        }

        // Đảm bảo dữ liệu được cập nhật sau khi thay đổi
        queryClient.invalidateQueries({ queryKey: ['roles'] });

        toast({
          title: 'Thành công',
          description: 'Cập nhật vai trò thành công',
        });
      } else {
        // Logic create role
        await createRole({
          name: data.name,
          description: data.description,
          active: data.active,
          permissionIds: data.permissionIds,
        });
        toast({
          title: 'Thành công',
          description: 'Tạo vai trò mới thành công',
        });
      }
      handleClose();
    } catch (error) {
      console.error('Submit error:', error);
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: error instanceof Error ? error.message : 'Có lỗi xảy ra',
      });
    }
  };

  // Fetch permissions
  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        setIsLoading(true);
        const response = await permissionsApi.getPermissions({
          page: 1,
          size: 100,
        });
        setIsLoading(false);
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Có lỗi xảy ra',
          description: 'Không thể tải danh sách quyền. Vui lòng thử lại sau.',
        });
        setIsLoading(false);
      }
    };

    if (open) {
      fetchPermissions();
    }
  }, [open]);

  // Group permissions by module
  useEffect(() => {
    const grouped = allPermissions.reduce((acc, permission) => {
      const module = permission.module ?? 'Other';
      if (!acc[module]) {
        acc[module] = [];
      }
      acc[module].push(permission);
      return acc;
    }, {} as GroupedPermissions);
    setGroupedPermissions(grouped);
  }, [allPermissions]);

  const handleModulePermissionChange = (module: string, checked: boolean) => {
    const currentPermissions = form.getValues('permissionIds');
    const modulePermissionIds = groupedPermissions[module].map(
      (p) => p.permissionId
    );

    if (checked) {
      // Add all permissions in module
      const newPermissions = Array.from(
        new Set([...currentPermissions, ...modulePermissionIds])
      );
      form.setValue('permissionIds', newPermissions);
    } else {
      // Remove all permissions in module
      const newPermissions = currentPermissions.filter(
        (id) => !modulePermissionIds.includes(id)
      );
      form.setValue('permissionIds', newPermissions);
    }
  };

  const handlePermissionChange = (
    module: string,
    permissionId: string,
    checked: boolean
  ) => {
    const currentPermissions = form.getValues('permissionIds');

    if (checked) {
      form.setValue('permissionIds', [...currentPermissions, permissionId]);
    } else {
      form.setValue(
        'permissionIds',
        currentPermissions.filter((id) => id !== permissionId)
      );
    }
  };

  const toggleModule = (module: string) => {
    setOpenModules((prev) => ({
      ...prev,
      [module]: !prev[module],
    }));
  };

  const isModuleChecked = (modulePermissions: Permission[]) => {
    const currentPermissions = form.getValues('permissionIds');
    return modulePermissions.every((p) =>
      currentPermissions.includes(p.permissionId)
    );
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(newOpen) => {
        if (!newOpen) {
          handleClose();
        }
      }}
    >
      <DialogContent
        ref={dialogRef}
        className="max-w-2xl h-[90vh] p-0 flex flex-col bg-white dark:bg-zinc-800 rounded-lg shadow-lg"
        onPointerDownOutside={(e) => {
          e.preventDefault();
        }}
        onEscapeKeyDown={(e) => {
          e.preventDefault();
        }}
        onFocusOutside={(e) => {
          e.preventDefault();
        }}
        onInteractOutside={(e) => {
          e.preventDefault();
        }}
      >
        <DialogHeader className="px-6 py-4 border-b bg-slate-50 dark:bg-zinc-700 flex-none">
          <DialogTitle className="text-xl font-semibold text-slate-900 dark:text-slate-100">
            {isEdit ? t('editRole') : t('addNewRole')}
          </DialogTitle>
          <DialogDescription className="text-sm text-slate-500 dark:text-slate-100">
            {isEdit ? t('editRoleDesc') : t('addNewRoleDesc')}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="px-6 py-4 space-y-6">
                {/* Basic Info Section */}
                <div className="space-y-4 p-4 bg-white dark:text-slate-100 dark:bg-zinc-800 dark:border-slate-600  rounded-lg border border-slate-200 shadow-sm">
                  <h3 className="text-sm font-medium text-slate-900 dark:text-slate-300 mb-3">
                    {t('basicInfo')}
                  </h3>

                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-slate-700 dark:text-slate-100">
                          {t('roleName')}
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder={t('enterRoleName')}
                            className="bg-white dark:text-slate-100 dark:bg-zinc-800 dark:border-slate-600 border-slate-200 focus:border-slate-300 focus:ring-slate-300"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className="text-xs text-red-500" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-slate-700 dark:text-slate-100">
                          {t('description')}
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder={t('enterRoleDescription')}
                            className="bg-white dark:text-slate-100 dark:bg-zinc-800 dark:border-slate-600 resize-none min-h-[100px] border-slate-200 focus:border-slate-300 focus:ring-slate-300"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className="text-xs text-red-500" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="active"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-lg bg-slate-50 dark:bg-zinc-700 dark:border-slate-700 p-4 border border-slate-200">
                        <div className="space-y-1">
                          <FormLabel className="text-sm font-medium text-slate-700 dark:text-slate-100">
                            {t('status')}
                          </FormLabel>
                          <div className="text-sm text-slate-900 dark:text-slate-200">
                            {t('role')}{' '}
                            {field.value ? t('active') : t('inactive')}
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

                {/* Permissions Section */}
                <FormField
                  control={form.control}
                  name="permissionIds"
                  render={({ field }) => (
                    <FormItem className="space-y-4">
                      <div className="flex items-center justify-between">
                        <FormLabel className="text-base font-semibold text-slate-900 dark:text-slate-300">
                          {t('permissions')}
                        </FormLabel>
                      </div>
                      <FormControl>
                        <div className="space-y-2">
                          {isLoading ? (
                            <div className="flex items-center justify-center py-8">
                              <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                            </div>
                          ) : (
                            Object.entries(groupedPermissions).map(
                              ([module, modulePermissions]) => (
                                <Collapse
                                  key={module}
                                  open={openModules[module]}
                                  onOpenChange={() => toggleModule(module)}
                                >
                                  <div className="w-full rounded-t-lg border bg-white dark:text-slate-100 dark:bg-zinc-800 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors px-4 py-3">
                                    <div className="flex items-center justify-between w-full">
                                      <CollapseTrigger className="flex items-center gap-3">
                                        <IconChevronRight
                                          className={cn(
                                            'h-4 w-4 shrink-0 transition-transform duration-200 text-slate-900 dark:text-slate-300',
                                            openModules[module] && 'rotate-90'
                                          )}
                                        />
                                        <span className="text-sm font-medium text-slate-900 dark:text-slate-300 border-b-slate-900">
                                          {module}
                                        </span>
                                      </CollapseTrigger>
                                      <Switch
                                        checked={isModuleChecked(
                                          modulePermissions
                                        )}
                                        onCheckedChange={(checked) =>
                                          handleModulePermissionChange(
                                            module,
                                            checked
                                          )
                                        }
                                        className="data-[state=checked]:bg-slate-900 data-[state=unchecked]:bg-slate-100 data-[state=unchecked]:border-slate-300"
                                      />
                                    </div>
                                  </div>
                                  <CollapseContent className="divide-y divide-slate-100 border-x border-b rounded-b-lg bg-white dark:text-slate-100 dark:bg-zinc-800 dark:border-slate-600">
                                    {modulePermissions.map((permission) => (
                                      <div
                                        key={permission.permissionId}
                                        className="flex items-center justify-between px-6 py-3 hover:bg-slate-50 dark:hover:bg-slate-600  transition-colors"
                                      >
                                        <div className="flex flex-col gap-1">
                                          <span className="text-sm font-medium text-slate-700 dark:text-slate-100">
                                            {permission.name}
                                          </span>
                                          <span className="text-xs text-slate-900 dark:text-slate-300">
                                            {permission.apiPath} (
                                            {permission.httpMethod})
                                          </span>
                                        </div>
                                        <Switch
                                          checked={field.value.includes(
                                            permission.permissionId
                                          )}
                                          onCheckedChange={(checked) => {
                                            handlePermissionChange(
                                              module,
                                              permission.permissionId,
                                              checked
                                            );
                                          }}
                                          className="data-[state=checked]:bg-slate-900 data-[state=unchecked]:bg-slate-100 data-[state=unchecked]:border-slate-300"
                                        />
                                      </div>
                                    ))}
                                  </CollapseContent>
                                </Collapse>
                              )
                            )
                          )}
                        </div>
                      </FormControl>
                      <FormMessage className="text-xs text-red-500" />
                    </FormItem>
                  )}
                />
              </div>

              {/* Footer */}
              <div className="flex justify-end gap-4 px-6 py-4 border-t dark:bg-zinc-700 bg-slate-50 sticky bottom-0">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  className="border-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600 "
                >
                  {t('cancel')}
                </Button>
                <Button
                  type="submit"
                  className="bg-slate-900 hover:bg-slate-600 dark:hover:bg-slate-600  text-white "
                >
                  {isEdit ? t('update') : t('add')}
                </Button>
              </div>
            </form>
          </Form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
