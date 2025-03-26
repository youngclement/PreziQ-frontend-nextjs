import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { httpMethods, modules } from '../data/data';
import { Permission } from '../data/schema';
import { API_URL, ACCESS_TOKEN } from '@/api-mock/http';
import { toast } from 'react-toastify';
import { usePermissions } from '@/components/dashboard/permissions/context/permissions-context';

// Schema cho form thêm mới
const addPermissionSchema = z.object({
  name: z.string().min(1, 'Tên permission là bắt buộc'),
  apiPath: z.string().min(1, 'API path là bắt buộc'),
  httpMethod: z.string().min(1, 'HTTP method là bắt buộc'),
  module: z.string().nullable(),
});

// Schema cho form chỉnh sửa - tất cả field đều optional
const editPermissionSchema = z.object({
  name: z.string().optional(),
  apiPath: z.string().optional(),
  httpMethod: z.string().optional(),
  module: z.string().nullable(),
});

interface PermissionsFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentRow?: Permission | null;
}

const getMethodLabel = (value: string) => {
  const method = httpMethods.find((m) => m.value === value);
  return method ? method.label : value;
};

export function PermissionsFormDialog({
  open,
  onOpenChange,
  currentRow,
}: PermissionsFormDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [availableModules, setAvailableModules] = useState<string[]>([]);
  const { refetch } = usePermissions();

  const isEditMode = !!currentRow;
  const schema = isEditMode ? editPermissionSchema : addPermissionSchema;

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: currentRow?.name || '',
      apiPath: currentRow?.apiPath || '',
      httpMethod: currentRow?.httpMethod || '',
      module: currentRow?.module || null,
    },
  });

  // Reset form khi currentRow thay đổi
  useEffect(() => {
    if (currentRow) {
      form.reset({
        name: currentRow.name,
        apiPath: currentRow.apiPath,
        httpMethod: currentRow.httpMethod,
        module: currentRow.module,
      });
    }
  }, [currentRow, form]);

  // Fetch modules khi dialog mở
  useEffect(() => {
    if (open) {
      fetchModules();
    }
  }, [open]);

  const fetchModules = async () => {
    try {
      const response = await fetch(`${API_URL}/permissions/modules`, {
        headers: {
          Authorization: `Bearer ${ACCESS_TOKEN}`,
        },
      });

      if (!response.ok) {
        toast.error('Không thể tải danh sách modules');
        return;
      }

      const data = await response.json();
      setAvailableModules(Array.isArray(data.data) ? data.data : []);
    } catch (error) {
      console.error('Error fetching modules:', error);
      toast.error('Không thể tải danh sách modules');
      setAvailableModules([]);
    }
  };

  const onSubmit = async (values: z.infer<typeof schema>) => {
    setIsLoading(true);
    try {
      // Xử lý payload
      let payload = { ...values };

      // Xử lý trường module
      if (payload.module === 'none') {
        payload.module = null;
      }

      // Trong trường hợp edit
      if (isEditMode && currentRow) {
        // Chỉ gửi những field đã thay đổi
        const changedFields = Object.entries(payload).reduce(
          (acc, [key, value]) => {
            if (value !== currentRow[key as keyof Permission]) {
              acc[key] = value;
            }
            return acc;
          },
          {} as Record<string, any>
        );

        // Nếu module không thay đổi, thêm lại giá trị module ban đầu
        if (!('module' in changedFields)) {
          changedFields.module = currentRow.module;
        }

        payload = {
          ...changedFields,
          module: changedFields.module ?? currentRow.module,
        };

        // Nếu không có thay đổi gì, đóng dialog
        if (
          Object.keys(changedFields).length === 1 &&
          'module' in changedFields
        ) {
          onOpenChange(false);
          return;
        }
      }

      const response = await fetch(
        `${API_URL}/permissions${currentRow ? `/${currentRow.id}` : ''}`,
        {
          method: currentRow ? 'PATCH' : 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${ACCESS_TOKEN}`,
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.message || 'Có lỗi xảy ra');
        return;
      }

      toast.success(data.message);
      await refetch();
      onOpenChange(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Có lỗi xảy ra';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {currentRow ? 'Chỉnh sửa' : 'Thêm'} Permission
          </DialogTitle>
          <DialogDescription>
            {currentRow
              ? 'Chỉnh sửa thông tin permission hiện tại.'
              : 'Thêm một permission mới vào hệ thống.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
            <FormField
              control={form.control}
              name='name'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tên Permission</FormLabel>
                  <FormControl>
                    <Input placeholder='Nhập tên permission' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='apiPath'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>API Path</FormLabel>
                  <FormControl>
                    <Input placeholder='Nhập API path' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='httpMethod'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>HTTP Method</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue>
                          {field.value ? field.value : 'Chọn HTTP method'}
                        </SelectValue>
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {httpMethods.map((method) => (
                        <SelectItem key={method.value} value={method.value}>
                          {method.label}
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
              name='module'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Module</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value || 'none'}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder='Chọn module' />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value='none'>
                        Không thuộc module nào
                      </SelectItem>
                      {availableModules.map((module) => (
                        <SelectItem key={module} value={module}>
                          {module}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className='flex justify-end gap-2'>
              <Button
                type='button'
                variant='outline'
                onClick={() => onOpenChange(false)}
              >
                Hủy
              </Button>
              <Button type='submit' disabled={isLoading}>
                {isLoading ? 'Đang xử lý...' : currentRow ? 'Cập nhật' : 'Tạo'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
