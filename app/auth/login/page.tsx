'use client';

import Link from 'next/link';
import { HeartHandshake } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Logo from '@/components/common/logo';
import { authApi } from '@/api-client/auth-api';
import { useRouter } from 'next/navigation';
import { BodyLogin } from '@/models/auth';
import ForgotPasswordDialog from '@/app/auth/forgot-password/page';
import { useAuth } from '@/contexts/auth-context';
import { toast } from '@/hooks/use-toast';

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

    try {
      const res = await authApi.login(payload);

      toast({
        title: res.data.message,
      });

      login(res.data.data.accessToken);

      router.refresh();
      router.push('/');
    } catch (error: any) {
      console.log(error.response.data.code);
      if (error.response.data.code == 1116) {
        toast({
          title: error.response.data.message,
          action: (
            <button
              onClick={() => resendVerification(data.email)}
              className="text-blue-600 font-semibold"
            >
              Gửi lại xác thực
            </button>
          ),
        });
      }
      // const errorMessages =
      //   error.response?.data?.errors
      //     ?.map((err: any) => err.message)
      //     .join('\n') ||
      //   error.response?.data?.message ||
      //   'Đã xảy ra lỗi, vui lòng thử lại.';

      // toast({
      //   variant: 'destructive',
      //   title: 'Login Failed',
      //   description: errorMessages,
      // });
    } finally {
      //setIsLoading(false);
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
                <p className="text-red-500 text-sm">{errors.email.message}</p>
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
                <p className="text-red-500 text-sm">
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
              required
            />
            {errors.password && (
              <p className="text-red-500 text-sm">{errors.password.message}</p>
            )}
          </div>

          <div className="col-span-6">
            <Button
              type="button"
              variant="link"
              className="p-0 h-auto text-sm"
              onClick={toggleLoginMethod}
            >
              Sign in with {loginMethod === 'email' ? 'phone number' : 'email'}{' '}
              instead
            </Button>
          </div>

          <div className="col-span-6 flex justify-between items-center">
            <Button type="submit" className="px-10">
              Sign in
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
  );
}
