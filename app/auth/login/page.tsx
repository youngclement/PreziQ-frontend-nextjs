'use client';

import Link from 'next/link';
import { HeartHandshake, LucideChevronRight } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Logo from '@/components/common/logo';
import { authApi } from '@/api-client/auth-api';
import { useRouter } from 'next/navigation';
import { BodyLogin } from '@/models/auth';
import ForgotPasswordDialog from '@/app/auth/forgot-password/component';
import { useAuth } from '@/contexts/auth-context';
import { toast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
export default function LoginPage() {
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  useEffect(() => {
    setMounted(true);
  }, []);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setError,
    formState: { errors },
  } = useForm({
    defaultValues: {
      email: '',
      phoneNumber: '',
      password: '',
    },
  });

  const [loginMethod, setLoginMethod] = useState<'email' | 'phone'>('email');
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const { login } = useAuth();
  const [isResendDialogOpen, setIsResendDialogOpen] = useState(false);
  const [resendEmail, setResendEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  //     const { name, value } = e.target;
  //     setFormData(prev => ({
  //         ...prev,
  //         [name]: value
  //     }));
  // };

  const toggleLoginMethod = () => {
    setLoginMethod((prev) => (prev === 'email' ? 'phone' : 'email'));
    // Reset the values when switching
    reset({ email: '', phoneNumber: '', password: watch('password') });
  };

  const resendVerification = async (email: string) => {
    try {
      const res = await authApi.resendEmail(email);
      toast({
        title: 'Email xác thực đã được gửi!',
        description: res.data?.message,
      });
    } catch (error: any) {
      toast({
        title: 'Lỗi gửi lại xác thực!',
        description: error.response?.data?.message || 'Vui lòng thử lại.',
      });
    }
  };

  const onSubmit = async (data: BodyLogin) => {
    let payload: BodyLogin;

    if (data.email) {
      payload = { email: data.email, password: data.password };
    } else if (data.phoneNumber) {
      payload = { phoneNumber: data.phoneNumber, password: data.password };
    } else {
      console.error('Bạn phải nhập email hoặc số điện thoại!');
      return;
    }
    setIsLoading(true);
    try {
      const res = await authApi.login(payload);
      setIsLoading(false);
      toast({
        title: res?.data.message,
      });

      login(res?.data.data.accessToken);

      router.refresh();
      router.push('/');
    } catch (error: any) {
      console.log("err: ", error)
      setIsLoading(false);
      if (error.response && error.response.data) {
        const backendErrors = error.response.data.errors;

        backendErrors?.forEach((err: any) => {
          if (err.code === 1105) {
            setError('password', { type: 'server', message: err.message });
          } else if (err.code === 1111) {
            setError('phoneNumber', { type: 'server', message: err.message });
          } else if (err.code === 1103) {
            setError('email', { type: 'server', message: err.message });
          } else {
            //setError('email', { type: 'server', message: err.message });
            toast({
              variant: 'destructive',
              description: err.message,
            });
          }
        });
        if (error.response.data.code === 1116) {
          if (data.email) {
            setResendEmail(data.email);
            setIsResendDialogOpen(true);
          }
        } else if (error.response.data.code === 1201 || error.response.data.code === 1002) {
          // toast({
          //   variant: 'destructive',
          //   description: error.response.data.message,
          // });
        }

        setIsLoading(false);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // If not mounted yet, render a minimal placeholder to match server-side rendering
  if (!mounted) {
    return (
      <main className="flex items-center justify-center px-8 py-8 sm:px-12 lg:col-span-7 lg:px-16 lg:py-12 xl:col-span-6">
        <div className="max-w-xl lg:max-w-3xl">
          <div className="h-10 w-32"></div> {/* Logo placeholder */}
          <h1 className="mt-6 text-2xl font-bold sm:text-3xl md:text-4xl">
            Welcome Back
          </h1>
          <p className="mt-4 leading-relaxed">
            Sign in to your PreziQ account to continue creating and sharing
            amazing presentations.
          </p>
          {/* Form placeholder */}
          <div className="mt-8 grid grid-cols-6 gap-6"></div>
        </div>
      </main>
    );
  }

  return (
    <>
      <main className="flex items-center justify-center px-8 py-8 sm:px-12 lg:col-span-7 lg:px-16 lg:py-12 xl:col-span-6">
        <div className="max-w-xl lg:max-w-3xl">
          <Link className="block text-blue-600" href="/">
            <Logo />
          </Link>

          <h1 className="mt-6 text-2xl font-bold sm:text-3xl md:text-4xl flex items-center gap-4">
            Welcome Back <HeartHandshake className="size-6" />
          </h1>

          <p className="mt-4 leading-relaxed">
            Sign in to your PreziQ account to continue creating and sharing
            amazing presentations.
          </p>

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="mt-8 grid grid-cols-6 gap-6"
          >
            {loginMethod === 'email' ? (
              <div className="col-span-6">
                <Label htmlFor="email">Email</Label>
                <Input
                  type="email"
                  id="email"
                  {...register('email', { required: 'Email is required' })}
                  className="mt-1 w-full rounded-md shadow-sm"
                />
                {errors.email && (
                  <p className="text-red-500 text-sm mt-2">
                    {errors.email.message}
                  </p>
                )}
              </div>
            ) : (
              <div className="col-span-6">
                <Label htmlFor="phoneNumber">Phone Number</Label>
                <Input
                  type="tel"
                  id="phoneNumber"
                  {...register('phoneNumber', {
                    required: 'Phone number is required',
                  })}
                  className="mt-1 w-full rounded-md shadow-sm"
                  placeholder="e.g., 0886332809"
                  required
                />
                {errors.phoneNumber && (
                  <p className="text-red-500 text-sm mt-2">
                    {errors.phoneNumber.message}
                  </p>
                )}
              </div>
            )}

            <div className="col-span-6">
              <Label htmlFor="password">Password</Label>
              <Input
                type="password"
                id="password"
                {...register('password', { required: 'Password is required' })}
                className="mt-1 w-full rounded-md shadow-sm"
              />
              {errors.password && (
                <p className="text-red-500 text-sm mt-2">
                  {errors.password.message}
                </p>
              )}
            </div>

            <div className="col-span-6">
              <Button
                type="button"
                variant="link"
                className="p-0 h-auto text-sm"
                onClick={toggleLoginMethod}
              >
                Sign in with{' '}
                {loginMethod === 'email' ? 'phone number' : 'email'} instead
              </Button>
            </div>

            <div className="col-span-6 flex justify-between items-center">
              <Button type="submit" className="px-10" disabled={isLoading}>
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent"></span>
                    Signing in...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    Sign In
                    <LucideChevronRight className="h-4 w-4" />
                  </span>
                )}
              </Button>
              <button
                type="button"
                className="text-sm text-primary hover:underline"
                onClick={() => setIsForgotPasswordOpen(true)}
              >
                Forgot password?
              </button>
            </div>

            <div className="col-span-6 text-center mt-4">
              <p className="text-sm text-gray-500">
                Don't have an account?{' '}
                <Link href="/auth/register" className="underline text-primary">
                  Sign up
                </Link>
              </p>
            </div>
          </form>
        </div>
        <ForgotPasswordDialog
          isOpen={isForgotPasswordOpen}
          setIsOpen={setIsForgotPasswordOpen}
        />
      </main>
      <Dialog open={isResendDialogOpen} onOpenChange={setIsResendDialogOpen}>
        <DialogContent>
          <DialogTitle>Xác nhận gửi lại email</DialogTitle>
          <DialogDescription>
            Tài khoản của bạn chưa được xác thực. Bạn có muốn gửi lại email xác
            thực đến địa chỉ {resendEmail} không?
          </DialogDescription>
          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() => setIsResendDialogOpen(false)}
            >
              Hủy
            </Button>
            <Button
              onClick={() => {
                resendVerification(resendEmail);
                setIsResendDialogOpen(false);
              }}
            >
              Gửi lại
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
