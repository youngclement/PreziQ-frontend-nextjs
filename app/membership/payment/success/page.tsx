'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import Header from '@/components/header';
import Footer from '@/components/footer';
import { cn } from '@/lib/utils';

export default function PaymentSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const plan = searchParams.get('plan') || '';
  const billing = searchParams.get('billing') || 'monthly';

  const [countdown, setCountdown] = useState(5);

  // Auto-redirect after 5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          router.push('/dashboard');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [router]);

  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: 'easeOut',
      },
    },
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3,
      },
    },
  };

  const scaleIn = {
    hidden: { scale: 0 },
    visible: {
      scale: 1,
      transition: { type: 'spring', stiffness: 120, duration: 0.6 },
    },
  };

  return (
    <div className='mx-32 mt-12 mb-12 w-full'>
      <Header />
      <main className='flex-1 overflow-hidden'>
        <section className='container max-w-6xl py-12 md:py-24'>
          <motion.div
            initial='hidden'
            animate='visible'
            variants={containerVariants}
            className='flex flex-col items-center justify-center'
          >
            <motion.div variants={scaleIn} className='mb-8 relative'>
              <div className='relative'>
                <motion.div
                  className='absolute -inset-4 rounded-full bg-green-100 dark:bg-green-900/30 animate-pulse'
                  animate={{
                    scale: [1, 1.1, 1],
                  }}
                  transition={{ repeat: Infinity, duration: 2 }}
                />
                <div className='relative bg-white dark:bg-black p-6 rounded-full border-4 border-green-500'>
                  <CheckCircle2 className='h-24 w-24 text-green-500' />
                </div>
                <motion.div
                  initial={{ scale: 1.3, opacity: 0 }}
                  animate={{ scale: 1, opacity: 0.2 }}
                  transition={{
                    repeat: Infinity,
                    duration: 1.5,
                    repeatType: 'reverse',
                  }}
                  className='absolute inset-0 rounded-full bg-green-500'
                />
              </div>
            </motion.div>

            <motion.div
              className='absolute top-4 left-0 right-0 flex justify-center'
              initial={{ y: -100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5, type: 'spring', stiffness: 50 }}
            >
              <div className='px-4 py-2 bg-green-100 dark:bg-green-900/30 rounded-full border border-green-200 dark:border-green-800 shadow-md'>
                <span className='text-sm font-medium text-green-800 dark:text-green-300 flex items-center'>
                  <CheckCircle2 className='h-4 w-4 mr-1' />
                  Giao dịch thành công
                </span>
              </div>
            </motion.div>

            <motion.h1
              variants={fadeIn}
              className='text-4xl md:text-5xl font-bold mb-4 text-center bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-emerald-500 dark:from-green-400 dark:to-emerald-300'
            >
              Thanh toán thành công!
            </motion.h1>

            <motion.p
              variants={fadeIn}
              className='text-xl text-muted-foreground max-w-2xl mx-auto text-center mb-8'
            >
              Cảm ơn bạn đã đăng ký gói{' '}
              <span className='font-medium text-primary'>
                {plan.charAt(0).toUpperCase() + plan.slice(1)} -{' '}
                {billing === 'yearly' ? 'Hàng năm' : 'Hàng tháng'}
              </span>
              . Tài khoản của bạn đã được nâng cấp thành công.
            </motion.p>

            <motion.div variants={fadeIn} className='max-w-lg w-full'>
              <Card
                className={cn(
                  'border-2 border-green-200 bg-gradient-to-br from-white to-green-50 dark:from-gray-900 dark:to-green-900/10 dark:border-green-900/50 shadow-lg overflow-hidden'
                )}
              >
                <CardHeader className='bg-green-100/50 dark:bg-green-900/20 border-b border-green-200 dark:border-green-900/30'>
                  <CardTitle className='text-center flex justify-center items-center'>
                    <svg
                      xmlns='http://www.w3.org/2000/svg'
                      className='h-5 w-5 mr-2 text-green-600'
                      viewBox='0 0 24 24'
                      fill='none'
                      stroke='currentColor'
                      strokeWidth='2'
                      strokeLinecap='round'
                      strokeLinejoin='round'
                    >
                      <path d='M21 8v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z' />
                      <polyline points='9 15 12 18 15 15' />
                      <path d='M12 18v-7' />
                    </svg>
                    Thông tin đơn hàng
                  </CardTitle>
                </CardHeader>
                <CardContent className='space-y-5 p-6'>
                  <div className='space-y-1 p-4 rounded-lg bg-white dark:bg-gray-900 border border-green-100 dark:border-green-900/30'>
                    <p className='text-sm font-medium flex justify-between'>
                      <span className='text-muted-foreground'>
                        Mã đơn hàng:
                      </span>
                      <span className='font-mono bg-green-50 dark:bg-green-900/20 py-1 px-3 rounded-md border border-green-100 dark:border-green-800 text-green-700 dark:text-green-300 inline-block'>
                        ORD-{Math.floor(100000 + Math.random() * 900000)}
                      </span>
                    </p>
                  </div>

                  <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                    <div className='space-y-1 p-4 rounded-lg bg-white dark:bg-gray-900 border border-green-100 dark:border-green-900/30'>
                      <p className='text-sm font-medium text-muted-foreground'>
                        Ngày thanh toán:
                      </p>
                      <p className='font-semibold flex items-center'>
                        <svg
                          xmlns='http://www.w3.org/2000/svg'
                          className='h-4 w-4 mr-1 text-green-500'
                          viewBox='0 0 24 24'
                          fill='none'
                          stroke='currentColor'
                          strokeWidth='2'
                          strokeLinecap='round'
                          strokeLinejoin='round'
                        >
                          <rect
                            x='3'
                            y='4'
                            width='18'
                            height='18'
                            rx='2'
                            ry='2'
                          />
                          <line x1='16' y1='2' x2='16' y2='6' />
                          <line x1='8' y1='2' x2='8' y2='6' />
                          <line x1='3' y1='10' x2='21' y2='10' />
                        </svg>
                        {new Date().toLocaleDateString('vi-VN')}
                      </p>
                    </div>

                    <div className='space-y-1 p-4 rounded-lg bg-white dark:bg-gray-900 border border-green-100 dark:border-green-900/30'>
                      <p className='text-sm font-medium text-muted-foreground'>
                        Ngày hết hạn:
                      </p>
                      <p className='font-semibold flex items-center'>
                        <svg
                          xmlns='http://www.w3.org/2000/svg'
                          className='h-4 w-4 mr-1 text-green-500'
                          viewBox='0 0 24 24'
                          fill='none'
                          stroke='currentColor'
                          strokeWidth='2'
                          strokeLinecap='round'
                          strokeLinejoin='round'
                        >
                          <rect
                            x='3'
                            y='4'
                            width='18'
                            height='18'
                            rx='2'
                            ry='2'
                          />
                          <line x1='16' y1='2' x2='16' y2='6' />
                          <line x1='8' y1='2' x2='8' y2='6' />
                          <line x1='3' y1='10' x2='21' y2='10' />
                        </svg>
                        {(() => {
                          const date = new Date();
                          if (billing === 'yearly') {
                            date.setFullYear(date.getFullYear() + 1);
                          } else {
                            date.setMonth(date.getMonth() + 1);
                          }
                          return date.toLocaleDateString('vi-VN');
                        })()}
                      </p>
                    </div>
                  </div>

                  <div className='p-4 rounded-lg border border-dashed border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-900/10'>
                    <div className='flex items-center mb-2'>
                      <svg
                        xmlns='http://www.w3.org/2000/svg'
                        className='h-5 w-5 mr-2 text-green-600'
                        viewBox='0 0 24 24'
                        fill='none'
                        stroke='currentColor'
                        strokeWidth='2'
                        strokeLinecap='round'
                        strokeLinejoin='round'
                      >
                        <path d='M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z' />
                        <polyline points='22,6 12,13 2,6' />
                      </svg>
                      <span className='font-medium'>Thông báo chi tiết</span>
                    </div>
                    <p className='text-sm text-muted-foreground'>
                      Chi tiết đơn hàng đã được gửi đến email của bạn. Vui lòng
                      kiểm tra hộp thư đến.
                    </p>
                  </div>
                </CardContent>
                <CardFooter className='flex flex-col space-y-4 p-6 bg-green-50/80 dark:bg-green-900/5 border-t border-green-100 dark:border-green-900/30'>
                  <Button
                    asChild
                    className='w-full bg-green-600 hover:bg-green-700 text-white h-12'
                  >
                    <Link href='/dashboard'>
                      <span className='flex items-center justify-center text-base font-medium'>
                        Đến Dashboard
                        <ArrowRight className='ml-2 h-4 w-4' />
                      </span>
                    </Link>
                  </Button>
                  <div className='flex justify-center items-center'>
                    <div className='px-3 py-1.5 bg-white dark:bg-gray-900 rounded-full border border-green-200 dark:border-green-900/50 shadow-sm'>
                      <p className='text-xs text-center text-muted-foreground'>
                        Tự động chuyển hướng sau{' '}
                        <span className='font-bold text-green-600'>
                          {countdown}
                        </span>{' '}
                        giây
                      </p>
                    </div>
                  </div>
                </CardFooter>
              </Card>
            </motion.div>

            <motion.div
              className='mt-8 flex justify-center space-x-4'
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 }}
            >
              <Link
                href='/membership'
                className='text-sm text-muted-foreground hover:text-primary flex items-center'
              >
                <svg
                  xmlns='http://www.w3.org/2000/svg'
                  className='h-4 w-4 mr-1'
                  viewBox='0 0 24 24'
                  fill='none'
                  stroke='currentColor'
                  strokeWidth='2'
                  strokeLinecap='round'
                  strokeLinejoin='round'
                >
                  <polyline points='15 18 9 12 15 6' />
                </svg>
                Quay lại trang Membership
              </Link>
              <Link
                href='/help'
                className='text-sm text-muted-foreground hover:text-primary flex items-center'
              >
                <svg
                  xmlns='http://www.w3.org/2000/svg'
                  className='h-4 w-4 mr-1'
                  viewBox='0 0 24 24'
                  fill='none'
                  stroke='currentColor'
                  strokeWidth='2'
                  strokeLinecap='round'
                  strokeLinejoin='round'
                >
                  <circle cx='12' cy='12' r='10' />
                  <path d='M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3' />
                  <line x1='12' y1='17' x2='12.01' y2='17' />
                </svg>
                Trung tâm hỗ trợ
              </Link>
            </motion.div>
          </motion.div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
