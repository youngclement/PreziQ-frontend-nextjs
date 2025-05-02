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
      name: 'Silver',
      description: 'Perfect for beginners and small teams',
      priceMonthly: '99.000',
      priceYearly: '999.000',
      features: [
        { name: 'Create up to 10 presentations', included: true },
        { name: 'Access to 20+ basic templates', included: true },
        { name: 'Basic AI support', included: true },
        { name: 'PDF export', included: true },
        { name: 'Collaborative editing (2 users)', included: true },
        { name: 'Basic viewer analytics', included: false },
        { name: 'Priority technical support', included: false },
        { name: 'Advanced features', included: false },
      ],
      color: 'border-slate-300 bg-slate-50 dark:bg-slate-900/30',
      buttonVariant: 'outline' as const,
    },
    {
      name: 'Gold',
      description: 'Optimal solution for teams and small businesses',
      priceMonthly: '199.000',
      priceYearly: '1.999.000',
      features: [
        { name: 'Create up to 30 presentations', included: true },
        { name: 'Access to 50+ professional templates', included: true },
        { name: 'Advanced AI support', included: true },
        { name: 'PDF, PPT and other format exports', included: true },
        { name: 'Collaborative editing (5 users)', included: true },
        { name: 'Basic viewer analytics', included: true },
        { name: 'Priority technical support', included: false },
        { name: 'Advanced features', included: false },
      ],
      color: 'border-yellow-300 bg-yellow-50 dark:bg-yellow-900/30',
      buttonVariant: 'secondary' as const,
    },
    {
      name: 'Platinum',
      description: 'For businesses with professional needs',
      priceMonthly: '299.000',
      priceYearly: '2.999.000',
      features: [
        { name: 'Unlimited presentations', included: true },
        { name: 'Access to all premium templates', included: true },
        { name: 'Comprehensive AI support', included: true },
        { name: 'Export all formats, high quality', included: true },
        { name: 'Unlimited collaborative editing', included: true },
        { name: 'Advanced viewer analytics', included: true },
        { name: '24/7 priority technical support', included: true },
        { name: 'Advanced features', included: true },
      ],
      color: 'border-slate-400 bg-slate-100 dark:bg-slate-800/50',
      buttonVariant: 'default' as const,
      isPopular: true,
    },
    {
      name: 'Diamond',
      description: 'Optimal solution for large businesses',
      priceMonthly: '599.000',
      priceYearly: '5.999.000',
      features: [
        { name: 'All Platinum features', included: true },
        { name: 'Complete brand customization', included: true },
        { name: 'Enterprise API integration', included: true },
        { name: 'Team management and permissions', included: true },
        { name: 'In-depth analytical reporting', included: true },
        { name: '1-on-1 training sessions', included: true },
        { name: 'Dedicated account manager', included: true },
        { name: 'Private data storage', included: true },
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
              Choose Your Membership
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
              Elevate your presentations with PreziQ's diverse plans, suitable
              for all needs
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
                <TabsTrigger value='monthly'>Monthly Billing</TabsTrigger>
                <TabsTrigger value='yearly'>
                  Annual Billing
                  <motion.span
                    className='ml-1.5 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-400'
                    initial={{ scale: 0.8 }}
                    animate={{ scale: [0.8, 1.05, 1] }}
                    transition={{ delay: 0.8, duration: 0.5 }}
                  >
                    Save {discount}%
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
                      {plan.isPopular ? 'Most Popular' : 'Enterprise'}
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
                        /{billingCycle === 'yearly' ? 'year' : 'month'}
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
                  <CardFooter className='mt-auto'>
                    <Link
                      href={`/membership/payment?plan=${plan.name.toLowerCase()}&billing=${billingCycle}`}
                      className='w-full'
                    >
                      <Button
                        variant={plan.buttonVariant}
                        className='w-full transition-all'
                      >
                        Sign Up Now
                      </Button>
                    </Link>
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
                  Need a custom solution?
                </motion.h2>
                <motion.p
                  className='text-muted-foreground mb-4'
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.4 }}
                >
                  We offer customized packages for businesses with specific
                  needs. Contact our sales team for a consultation.
                </motion.p>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button asChild>
                    <Link href='/contact'>Contact Sales</Link>
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
                  Trusted by
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
              Frequently Asked Questions
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
                  Can I change my membership plan?
                </h3>
                <p className='text-muted-foreground'>
                  Yes, you can easily upgrade or downgrade your membership plan
                  at any time. Changes will take effect on your next billing
                  cycle.
                </p>
              </motion.div>
              <motion.div
                className='bg-card rounded-lg p-4 border'
                variants={itemVariants}
                whileHover={{ scale: 1.01 }}
              >
                <h3 className='font-semibold mb-2'>
                  What is the refund policy?
                </h3>
                <p className='text-muted-foreground'>
                  We offer a 14-day money-back guarantee for all new membership
                  plans. If you're not satisfied, please contact us for
                  assistance.
                </p>
              </motion.div>
              <motion.div
                className='bg-card rounded-lg p-4 border'
                variants={itemVariants}
                whileHover={{ scale: 1.01 }}
              >
                <h3 className='font-semibold mb-2'>
                  What payment methods are accepted?
                </h3>
                <p className='text-muted-foreground'>
                  We accept payment via international credit/debit cards, bank
                  transfers, and popular e-wallets like Momo, VNPay, and
                  ZaloPay.
                </p>
              </motion.div>
              <motion.div
                className='bg-card rounded-lg p-4 border'
                variants={itemVariants}
                whileHover={{ scale: 1.01 }}
              >
                <h3 className='font-semibold mb-2'>
                  How can I get additional support?
                </h3>
                <p className='text-muted-foreground'>
                  Our support team is always ready to help via email at
                  support@preziq.com or through live chat on our website.
                  Platinum and Diamond customers receive phone support.
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
