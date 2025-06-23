'use client';

import Link from 'next/link';
import { HeartHandshake } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState, useEffect } from 'react';
import Logo from '@/components/common/logo';
import { useRouter } from 'next/navigation';
import { authApi } from '@/api/index';
import { useForm } from 'react-hook-form';
import { toast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/language-context';

export default function RegisterPage() {
  const [isClient, setIsClient] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    setIsClient(true);
  }, []);
  const router = useRouter();
  //   const [formData, setFormData] = useState({
  //     firstName: '',
  //     lastName: '',
  //     email: '',
  //     phoneNumber: '',
  //     password: '',
  //     confirmPassword: '',
  //     subscribe: false,
  //   });

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm();

  //   const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  //     const { name, value } = e.target;
  //     setFormData((prev) => ({
  //       ...prev,
  //       [name]: value,
  //     }));
  //   };

  //   const handleCheckboxChange = (checked: boolean) => {
  //     setFormData((prev) => ({
  //       ...prev,
  //       subscribe: checked,
  //     }));
  //   };

  //   const handleSubmit = (e: React.FormEvent) => {
  //     e.preventDefault();
  //     // Submit logic here
  //     console.log(formData);
  //   };

  const onSubmit = async (data: any) => {
    try {
      const res = await authApi.register(data);
      toast({
        title: res.data.message,
      });
      router.push('/auth/login');
    } catch (error: any) {
      if (error.response && error.response.data) {
        const backendErrors = error.response.data.errors;

        backendErrors?.forEach((err: any) => {
          if (err.code === 1120 || err.code === 1119 || err.code === 1123) {
            setError('confirmPassword', {
              type: 'server',
              message: err.message,
            });
          } else if (err.code === 1105) {
            setError('password', { type: 'server', message: err.message });
          } else if (err.code === 1111) {
            setError('phoneNumber', { type: 'server', message: err.message });
          } else if (err.code === 1103) {
            setError('email', { type: 'server', message: err.message });
          } else {
            setError('email', { type: 'server', message: err.message });
          }
        });
      }
    }
  };

  return (
    <main className='flex items-center justify-center px-8 py-8 sm:px-12 lg:col-span-7 lg:px-16 lg:py-12 xl:col-span-6'>
      <div className='max-w-xl lg:max-w-3xl'>
        <Link className='block text-blue-600' href='/'>
          <Logo />
        </Link>

        <h1 className='mt-6 text-2xl flex items-center gap-4 font-bold sm:text-3xl md:text-4xl'>
          {t('welcome')} {isClient && <HeartHandshake className='size-6' />}
        </h1>

        <p className='mt-4 leading-relaxed'>{t('joinPreziQ')}</p>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className='mt-8 grid grid-cols-6 gap-6'
        >
          <div className='col-span-6 sm:col-span-3'>
            <Label htmlFor='firstName'>{t('firstName')}</Label>
            <Input
              type='text'
              id='firstName'
              {...register('firstName', {
                required: t('firstNameRequired'),
              })}
              className='mt-1 w-full rounded-md shadow-sm'
            />
            {errors.firstName && (
              <p className='text-red-500 text-sm'>
                {errors.firstName.message as string}
              </p>
            )}
          </div>

          <div className='col-span-6 sm:col-span-3'>
            <Label htmlFor='lastName'>{t('lastName')}</Label>
            <Input
              type='text'
              id='lastName'
              {...register('lastName', {
                required: t('lastNameRequired'),
              })}
              className='mt-1 w-full rounded-md shadow-sm'
            />
            {errors.lastName && (
              <p className='text-red-500 text-sm'>
                {errors.lastName.message as string}
              </p>
            )}
          </div>

          <div className='col-span-6 sm:col-span-3'>
            <Label htmlFor='email'>{t('email')}</Label>
            <Input
              type='email'
              id='email'
              {...register('email', { required: t('emailRequired') })}
              className='mt-1 w-full rounded-md shadow-sm'
            />
            {errors.email && (
              <p className='text-red-500 text-sm'>
                {errors.email.message as string}
              </p>
            )}
          </div>

          <div className='col-span-6 sm:col-span-3'>
            <Label htmlFor='phoneNumber'>{t('phoneNumber')}</Label>
            <Input
              type='tel'
              id='phoneNumber'
              {...register('phoneNumber', {
                required: t('phoneNumberRequired'),
              })}
              className='mt-1 w-full rounded-md shadow-sm'
              placeholder={t('phoneNumberPlaceholder')}
            />
            {errors.phoneNumber && (
              <p className='text-red-500 text-sm'>
                {errors.phoneNumber.message as string}
              </p>
            )}
          </div>

          <div className='col-span-6 sm:col-span-3'>
            <Label htmlFor='password'>{t('password')}</Label>
            <Input
              type='password'
              id='password'
              {...register('password', {
                required: t('passwordRequired'),
              })}
              className='mt-1 w-full rounded-md shadow-sm'
            />
            {errors.password && (
              <p className='text-red-500 text-sm'>
                {errors.password.message as string}
              </p>
            )}
          </div>

          <div className='col-span-6 sm:col-span-3'>
            <Label htmlFor='confirmPassword'>{t('confirmPassword')}</Label>
            <Input
              type='password'
              id='confirmPassword'
              {...register('confirmPassword', {
                required: t('confirmPasswordRequired'),
              })}
              className='mt-1 w-full rounded-md shadow-sm'
            />
            {errors.confirmPassword && (
              <p className='text-red-500 text-sm'>
                {errors.confirmPassword.message as string}
              </p>
            )}
          </div>

          {/* <div className="col-span-6">
            <Label htmlFor="subscribe" className="flex gap-4">
              <Checkbox
                id="subscribe"
                checked={formData.subscribe}
                onCheckedChange={handleCheckboxChange}
                className="size-5 text-blue-600 shadow-sm rounded-sm"
              />
              <span className="text-sm">Subscribe to our newsletter</span>
            </Label>
          </div> */}

          <div className='col-span-6'>
            <p className='text-sm text-gray-500'>
              {t('byCreatingAccount')}
              <Link href='/terms' className='underline ml-1'>
                {t('termsAndConditions')}
              </Link>{' '}
              {t('and')}{' '}
              <Link href='/privacy' className='underline'>
                {t('privacyPolicy')}
              </Link>
              .
            </p>
          </div>

          <div className='col-span-6 flex flex-col md:flex-row items-center justify-center md:justify-start sm:gap-4'>
            <Button type='submit' className='px-10'>
              {t('createAnAccount')}
            </Button>

            <p className='mt-4 text-sm text-gray-500 sm:mt-0'>
              {t('alreadyHaveAccount')}{' '}
              <Link href='/auth/login' className='underline text-primary'>
                {t('logIn')}
              </Link>
            </p>
          </div>
        </form>
      </div>
    </main>
  );
}
