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
import { useLanguage } from '@/contexts/language-context';
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
  const { t } = useLanguage();

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

  const toggleLoginMethod = () => {
    setLoginMethod((prev) => (prev === 'email' ? 'phone' : 'email'));
    // Reset the values when switching
    reset({ email: '', phoneNumber: '', password: watch('password') });
  };

  const resendVerification = async (email: string) => {
    try {
      const res = await authApi.resendEmail(email);
      toast({
        title: t('login.verificationEmailSent'),
        description: res.data?.message,
      });
    } catch (error: any) {
      toast({
        title: t('login.resendVerificationError'),
        description: error.response?.data?.message || t('login.pleaseTryAgain'),
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
      console.error(t('login.youMustEnterEmailOrPhone'));
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
      console.log('err: ', error);
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
        } else if (
          error.response.data.code === 1201 ||
          error.response.data.code === 1002
        ) {
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
      <main className='flex items-center justify-center px-8 py-8 sm:px-12 lg:col-span-7 lg:px-16 lg:py-12 xl:col-span-6'>
        <div className='max-w-xl lg:max-w-3xl'>
          <div className='h-10 w-32'></div> {/* Logo placeholder */}
          <h1 className='mt-6 text-2xl font-bold sm:text-3xl md:text-4xl'>
            {t('login.welcomeBack')}
          </h1>
          <p className='mt-4 leading-relaxed'>{t('login.signInToContinue')}</p>
          {/* Form placeholder */}
          <div className='mt-8 grid grid-cols-6 gap-6'></div>
        </div>
      </main>
    );
  }

  return (
    <>
      <main className='flex items-center justify-center px-8 py-8 sm:px-12 lg:col-span-7 lg:px-16 lg:py-12 xl:col-span-6'>
        <div className='max-w-xl lg:max-w-3xl'>
          <Link className='block text-blue-600' href='/'>
            <Logo />
          </Link>

          <h1 className='mt-6 text-2xl font-bold sm:text-3xl md:text-4xl flex items-center gap-4'>
            {t('login.welcomeBack')} <HeartHandshake className='size-6' />
          </h1>

          <p className='mt-4 leading-relaxed'>{t('login.signInToContinue')}</p>

          <form
            onSubmit={handleSubmit(onSubmit)}
            className='mt-8 grid grid-cols-6 gap-6'
          >
            {loginMethod === 'email' ? (
              <div className='col-span-6'>
                <Label htmlFor='email'>{t('login.email')}</Label>
                <Input
                  type='email'
                  id='email'
                  {...register('email', { required: t('login.emailRequired') })}
                  className='mt-1 w-full rounded-md shadow-sm border-gray-500'
                />
                {errors.email && (
                  <p className='text-red-500 text-sm mt-2'>
                    {errors.email.message}
                  </p>
                )}
              </div>
            ) : (
              <div className='col-span-6'>
                <Label htmlFor='phoneNumber'>{t('login.phoneNumber')}</Label>
                <Input
                  type='tel'
                  id='phoneNumber'
                  {...register('phoneNumber', {
                    required: t('login.phoneRequired'),
                  })}
                  className='mt-1 w-full rounded-md shadow-sm border-gray-500'
                  placeholder={t('login.phoneNumberPlaceholder')}
                  required
                />
                {errors.phoneNumber && (
                  <p className='text-red-500 text-sm mt-2'>
                    {errors.phoneNumber.message}
                  </p>
                )}
              </div>
            )}

            <div className='col-span-6'>
              <Label htmlFor='password'>{t('login.password')}</Label>
              <Input
                type='password'
                id='password'
                {...register('password', {
                  required: t('login.passwordRequired'),
                })}
                className='mt-1 w-full rounded-md shadow-sm border-gray-500'
              />
              {errors.password && (
                <p className='text-red-500 text-sm mt-2'>
                  {errors.password.message}
                </p>
              )}
            </div>

            <div className='col-span-6'>
              <Button
                type='button'
                variant='link'
                className='p-0 h-auto text-sm'
                onClick={toggleLoginMethod}
              >
                {t('login.signInWithInstead', {
                  method:
                    loginMethod === 'email'
                      ? t('login.phoneNumber')
                      : t('login.email'),
                })}
              </Button>
            </div>

            <div className='col-span-6 flex justify-between items-center'>
              <Button type='submit' className='px-10' disabled={isLoading}>
                {isLoading ? (
                  <span className='flex items-center gap-2'>
                    <span className='h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent'></span>
                    {t('login.signingIn')}
                  </span>
                ) : (
                  <span className='flex items-center gap-2'>
                    {t('login.signIn')}
                    <LucideChevronRight className='h-4 w-4' />
                  </span>
                )}
              </Button>
              <button
                type='button'
                className='text-sm text-primary hover:underline'
                onClick={() => setIsForgotPasswordOpen(true)}
              >
                {t('login.forgotPassword')}
              </button>
            </div>

            <div className='col-span-6 text-center mt-4'>
              <p className='text-sm text-gray-500'>
                {t('login.dontHaveAccount')}{' '}
                <Link href='/auth/register' className='underline text-primary'>
                  {t('login.signUp')}
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
          <DialogTitle>{t('login.resendVerificationTitle')}</DialogTitle>
          <DialogDescription>
            {t('login.resendVerificationDesc', { email: resendEmail })}
          </DialogDescription>
          <DialogFooter>
            <Button
              variant='secondary'
              onClick={() => setIsResendDialogOpen(false)}
            >
              {t('login.cancel')}
            </Button>
            <Button
              onClick={() => {
                resendVerification(resendEmail);
                setIsResendDialogOpen(false);
              }}
            >
              {t('login.resend')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
