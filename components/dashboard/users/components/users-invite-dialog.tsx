'use client';

import { useUsers } from '../context/users-context';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
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
import { usersApi } from '@/api-client';
import { toast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/language-context';

const formSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
  firstName: z.string().min(1, 'Vui lòng nhập tên'),
  lastName: z.string().min(1, 'Vui lòng nhập họ'),
});

type UserForm = z.infer<typeof formSchema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UsersInviteDialog({ open, onOpenChange }: Props) {
  const { refetch } = useUsers();
  const { t } = useLanguage();

  const form = useForm<UserForm>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      firstName: '',
      lastName: '',
    },
  });

  const onSubmit = async (values: UserForm) => {
    try {
      // Sử dụng API inviteUser cho chức năng mời người dùng
      const response = await usersApi.inviteUser(values);

      if (response.data.success) {
        toast({
          title: 'Thành công',
          description: 'Đã gửi lời mời thành công',
        });
        refetch(); // Cập nhật lại danh sách user
        onOpenChange(false);
        form.reset();
      } else {
        toast({
          title: 'Lỗi',
          description: response.data.message || 'Không thể gửi lời mời',
          variant: 'destructive',
        });
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Không thể gửi lời mời';
      toast({
        title: 'Lỗi',
        description: message,
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t('userManagement.inviteUser')}</DialogTitle>
          <DialogDescription>
            {t('userManagement.description')}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('userManagement.columns.email')}</FormLabel>
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
                  <FormLabel>{t('userManagement.columns.firstName')}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t('userManagement.columns.firstName')}
                      {...field}
                    />
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
                  <FormLabel>{t('userManagement.columns.lastName')}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t('userManagement.columns.lastName')}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit">{t('userManagement.inviteUser')}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
