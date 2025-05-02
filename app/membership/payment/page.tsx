'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Sparkles, CreditCard, ArrowLeft, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import Header from '@/components/header';
import Footer from '@/components/footer';
import { Check } from 'lucide-react';

// Schema validations
const paymentFormSchema = z.object({
  fullName: z.string().min(2, { message: 'Họ tên phải có ít nhất 2 ký tự' }),
  email: z.string().email({ message: 'Email không hợp lệ' }),
  cardNumber: z
    .string()
    .regex(/^\d{16}$/, { message: 'Số thẻ phải có 16 chữ số' }),
  expiryDate: z.string().regex(/^(0[1-9]|1[0-2])\/\d{2}$/, {
    message: 'Định dạng hạn sử dụng không hợp lệ (MM/YY)',
  }),
  cvv: z.string().regex(/^\d{3,4}$/, { message: 'CVV phải có 3-4 chữ số' }),
  paymentMethod: z.enum(['credit', 'bank', 'momo'], {
    required_error: 'Vui lòng chọn phương thức thanh toán',
  }),
});

type PaymentFormValues = z.infer<typeof paymentFormSchema>;

// Dữ liệu các gói membership
const membershipPlans = [
  {
    id: 'bạc',
    name: 'Bạc',
    priceMonthly: '99.000',
    priceYearly: '999.000',
  },
  {
    id: 'vàng',
    name: 'Vàng',
    priceMonthly: '199.000',
    priceYearly: '1.999.000',
  },
  {
    id: 'bạch kim',
    name: 'Bạch Kim',
    priceMonthly: '299.000',
    priceYearly: '2.999.000',
  },
  {
    id: 'kim cương',
    name: 'Kim Cương',
    priceMonthly: '599.000',
    priceYearly: '5.999.000',
  },
];

