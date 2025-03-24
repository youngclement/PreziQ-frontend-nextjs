import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { API_URL, ACCESS_TOKEN } from '@/api/http';
import { Permission } from '../data/schema';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { IconChevronRight } from '@tabler/icons-react';
import { usePermissions } from '@/components/dashboard/permissions/context/permissions-context';
import { Role } from '../data/schema';
import { Checkbox } from '@/components/ui/checkbox';

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
  [key: string]: Permission[];
}

export function RolesFormDialog({ open, onOpenChange, currentRow }: Props) {
  const { permissions: allPermissions } = usePermissions();
  const { updateRole, deleteRolePermissions, createRole } = useRoles();
  const isEdit = !!currentRow;
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [openModules, setOpenModules] = useState<Record<string, boolean>>({});

  // State để theo dõi các trường thay đổi
  const [changedFields, setChangedFields] = useState<{
    name?: string;
    description?: string;
    active?: boolean;
    permissionIds?: string[];
  }>({});

  // State để lưu permissions ban đầu
  const [initialPermissions, setInitialPermissions] = useState<string[]>([]);
  const [groupedPermissions, setGroupedPermissions] =
    useState<GroupedPermissions>({});

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: currentRow?.name || '',
      description: currentRow?.description || '',
      active: currentRow?.active ?? true,
      permissionIds: currentRow?.permissions.map((p) => p.id) || [],
    },
  });

  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`${API_URL}/permissions?page=1&size=100`, {
          headers: {
            Authorization: `Bearer ${ACCESS_TOKEN}`,
          },
        });
        const data = await response.json();
        if (data.data?.content) {
          setPermissions(data.data.content);
        }
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Có lỗi xảy ra',
          description: 'Không thể tải danh sách quyền. Vui lòng thử lại sau.',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchPermissions();
  }, []);

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

  // Reset form và state khi dialog mở/đóng
  useEffect(() => {
    if (currentRow) {
      const currentPermissions = currentRow.permissions.map((p) => p.id);
      form.reset({
        name: currentRow.name,
        description: currentRow.description,
        active: currentRow.active,
        permissionIds: currentPermissions,
      });
      setInitialPermissions(currentPermissions);
    }
  }, [currentRow, form]);

  const handleModulePermissionChange = (module: string, checked: boolean) => {
    const currentPermissions = form.getValues('permissionIds');
    const modulePermissionIds = groupedPermissions[module].map((p) => p.id);

    if (checked) {
      // Add all permissions in module
      const newPermissions = Array.from(
        new Set([...currentPermissions, ...modulePermissionIds]),
      );
      form.setValue('permissionIds', newPermissions);
    } else {
      // Remove all permissions in module
      const newPermissions = currentPermissions.filter(
        (id) => !modulePermissionIds.includes(id),
      );
      form.setValue('permissionIds', newPermissions);
    }
  };

  const handlePermissionChange = (
    module: string,
    permissionId: string,
    checked: boolean,
  ) => {
    const currentPermissions = form.getValues('permissionIds');

    if (checked) {
      form.setValue('permissionIds', [...currentPermissions, permissionId]);
    } else {
      form.setValue(
        'permissionIds',
        currentPermissions.filter((id) => id !== permissionId),
      );
    }
  };

  const onSubmit = async (data: FormValues) => {
    try {
      if (isEdit && currentRow) {
        // Logic update role
        const updatedData: {
          name?: string;
          description?: string;
          active?: boolean;
          permissionIds?: string[];
        } = {};

        if (data.name !== currentRow.name) {
          updatedData.name = data.name;
        }
        if (data.description !== currentRow.description) {
          updatedData.description = data.description;
        }
        if (data.active !== currentRow.active) {
          updatedData.active = data.active;
        }

        // Calculate added and removed permissions
        const addedPermissions = data.permissionIds.filter(
          (id) => !initialPermissions.includes(id),
        );
        const removedPermissions = initialPermissions.filter(
          (id) => !data.permissionIds.includes(id),
        );

        if (removedPermissions.length > 0) {
          await deleteRolePermissions(currentRow.id, removedPermissions);
        }

        if (
          Object.keys(updatedData).length > 0 ||
          addedPermissions.length > 0
        ) {
          if (addedPermissions.length > 0) {
            updatedData.permissionIds = addedPermissions;
          }
          await updateRole(currentRow.id, updatedData);
        }
      } else {
        // Logic create role
        await createRole({
          name: data.name,
          description: data.description,
          active: data.active,
          permissionIds: data.permissionIds,
        });
      }

      onOpenChange(false);
    } catch (error) {
      console.error('Submit error:', error);
    }
  };

  // Reset form khi dialog đóng
  useEffect(() => {
    if (!open) {
      form.reset();
    }
  }, [open, form]);

  const toggleModule = (module: string) => {
    setOpenModules((prev) => ({
      ...prev,
      [module]: !prev[module],
    }));
  };

  const isModuleChecked = (modulePermissions: Permission[]) => {
    const currentPermissions = form.getValues('permissionIds');
    return modulePermissions.every((p) => currentPermissions.includes(p.id));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? 'Chỉnh sửa vai trò' : 'Thêm vai trò mới'}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[80vh]">
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-6 p-6"
            >
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tên vai trò</FormLabel>
                      <FormControl>
                        <Input placeholder="Nhập tên vai trò" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mô tả</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Nhập mô tả cho vai trò"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="active"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel>Trạng thái</FormLabel>
                        <div className="text-sm text-muted-foreground">
                          Vai trò{' '}
                          {field.value ? 'đang hoạt động' : 'đã bị vô hiệu hóa'}
                        </div>
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

                <FormField
                  control={form.control}
                  name="permissionIds"
                  render={({ field }) => (
                    <FormItem>
                      <div className="mt-6 mb-4">
                        <FormLabel className="text-base">Quyền hạn</FormLabel>
                      </div>
                      <FormControl>
                        <div className="space-y-2">
                          {isLoading ? (
                            <div className="flex items-center justify-center py-4">
                              <Loader2 className="h-6 w-6 animate-spin" />
                            </div>
                          ) : (
                            Object.entries(groupedPermissions).map(
                              ([module, modulePermissions]) => (
                                <Collapse
                                  key={module}
                                  open={openModules[module]}
                                  onOpenChange={() => toggleModule(module)}
                                >
                                  <CollapseTrigger className="w-full rounded-lg border bg-white px-4 py-2">
                                    <div className="flex items-center justify-between w-full">
                                      <div className="flex items-center gap-2">
                                        <IconChevronRight
                                          className={cn(
                                            'h-4 w-4 shrink-0 transition-transform duration-200',
                                            openModules[module] && 'rotate-90',
                                          )}
                                        />
                                        <span className="text-sm font-medium">
                                          {module}
                                        </span>
                                      </div>
                                      <Switch
                                        checked={isModuleChecked(
                                          modulePermissions,
                                        )}
                                        onCheckedChange={(checked) =>
                                          handleModulePermissionChange(
                                            module,
                                            checked,
                                          )
                                        }
                                        onClick={(e) => e.stopPropagation()}
                                      />
                                    </div>
                                  </CollapseTrigger>
                                  <CollapseContent className="divide-y divide-gray-100 border-x border-b rounded-b-lg">
                                    {modulePermissions.map((permission) => (
                                      <div
                                        key={permission.id}
                                        className="flex items-center justify-between px-4 py-2"
                                      >
                                        <div className="flex flex-col">
                                          <span className="text-sm font-medium text-gray-700 max-w-sm truncate">
                                            {permission.name}
                                          </span>
                                        </div>
                                        <Switch
                                          checked={field.value.includes(
                                            permission.id,
                                          )}
                                          onCheckedChange={(checked) => {
                                            handlePermissionChange(
                                              module,
                                              permission.id,
                                              checked,
                                            );
                                          }}
                                        />
                                      </div>
                                    ))}
                                  </CollapseContent>
                                </Collapse>
                              ),
                            )
                          )}
                        </div>
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end pt-4">
                <Button type="submit">
                  {isEdit ? 'Cập nhật' : 'Thêm mới'}
                </Button>
              </div>
            </form>
          </Form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
