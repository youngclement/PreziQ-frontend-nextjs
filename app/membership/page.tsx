'use client';

import { useState } from 'react';
import { Check, X, Sparkles } from 'lucide-react';
import Link from 'next/link';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Footer from '@/components/footer';
import Header from '@/components/header';
import { cn } from '@/lib/utils';

const MembershipPlansPage = () => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>(
    'monthly'
  );

  // Animation variants
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

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: 'spring', stiffness: 100 },
    },
  };

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

  // Dữ liệu các gói membership
  const membershipPlans = [
    {
      name: 'Bạc',
      description: 'Phù hợp cho người mới bắt đầu và nhóm nhỏ',
      priceMonthly: '99.000',
      priceYearly: '999.000',
      features: [
        { name: 'Tạo đến 10 bài thuyết trình', included: true },
        { name: 'Truy cập 20+ mẫu cơ bản', included: true },
        { name: 'Hỗ trợ AI cơ bản', included: true },
        { name: 'Xuất file PDF', included: true },
        { name: 'Chỉnh sửa cộng tác (2 người)', included: true },
        { name: 'Phân tích người xem cơ bản', included: false },
        { name: 'Hỗ trợ kỹ thuật ưu tiên', included: false },
        { name: 'Tính năng nâng cao', included: false },
      ],
      color: 'border-slate-300 bg-slate-50 dark:bg-slate-900/30',
      buttonVariant: 'outline' as const,
    },
    {
      name: 'Vàng',
      description: 'Giải pháp tối ưu cho nhóm và doanh nghiệp nhỏ',
      priceMonthly: '199.000',
      priceYearly: '1.999.000',
      features: [
        { name: 'Tạo đến 30 bài thuyết trình', included: true },
        { name: 'Truy cập 50+ mẫu chuyên nghiệp', included: true },
        { name: 'Hỗ trợ AI nâng cao', included: true },
        { name: 'Xuất file PDF, PPT và các định dạng khác', included: true },
        { name: 'Chỉnh sửa cộng tác (5 người)', included: true },
        { name: 'Phân tích người xem cơ bản', included: true },
        { name: 'Hỗ trợ kỹ thuật ưu tiên', included: false },
        { name: 'Tính năng nâng cao', included: false },
      ],
      color: 'border-yellow-300 bg-yellow-50 dark:bg-yellow-900/30',
      buttonVariant: 'secondary' as const,
    },
    {
      name: 'Bạch Kim',
      description: 'Cho doanh nghiệp với nhu cầu chuyên nghiệp',
      priceMonthly: '299.000',
      priceYearly: '2.999.000',
      features: [
        { name: 'Tạo không giới hạn bài thuyết trình', included: true },
        { name: 'Truy cập tất cả mẫu cao cấp', included: true },
        { name: 'Hỗ trợ AI toàn diện', included: true },
        { name: 'Xuất tất cả định dạng, chất lượng cao', included: true },
        { name: 'Chỉnh sửa cộng tác không giới hạn', included: true },
        { name: 'Phân tích người xem nâng cao', included: true },
        { name: 'Hỗ trợ kỹ thuật ưu tiên 24/7', included: true },
        { name: 'Tính năng nâng cao', included: true },
      ],
      color: 'border-slate-400 bg-slate-100 dark:bg-slate-800/50',
      buttonVariant: 'default' as const,
      isPopular: true,
    },
    {
      name: 'Kim Cương',
      description: 'Giải pháp tối ưu cho doanh nghiệp lớn',
      priceMonthly: '599.000',
      priceYearly: '5.999.000',
      features: [
        { name: 'Tất cả tính năng của gói Bạch Kim', included: true },
        { name: 'Tùy chỉnh thương hiệu hoàn toàn', included: true },
        { name: 'API tích hợp dành cho doanh nghiệp', included: true },
        { name: 'Quản lý đội nhóm và phân quyền', included: true },
        { name: 'Báo cáo phân tích chuyên sâu', included: true },
        { name: 'Đào tạo sử dụng 1-1', included: true },
        { name: 'Quản lý tài khoản riêng', included: true },
        { name: 'Lưu trữ dữ liệu riêng tư', included: true },
      ],
      color: 'border-blue-400 bg-blue-50 dark:bg-blue-900/30',
      buttonVariant: 'default' as const,
      isEnterprise: true,
    },
  ];

  const discount = 20; // Giảm giá 20% khi đăng ký gói năm

  return (
    <div className='mx-32 mt-12 mb-12 w-full'>
      <Header />
      <main className='flex-1 overflow-hidden'>
        <section className='container max-w-6xl py-12 md:py-24'>
          <motion.div
            initial='hidden'
            animate='visible'
            variants={fadeIn}
            className='text-center mb-16'
          >
            <h1 className='text-4xl md:text-5xl font-bold mb-4 relative inline-block'>
              Lựa chọn gói Membership
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
              className='text-xl text-muted-foreground max-w-2xl mx-auto'
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              Nâng tầm bài thuyết trình của bạn với các gói PreziQ đa dạng, phù
              hợp mọi nhu cầu
            </motion.p>
          </motion.div>

          <motion.div
            className='flex justify-center mb-8'
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Tabs
              defaultValue='monthly'
              value={billingCycle}
              onValueChange={(value) =>
                setBillingCycle(value as 'monthly' | 'yearly')
              }
              className='w-full max-w-md'
            >
              <TabsList className='grid w-full grid-cols-2'>
                <TabsTrigger value='monthly'>Thanh toán hàng tháng</TabsTrigger>
                <TabsTrigger value='yearly'>
                  Thanh toán hàng năm
                  <motion.span
                    className='ml-1.5 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-400'
                    initial={{ scale: 0.8 }}
                    animate={{ scale: [0.8, 1.05, 1] }}
                    transition={{ delay: 0.8, duration: 0.5 }}
                  >
                    Tiết kiệm {discount}%
                  </motion.span>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </motion.div>

          <motion.div
            className='grid gap-6 sm:grid-cols-2 lg:grid-cols-4'
            variants={containerVariants}
            initial='hidden'
            animate='visible'
          >
            {membershipPlans.map((plan, index) => (
              <motion.div
                key={plan.name}
                variants={itemVariants}
                whileHover={{
                  y: -10,
                  transition: { type: 'spring', stiffness: 300 },
                }}
                className='h-full'
              >
                <Card
                  className={`relative flex flex-col border-2 h-full ${plan.color}`}
                >
                  {(plan.isPopular || plan.isEnterprise) && (
                    <motion.span
                      className='absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-3 py-1 text-xs font-medium bg-primary text-primary-foreground'
                      initial={{ y: -20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.5 + index * 0.1 }}
                    >
                      {plan.isPopular ? 'Phổ biến nhất' : 'Doanh nghiệp'}
                    </motion.span>
                  )}
                  <CardHeader>
                    <CardTitle>{plan.name}</CardTitle>
                    <CardDescription>{plan.description}</CardDescription>
                    <motion.div
                      className='mt-4'
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.7 + index * 0.1 }}
                    >
                      <motion.span
                        className='text-3xl font-bold'
                        key={billingCycle} // Reset animation when billing cycle changes
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: 'spring', stiffness: 200 }}
                      >
                        {billingCycle === 'yearly'
                          ? plan.priceYearly
                          : plan.priceMonthly}
                        đ
                      </motion.span>
                      <span className='text-muted-foreground ml-1'>
                        /{billingCycle === 'yearly' ? 'năm' : 'tháng'}
                      </span>
                    </motion.div>
                  </CardHeader>
                  <CardContent className='flex-1'>
                    <ul className='space-y-2'>
                      {plan.features.map((feature, featureIndex) => (
                        <motion.li
                          key={feature.name}
                          className='flex items-start gap-2'
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.8 + featureIndex * 0.05 }}
                        >
                          {feature.included ? (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{
                                type: 'spring',
                                stiffness: 300,
                                delay: 0.8 + featureIndex * 0.05,
                              }}
                            >
                              <Check className='h-5 w-5 text-green-500 shrink-0' />
                            </motion.div>
                          ) : (
                            <X className='h-5 w-5 text-muted-foreground shrink-0' />
                          )}
                          <span
                            className={
                              !feature.included ? 'text-muted-foreground' : ''
                            }
                          >
                            {feature.name}
                          </span>
                        </motion.li>
                      ))}
                    </ul>
                  </CardContent>
                  <CardFooter>
                    <motion.div
                      className='w-full'
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                    >
                      <Button
                        variant={plan.buttonVariant}
                        className={cn(
                          'w-full',
                          plan.isPopular &&
                            'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700'
                        )}
                        asChild
                      >
                        <Link href='/auth/signup'>
                          {plan.isEnterprise
                            ? 'Liên hệ tư vấn'
                            : 'Đăng ký ngay'}
                        </Link>
                      </Button>
                    </motion.div>
                  </CardFooter>
                </Card>
              </motion.div>
            ))}
          </motion.div>

          <motion.div
            className='mt-16 bg-muted rounded-lg p-6 md:p-8'
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2, duration: 0.6 }}
          >
            <div className='grid md:grid-cols-2 gap-6 items-center'>
              <div>
                <motion.h2
                  className='text-2xl font-bold mb-2'
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1.3 }}
                >
                  Bạn cần giải pháp đặc biệt?
                </motion.h2>
                <motion.p
                  className='text-muted-foreground mb-4'
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.4 }}
                >
                  Chúng tôi cung cấp các gói tùy chỉnh cho doanh nghiệp có nhu
                  cầu đặc thù. Hãy liên hệ với đội ngũ bán hàng của chúng tôi để
                  được tư vấn.
                </motion.p>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button asChild>
                    <Link href='/contact'>Liên hệ tư vấn</Link>
                  </Button>
                </motion.div>
              </div>
              <div className='bg-background rounded-lg p-4 border'>
                <motion.h3
                  className='font-semibold mb-3'
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.5 }}
                >
                  Những khách hàng tin tưởng chúng tôi
                </motion.h3>
                <motion.div
                  className='grid grid-cols-3 gap-4'
                  variants={containerVariants}
                  initial='hidden'
                  animate='visible'
                  transition={{ delayChildren: 1.6, staggerChildren: 0.1 }}
                >
                  {Array(6)
                    .fill(0)
                    .map((_, idx) => (
                      <motion.div
                        key={idx}
                        className='h-12 rounded-md bg-muted-foreground/20 flex items-center justify-center'
                        variants={itemVariants}
                        whileHover={{
                          y: -5,
                          transition: { type: 'spring', stiffness: 300 },
                        }}
                      >
                        <span className='text-xs text-muted-foreground'>
                          Logo
                        </span>
                      </motion.div>
                    ))}
                </motion.div>
              </div>
            </div>
          </motion.div>
        </section>

        <motion.section
          className='bg-muted py-12'
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.7, duration: 0.8 }}
        >
          <div className='container max-w-4xl mx-32'>
            <motion.h2
              className='text-2xl md:text-3xl font-bold text-center mb-8'
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.8 }}
            >
              Câu hỏi thường gặp
            </motion.h2>
            <motion.div
              className='space-y-4'
              variants={containerVariants}
              initial='hidden'
              animate='visible'
              transition={{ delayChildren: 1.9, staggerChildren: 0.15 }}
            >
              <motion.div
                className='bg-card rounded-lg p-4 border'
                variants={itemVariants}
                whileHover={{ scale: 1.01 }}
              >
                <h3 className='font-semibold mb-2'>
                  Tôi có thể thay đổi gói membership không?
                </h3>
                <p className='text-muted-foreground'>
                  Vâng, bạn có thể dễ dàng nâng cấp hoặc hạ cấp gói membership
                  bất kỳ lúc nào. Những thay đổi sẽ có hiệu lực vào kỳ thanh
                  toán tiếp theo.
                </p>
              </motion.div>
              <motion.div
                className='bg-card rounded-lg p-4 border'
                variants={itemVariants}
                whileHover={{ scale: 1.01 }}
              >
                <h3 className='font-semibold mb-2'>
                  Chính sách hoàn tiền như thế nào?
                </h3>
                <p className='text-muted-foreground'>
                  Chúng tôi cung cấp chính sách hoàn tiền 14 ngày cho tất cả các
                  gói membership mới. Nếu bạn không hài lòng, hãy liên hệ với
                  chúng tôi để được hỗ trợ.
                </p>
              </motion.div>
              <motion.div
                className='bg-card rounded-lg p-4 border'
                variants={itemVariants}
                whileHover={{ scale: 1.01 }}
              >
                <h3 className='font-semibold mb-2'>
                  Tôi có thể thanh toán bằng những phương thức nào?
                </h3>
                <p className='text-muted-foreground'>
                  Chúng tôi chấp nhận thanh toán qua thẻ tín dụng/ghi nợ quốc
                  tế, chuyển khoản ngân hàng, và các ví điện tử phổ biến tại
                  Việt Nam như Momo, VNPay, ZaloPay.
                </p>
              </motion.div>
              <motion.div
                className='bg-card rounded-lg p-4 border'
                variants={itemVariants}
                whileHover={{ scale: 1.01 }}
              >
                <h3 className='font-semibold mb-2'>
                  Tôi cần hỗ trợ thêm, liên hệ như thế nào?
                </h3>
                <p className='text-muted-foreground'>
                  Đội ngũ hỗ trợ của chúng tôi luôn sẵn sàng giúp đỡ qua email
                  support@preziq.com hoặc chat trực tuyến trên website. Khách
                  hàng các gói Bạch Kim và Kim Cương được hỗ trợ qua điện thoại.
                </p>
              </motion.div>
            </motion.div>
          </div>
        </motion.section>
      </main>
      <Footer />
    </div>
  );
};

export default MembershipPlansPage;
