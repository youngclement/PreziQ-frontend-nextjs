'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { authApi } from '@/api-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm();

  useEffect(() => {
    if (!token) {
      toast({ variant: 'destructive', title: 'Token không hợp lệ' });
    }
  }, [token]);

  const onSubmit = async (data: {
    newPassword: string;
    confirmPassword: string;
  }) => {
    if (!token) {
      toast({ variant: 'destructive', title: 'Token không hợp lệ' });
      return;
    }

    setIsLoading(true);
    try {
      const res = await authApi.resetPassword({
        token,
        newPassword: data.newPassword,
        confirmPassword: data.confirmPassword,
      });

      toast({ title: res.data.message });
      router.push('/auth');

    } catch (error: any) {
      const errorMessages = error.response?.data?.errors || [];
      console.log('Error', error.response.data.message);

      const errorMap: Record<number, 'newPassword' | 'confirmPassword'> = {
        1105: 'newPassword',
        1118: 'newPassword',
        1119: 'confirmPassword',
        1120: 'confirmPassword',
        1123: 'confirmPassword',
      };

      errorMessages.forEach((err: any) => {
        const field = errorMap[err.code];
        if (field) {
          setError(field, { type: 'server', message: err.message });
        } else {
          toast({
            variant: 'destructive',
            title: 'Lỗi',
            description: err.message,
          });
        }
      });
      toast({
        variant: 'destructive',
        title: 'Lỗi',
        description: error.response.data.message,
      });
    } finally {
      setIsLoading(false);
    }
    
  };

  return (
    <div className="flex min-h-screen min-w-full items-center justify-center p-4">
      <Card className="w-full max-w-lg shadow-lg">
        <CardHeader>
          <CardTitle className="text-center text-xl font-bold">
            Đặt lại mật khẩu
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2 w-full">
              <Label htmlFor="newPassword">Mật khẩu mới</Label>
              <Input
                id="newPassword"
                type="password"
                {...register('newPassword', {
                  required: 'Mật khẩu mới không được để trống',
                })}
                className=""
              />
              {errors.newPassword && (
                <p className="text-red-500 text-sm">
                  {errors.newPassword.message as string}
                </p>
              )}
            </div>

            <div className="space-y-2 w-full">
              <Label htmlFor="confirmPassword">Xác nhận mật khẩu</Label>
              <Input
                id="confirmPassword"
                type="password"
                {...register('confirmPassword', {
                  required: 'Xác nhận mật khẩu không được để trống',
                })}
              />
              {errors.confirmPassword && (
                <p className="text-red-500 text-sm">
                  {errors.confirmPassword.message as string}
                </p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Đang xử lý...' : 'Cập nhật mật khẩu'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
