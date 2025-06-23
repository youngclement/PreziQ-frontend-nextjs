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
import { useLanguage } from '@/contexts/language-context';

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
  const { t } = useLanguage();
  const router = useRouter();
  const { logout } = useAuth();

  // Schema validation với đa ngôn ngữ
  const passwordFormSchema = z
    .object({
      currentPassword: z.string().min(6, t('profile.currentPasswordRequired')),
      newPassword: z
        .string()
        .min(8, t('profile.newPasswordRequired'))
        .regex(
          /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
          t('profile.passwordComplexity')
        ),
      confirmPassword: z.string().min(8, t('profile.confirmPasswordRequired')),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
      message: t('profile.passwordMismatch'),
      path: ['confirmPassword'],
    });

  type PasswordFormValues = z.infer<typeof passwordFormSchema>;

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
          title: t('common.success'),
          description: t('profile.passwordUpdateSuccess'),
        });

        // Log out and redirect to login page
        await logout();
        router.push('/auth/login');
      }
    } catch (error: any) {
      console.error('Lỗi khi cập nhật mật khẩu:', error);

      sonnerToast.error(
        error.message ||
          error.errors?.[0]?.message ||
          t('profile.cannotUpdatePassword')
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card className='border-0 shadow-none'>
      <CardHeader className='space-y-1'>
        <CardTitle className='text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent'>
          {t('profile.passwordTitle')}
        </CardTitle>
        <CardDescription className='text-base'>
          {t('profile.passwordDescription')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
            <FormField
              control={form.control}
              name='currentPassword'
              render={({ field }) => (
                <FormItem>
                  <FormLabel className='text-sm font-medium text-gray-700 dark:text-gray-300'>
                    {t('profile.currentPassword')}
                  </FormLabel>
                  <FormControl>
                    <div className='relative'>
                      <Input
                        {...field}
                        type={showCurrentPassword ? 'text' : 'password'}
                        className='transition-all duration-200 focus:ring-2 focus:ring-primary/20 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 pr-10'
                        placeholder={t('profile.currentPasswordPlaceholder')}
                      />
                      <Button
                        type='button'
                        variant='ghost'
                        size='icon'
                        className='absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent'
                        onClick={() =>
                          setShowCurrentPassword(!showCurrentPassword)
                        }
                      >
                        {showCurrentPassword ? (
                          <EyeOff className='h-4 w-4 text-gray-500 dark:text-gray-400' />
                        ) : (
                          <Eye className='h-4 w-4 text-gray-500 dark:text-gray-400' />
                        )}
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage className='text-xs text-red-500 dark:text-red-400' />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='newPassword'
              render={({ field }) => (
                <FormItem>
                  <FormLabel className='text-sm font-medium text-gray-700 dark:text-gray-300'>
                    {t('profile.newPassword')}
                  </FormLabel>
                  <FormControl>
                    <div className='relative'>
                      <Input
                        {...field}
                        type={showNewPassword ? 'text' : 'password'}
                        className='transition-all duration-200 focus:ring-2 focus:ring-primary/20 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 pr-10'
                        placeholder={t('profile.newPasswordPlaceholder')}
                      />
                      <Button
                        type='button'
                        variant='ghost'
                        size='icon'
                        className='absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent'
                        onClick={() => setShowNewPassword(!showNewPassword)}
                      >
                        {showNewPassword ? (
                          <EyeOff className='h-4 w-4 text-gray-500 dark:text-gray-400' />
                        ) : (
                          <Eye className='h-4 w-4 text-gray-500 dark:text-gray-400' />
                        )}
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage className='text-xs text-red-500 dark:text-red-400' />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='confirmPassword'
              render={({ field }) => (
                <FormItem>
                  <FormLabel className='text-sm font-medium text-gray-700 dark:text-gray-300'>
                    {t('profile.confirmNewPassword')}
                  </FormLabel>
                  <FormControl>
                    <div className='relative'>
                      <Input
                        {...field}
                        type={showConfirmPassword ? 'text' : 'password'}
                        className='transition-all duration-200 focus:ring-2 focus:ring-primary/20 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 pr-10'
                        placeholder={t('profile.confirmPasswordPlaceholder')}
                      />
                      <Button
                        type='button'
                        variant='ghost'
                        size='icon'
                        className='absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent'
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                      >
                        {showConfirmPassword ? (
                          <EyeOff className='h-4 w-4 text-gray-500 dark:text-gray-400' />
                        ) : (
                          <Eye className='h-4 w-4 text-gray-500 dark:text-gray-400' />
                        )}
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage className='text-xs text-red-500 dark:text-red-400' />
                </FormItem>
              )}
            />

            <div className='flex justify-end'>
              <Button
                type='submit'
                disabled={isSubmitting}
                className='min-w-[120px] transition-all duration-200 hover:shadow-lg hover:shadow-primary/20 bg-primary hover:bg-primary/90'
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                    {t('profile.updatingPassword')}
                  </>
                ) : (
                  t('profile.updatePassword')
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
