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
import { Loader2 } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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

interface UserEmailFormProps {
  email: string;
}

export function UserEmailForm({ email }: UserEmailFormProps) {
  const { t } = useLanguage();

  // Schema validation với đa ngôn ngữ
  const emailFormSchema = z.object({
    email: z
      .string()
      .min(1, t('profile.emailRequired'))
      .email(t('profile.emailInvalid')),
  });

  type EmailFormValues = z.infer<typeof emailFormSchema>;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const form = useForm<EmailFormValues>({
    resolver: zodResolver(emailFormSchema),
    defaultValues: {
      email: email,
    },
  });

  async function onSubmit(data: EmailFormValues) {
    try {
      setIsSubmitting(true);

      // Kiểm tra nếu email mới giống email hiện tại
      if (data.email === email) {
        sonnerToast.warning(t('profile.emailMustBeDifferent'));
        return;
      }

      // Gọi API cập nhật email
      const response = (await userApi.updateEmail({
        newEmail: data.email,
      })) as unknown as ApiResponseWrapper;

      // Kiểm tra response success
      if (response?.data?.success) {
        // Lưu message từ API
        setSuccessMessage(response.data.message);
        // Hiển thị dialog thông báo thành công
        setShowSuccessDialog(true);
        // Reset form về email hiện tại
        form.reset({
          email: email,
        });
      }
    } catch (error: any) {
      console.error('Lỗi khi cập nhật email:', error);

      sonnerToast.error(
        error.message ||
          error.errors?.[0]?.message ||
          t('profile.cannotUpdateEmail')
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <Card className='border-0 shadow-none'>
        <CardHeader className='space-y-1'>
          <CardTitle className='text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent'>
            {t('profile.updateEmailTitle')}
          </CardTitle>
          <CardDescription className='text-base'>
            {t('profile.updateEmailDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
              <div className='space-y-4'>
                <div className='p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg'>
                  <p className='text-sm text-gray-600 dark:text-gray-400'>
                    {t('profile.currentEmail')}:
                  </p>
                  <p className='text-base font-medium text-gray-900 dark:text-white'>
                    {email}
                  </p>
                </div>

                <FormField
                  control={form.control}
                  name='email'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className='text-sm font-medium text-gray-700 dark:text-gray-300'>
                        {t('profile.newEmail')}
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type='email'
                          className='transition-all duration-200 focus:ring-2 focus:ring-primary/20 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
                          placeholder={t('profile.newEmailPlaceholder')}
                        />
                      </FormControl>
                      <FormMessage className='text-xs text-red-500 dark:text-red-400' />
                    </FormItem>
                  )}
                />
              </div>

              <div className='flex justify-end'>
                <Button
                  type='submit'
                  disabled={isSubmitting}
                  className='min-w-[120px] transition-all duration-200 hover:shadow-lg hover:shadow-primary/20 bg-primary hover:bg-primary/90'
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                      {t('profile.sending')}
                    </>
                  ) : (
                    t('profile.sendRequest')
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className='sm:max-w-md'>
          <DialogHeader>
            <DialogTitle className='text-xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent'>
              {t('profile.checkYourEmail')}
            </DialogTitle>
            <DialogDescription className='text-base'>
              {successMessage}
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </>
  );
}