export default function MembershipPaymentPage() {
  const searchParams = useSearchParams();
  const planId = searchParams.get('plan') || 'silver';
  const billingCycle = searchParams.get('billing') || 'monthly';

  const [selectedPlan, setSelectedPlan] = useState<any>(null);

  useEffect(() => {
    // Tìm plan dựa trên id hoặc name (không phân biệt hoa thường)
    const plan = membershipPlans.find(
      (p) =>
        p.id.toLowerCase() === planId.toLowerCase() ||
        p.name.toLowerCase() === planId.toLowerCase()
    );
    setSelectedPlan(plan || membershipPlans[0]); // Fallback to first plan if not found
  }, [planId]);

  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      fullName: '',
      email: '',
      cardNumber: '',
      expiryDate: '',
      cvv: '',
      paymentMethod: 'credit',
    },
  });

  const router = useRouter();

  function onSubmit(data: PaymentFormValues) {
    console.log('Form submitted:', data);
    // Xử lý thanh toán ở đây (thường là gọi API)

    // Giả lập đang xử lý thanh toán
    setTimeout(() => {
      // Chuyển hướng đến trang thành công
      router.push(
        `/membership/payment/success?plan=${planId}&billing=${billingCycle}`
      );
    }, 1500);
  }

  function formatCardNumber(value: string) {
    return value
      .replace(/\s/g, '')
      .replace(/(\d{4})/g, '$1 ')
      .trim();
  }

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

  if (!selectedPlan) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <p>Đang tải...</p>
      </div>
    );
  }

  return (
    <div className='mx-32 mt-12 mb-12 w-full'>
      <Header />
      <main className='flex-1 overflow-hidden'>
        <section className='container max-w-6xl py-12'>
          <Link
            href='/membership'
            className='flex items-center text-sm text-muted-foreground mb-6 hover:text-primary'
          >
            <ArrowLeft className='w-4 h-4 mr-2' />
            Quay lại các gói Membership
          </Link>

          <motion.div
            initial='hidden'
            animate='visible'
            variants={fadeIn}
            className='text-center mb-12'
          >
            <h1 className='text-3xl md:text-4xl font-bold mb-4 relative inline-block'>
              Thanh toán Membership
              <motion.div
                className='absolute -right-8 -top-8'
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.5, type: 'spring', bounce: 0.5 }}
              >
                <Sparkles className='w-6 h-6 text-yellow-500' />
              </motion.div>
            </h1>
            <motion.p
              className='text-lg text-muted-foreground max-w-2xl mx-auto'
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              Hoàn tất thanh toán để bắt đầu trải nghiệm các tính năng cao cấp
            </motion.p>
          </motion.div>

          <div className='grid grid-cols-1 md:grid-cols-3 gap-8'>
            {/* Phần thông tin đơn hàng */}
            <Card className='md:col-span-1 border-2 shadow-md overflow-hidden'>
              <CardHeader className='bg-muted border-b px-6 py-5'>
                <CardTitle className='text-xl flex items-center'>
                  <span className='bg-primary text-white rounded-full h-6 w-6 mr-2 flex items-center justify-center text-sm'>
                    1
                  </span>
                  Thông tin đơn hàng
                </CardTitle>
                <CardDescription className='mt-1'>
                  Chi tiết gói Membership đã chọn
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-5 px-6 py-5'>
                <div className='p-5 rounded-lg bg-muted/50 border border-muted'>
                  <div className='flex justify-between mb-3 border-b pb-2'>
                    <span className='font-medium'>Gói Membership:</span>
                    <span className='font-bold text-primary'>
                      {selectedPlan.name}
                    </span>
                  </div>
                  <div className='flex justify-between mb-3 border-b pb-2'>
                    <span className='font-medium'>Loại thanh toán:</span>
                    <span className='font-medium'>
                      {billingCycle === 'yearly' ? 'Hàng năm' : 'Hàng tháng'}
                    </span>
                  </div>
                  <Separator className='my-4 bg-muted-foreground/20' />
                  <div className='flex justify-between text-lg font-bold'>
                    <span>Tổng cộng:</span>
                    <span className='text-primary bg-primary/10 px-3 py-1 rounded-md'>
                      {billingCycle === 'yearly'
                        ? selectedPlan.priceYearly
                        : selectedPlan.priceMonthly}{' '}
                      VNĐ
                    </span>
                  </div>
                  {billingCycle === 'yearly' && (
                    <div className='text-sm text-right mt-3 text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/20 rounded-md p-2'>
                      <span className='inline-flex items-center'>
                        <Sparkles className='h-3 w-3 mr-1' />
                        Tiết kiệm 20% so với thanh toán hàng tháng
                      </span>
                    </div>
                  )}
                </div>

                <div className='rounded-lg border p-4 bg-card'>
                  <h4 className='font-medium mb-2 text-sm border-b pb-2'>
                    Lợi ích của gói Membership
                  </h4>
                  <div className='text-sm text-muted-foreground space-y-3'>
                    <p className='flex items-start'>
                      <Check className='h-4 w-4 mr-2 text-green-500 mt-0.5 shrink-0' />
                      Thanh toán an toàn, bảo mật qua các cổng thanh toán uy tín
                    </p>
                    <p className='flex items-start'>
                      <Check className='h-4 w-4 mr-2 text-green-500 mt-0.5 shrink-0' />
                      Hỗ trợ hoàn tiền trong vòng 7 ngày nếu không hài lòng
                    </p>
                    <p className='flex items-start'>
                      <Check className='h-4 w-4 mr-2 text-green-500 mt-0.5 shrink-0' />
                      Tự động gia hạn vào cuối kỳ thanh toán
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Phần form thanh toán */}
            <Card className='md:col-span-2 border-2 shadow-md overflow-hidden'>
              <CardHeader className='bg-muted border-b px-6 py-5'>
                <CardTitle className='text-xl flex items-center'>
                  <span className='bg-primary text-white rounded-full h-6 w-6 mr-2 flex items-center justify-center text-sm'>
                    2
                  </span>
                  Thông tin thanh toán
                </CardTitle>
                <CardDescription className='mt-1'>
                  Vui lòng điền đầy đủ thông tin
                </CardDescription>
              </CardHeader>
              <CardContent className='px-6 py-5'>
                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className='space-y-6'
                  >
                    <div className='bg-muted/30 border rounded-lg p-5 mb-4'>
                      <h3 className='text-base font-medium mb-4 pb-2 border-b'>
                        Thông tin cá nhân
                      </h3>
                      <div className='grid grid-cols-1 gap-6'>
                        <FormField
                          control={form.control}
                          name='fullName'
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className='text-sm font-medium'>
                                Họ và tên
                              </FormLabel>
                              <FormControl>
                                <Input
                                  placeholder='Nguyễn Văn A'
                                  {...field}
                                  className='border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary'
                                />
                              </FormControl>
                              <FormMessage className='text-xs' />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name='email'
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className='text-sm font-medium'>
                                Email
                              </FormLabel>
                              <FormControl>
                                <Input
                                  placeholder='example@gmail.com'
                                  type='email'
                                  {...field}
                                  className='border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary'
                                />
                              </FormControl>
                              <FormMessage className='text-xs' />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    <div className='bg-muted/30 border rounded-lg p-5'>
                      <h3 className='text-base font-medium mb-4 pb-2 border-b'>
                        Phương thức thanh toán
                      </h3>
                      <FormField
                        control={form.control}
                        name='paymentMethod'
                        render={({ field }) => (
                          <FormItem className='space-y-4'>
                            <FormControl>
                              <RadioGroup
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                                className='flex flex-col space-y-3'
                              >
                                <FormItem className='flex items-center space-x-3 space-y-0 border rounded-md p-3 cursor-pointer hover:bg-muted/50 transition-colors'>
                                  <FormControl>
                                    <RadioGroupItem value='credit' />
                                  </FormControl>
                                  <FormLabel className='font-medium cursor-pointer'>
                                    <span className='flex items-center'>
                                      <CreditCard className='h-5 w-5 mr-2 text-primary' />
                                      Thẻ tín dụng/ghi nợ
                                    </span>
                                  </FormLabel>
                                </FormItem>
                                <FormItem className='flex items-center space-x-3 space-y-0 border rounded-md p-3 cursor-pointer hover:bg-muted/50 transition-colors'>
                                  <FormControl>
                                    <RadioGroupItem value='bank' />
                                  </FormControl>
                                  <FormLabel className='font-medium cursor-pointer'>
                                    <span className='flex items-center'>
                                      <svg
                                        xmlns='http://www.w3.org/2000/svg'
                                        className='h-5 w-5 mr-2 text-primary'
                                        viewBox='0 0 24 24'
                                        fill='none'
                                        stroke='currentColor'
                                        strokeWidth='2'
                                        strokeLinecap='round'
                                        strokeLinejoin='round'
                                      >
                                        <rect
                                          x='2'
                                          y='5'
                                          width='20'
                                          height='14'
                                          rx='2'
                                        />
                                        <line x1='2' y1='10' x2='22' y2='10' />
                                      </svg>
                                      Chuyển khoản ngân hàng
                                    </span>
                                  </FormLabel>
                                </FormItem>
                                <FormItem className='flex items-center space-x-3 space-y-0 border rounded-md p-3 cursor-pointer hover:bg-muted/50 transition-colors'>
                                  <FormControl>
                                    <RadioGroupItem value='momo' />
                                  </FormControl>
                                  <FormLabel className='font-medium cursor-pointer'>
                                    <span className='flex items-center'>
                                      <svg
                                        xmlns='http://www.w3.org/2000/svg'
                                        className='h-5 w-5 mr-2 text-primary'
                                        viewBox='0 0 24 24'
                                        fill='none'
                                        stroke='currentColor'
                                        strokeWidth='2'
                                        strokeLinecap='round'
                                        strokeLinejoin='round'
                                      >
                                        <rect
                                          x='2'
                                          y='4'
                                          width='20'
                                          height='16'
                                          rx='2'
                                        />
                                        <path d='M12 8v.01' />
                                        <path d='M12 12v4' />
                                      </svg>
                                      Ví điện tử (MoMo, ZaloPay)
                                    </span>
                                  </FormLabel>
                                </FormItem>
                              </RadioGroup>
                            </FormControl>
                            <FormMessage className='text-xs' />
                          </FormItem>
                        )}
                      />

                      {form.watch('paymentMethod') === 'credit' && (
                        <div className='mt-5 border-t pt-5 space-y-5'>
                          <FormField
                            control={form.control}
                            name='cardNumber'
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className='text-sm font-medium'>
                                  Số thẻ
                                </FormLabel>
                                <FormControl>
                                  <div className='relative'>
                                    <Input
                                      placeholder='1234 5678 9012 3456'
                                      {...field}
                                      className='border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary pl-3 pr-10'
                                      onChange={(e) => {
                                        // Chỉ cho phép số
                                        const value = e.target.value.replace(
                                          /\D/g,
                                          ''
                                        );
                                        if (value.length <= 16) {
                                          field.onChange(value);
                                        }
                                      }}
                                    />
                                    <CreditCard className='absolute right-3 top-2.5 h-5 w-5 text-muted-foreground' />
                                  </div>
                                </FormControl>
                                <FormMessage className='text-xs' />
                              </FormItem>
                            )}
                          />

                          <div className='grid grid-cols-2 gap-6'>
                            <FormField
                              control={form.control}
                              name='expiryDate'
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className='text-sm font-medium'>
                                    Ngày hết hạn
                                  </FormLabel>
                                  <FormControl>
                                    <Input
                                      placeholder='MM/YY'
                                      {...field}
                                      className='border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary'
                                      onChange={(e) => {
                                        let value = e.target.value.replace(
                                          /\D/g,
                                          ''
                                        );
                                        if (value.length > 0) {
                                          if (value.length <= 2) {
                                            field.onChange(value);
                                          } else {
                                            field.onChange(
                                              `${value.slice(
                                                0,
                                                2
                                              )}/${value.slice(2, 4)}`
                                            );
                                          }
                                        } else {
                                          field.onChange(value);
                                        }
                                      }}
                                    />
                                  </FormControl>
                                  <FormMessage className='text-xs' />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name='cvv'
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className='text-sm font-medium'>
                                    CVV
                                  </FormLabel>
                                  <FormControl>
                                    <Input
                                      placeholder='123'
                                      type='password'
                                      maxLength={4}
                                      {...field}
                                      className='border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary'
                                      onChange={(e) => {
                                        const value = e.target.value.replace(
                                          /\D/g,
                                          ''
                                        );
                                        if (value.length <= 4) {
                                          field.onChange(value);
                                        }
                                      }}
                                    />
                                  </FormControl>
                                  <FormMessage className='text-xs' />
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    <div className='mt-6 border rounded-lg p-5 bg-gradient-to-r from-primary/5 to-primary/10'>
                      <div className='flex justify-between items-center mb-4 pb-3 border-b'>
                        <span className='font-medium'>Tổng thanh toán:</span>
                        <span className='text-xl font-bold text-primary'>
                          {billingCycle === 'yearly'
                            ? selectedPlan.priceYearly
                            : selectedPlan.priceMonthly}{' '}
                          VNĐ
                        </span>
                      </div>

                      <Button
                        type='submit'
                        className='w-full h-12 text-base bg-primary hover:bg-primary/90 transition-colors'
                      >
                        <motion.span
                          className='flex items-center justify-center'
                          whileTap={{ scale: 0.97 }}
                        >
                          Thanh toán ngay
                          <ArrowRight className='ml-2 h-4 w-4' />
                        </motion.span>
                      </Button>
                    </div>

                    <p className='text-xs text-center text-muted-foreground mt-4 bg-muted/30 p-3 rounded-md border'>
                      Bằng cách thanh toán, bạn đồng ý với
                      <Link
                        href='/terms'
                        className='text-primary mx-1 hover:underline'
                      >
                        Điều khoản dịch vụ
                      </Link>
                      và
                      <Link
                        href='/privacy'
                        className='text-primary mx-1 hover:underline'
                      >
                        Chính sách bảo mật
                      </Link>
                      của chúng tôi.
                    </p>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
