'use client';

import { motion } from 'framer-motion';
import { Inter, Dancing_Script } from 'next/font/google';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { useTheme } from 'next-themes';
import { useEffect, useState, ReactNode } from 'react';
import { TypingAnimation } from '@/components/magicui/typing-animation';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

const dancingScript = Dancing_Script({
  subsets: ['latin'],
  weight: ['700'],
  variable: '--font-dancing-script',
});

function ElegantShape({
  className,
  delay = 0,
  width = 400,
  height = 100,
  rotate = 0,
  gradient = 'from-white/[0.08]',
  darkGradient = 'from-white/[0.08]',
}: {
  className?: string;
  delay?: number;
  width?: number;
  height?: number;
  rotate?: number;
  gradient?: string;
  darkGradient?: string;
}) {
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Wait until mounted to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Use mounted check to avoid hydration issues
  const isDark = mounted && (resolvedTheme === 'dark' || theme === 'dark');

  return (
    <motion.div
      initial={{
        opacity: 0,
        y: -150,
        rotate: rotate - 15,
      }}
      animate={{
        opacity: 1,
        y: 0,
        rotate: rotate,
      }}
      transition={{
        duration: 2.4,
        delay,
        ease: [0.23, 0.86, 0.39, 0.96],
        opacity: { duration: 1.2 },
      }}
      className={cn('absolute', className)}
    >
      <motion.div
        animate={{
          y: [0, 15, 0],
        }}
        transition={{
          duration: 12,
          repeat: Number.POSITIVE_INFINITY,
          ease: 'easeInOut',
        }}
        style={{
          width,
          height,
        }}
        className='relative'
      >
        <div
          className={cn(
            'absolute inset-0 rounded-full',
            'bg-gradient-to-r to-transparent',
            isDark ? darkGradient : gradient,
            'backdrop-blur-[2px]',
            isDark
              ? 'border-2 border-white/[0.15]'
              : 'border-2 border-black/[0.05]',
            isDark
              ? 'shadow-[0_8px_32px_0_rgba(255,255,255,0.1)]'
              : 'shadow-[0_8px_32px_0_rgba(0,0,0,0.05)]',
            'after:absolute after:inset-0 after:rounded-full',
            isDark
              ? 'after:bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.2),transparent_70%)]'
              : 'after:bg-[radial-gradient(circle_at_50%_50%,rgba(0,0,0,0.1),transparent_70%)]'
          )}
        />
      </motion.div>
    </motion.div>
  );
}

export default function HeroGeometric({
  badge = 'PreziQ',
  title1 = 'Elevate Your',
  title2 = 'Presentations',
  description = 'Crafting exceptional digital experiences through innovative design and cutting-edge technology.',
}: {
  badge?: string;
  title1?: string;
  title2?: ReactNode;
  description?: string;
}) {
  const fadeUpVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        duration: 1,
        delay: 0.5 + i * 0.2,
        ease: [0.25, 0.4, 0.25, 1],
      },
    }),
  };

  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Wait until mounted to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Use mounted check to avoid hydration issues
  const isDark = mounted && (resolvedTheme === 'dark' || theme === 'dark');

  // If not mounted yet, use a placeholder with the same dimensions to avoid layout shift
  if (!mounted) {
    return (
      <div className='relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-background' />
    );
  }

  return (
    <div
      className={cn(
        'relative min-h-screen w-full flex items-center justify-center overflow-hidden',
        'bg-background' // Use CSS variable from globals.css
      )}
    >
      {/* Background gradient */}
      <div
        className={cn(
          'absolute inset-0 blur-3xl',
          isDark
            ? 'bg-gradient-to-br from-indigo-500/[0.05] via-transparent to-rose-500/[0.05]'
            : 'bg-gradient-to-br from-indigo-500/[0.03] via-transparent to-rose-500/[0.03]'
        )}
      />

      <div className='absolute inset-0 overflow-hidden'>
        {/* Elegant shapes remain the same */}
        <ElegantShape
          delay={0.3}
          width={600}
          height={140}
          rotate={12}
          gradient='from-indigo-500/[0.08]'
          darkGradient='from-indigo-500/[0.15]'
          className='left-[-10%] md:left-[-5%] top-[15%] md:top-[20%]'
        />

        <ElegantShape
          delay={0.5}
          width={500}
          height={120}
          rotate={-15}
          gradient='from-rose-500/[0.08]'
          darkGradient='from-rose-500/[0.15]'
          className='right-[-5%] md:right-[0%] top-[70%] md:top-[75%]'
        />

        <ElegantShape
          delay={0.4}
          width={300}
          height={80}
          rotate={-8}
          gradient='from-violet-500/[0.08]'
          darkGradient='from-violet-500/[0.15]'
          className='left-[5%] md:left-[10%] bottom-[5%] md:bottom-[10%]'
        />

        <ElegantShape
          delay={0.6}
          width={200}
          height={60}
          rotate={20}
          gradient='from-amber-500/[0.08]'
          darkGradient='from-amber-500/[0.15]'
          className='right-[15%] md:right-[20%] top-[10%] md:top-[15%]'
        />

        <ElegantShape
          delay={0.7}
          width={150}
          height={40}
          rotate={-25}
          gradient='from-cyan-500/[0.08]'
          darkGradient='from-cyan-500/[0.15]'
          className='left-[20%] md:left-[25%] top-[5%] md:top-[10%]'
        />
      </div>

      <div className='relative z-10 container mx-auto px-4 md:px-6'>
        <div className='max-w-3xl mx-auto text-center'>
          <motion.div
            custom={0}
            variants={fadeUpVariants}
            initial='hidden'
            animate='visible'
            className={cn(
              'inline-flex items-center gap-2 px-3 py-1 rounded-full mb-8 md:mb-12',
              isDark
                ? 'bg-white/[0.03] border border-white/[0.08]'
                : 'bg-black/[0.03] border border-black/[0.08]'
            )}
          >
            {/* You can replace with your logo */}
            <Image
              src='/logo.png' // Update with your actual logo path
              alt={badge}
              width={20}
              height={20}
              onError={(e) => {
                // Fallback if image fails to load
                e.currentTarget.style.display = 'none';
              }}
            />
            <span className='text-sm tracking-wide text-foreground/60'>
              {badge}
            </span>
          </motion.div>

          <motion.div
            custom={1}
            variants={fadeUpVariants}
            initial='hidden'
            animate='visible'
          >
            <h1 className='text-4xl sm:text-6xl md:text-8xl font-bold mb-6 md:mb-8 tracking-tight'>
              <TypingAnimation
                className={cn(
                  'block bg-clip-text text-transparent',
                  isDark
                    ? 'bg-gradient-to-b from-white to-white/80'
                    : 'bg-gradient-to-b from-black to-black/80',
                  'text-4xl sm:text-6xl md:text-7xl leading-tight'
                )}
                delay={500}
                duration={50}
              >
                {title1}
              </TypingAnimation>

              <div
                className={cn(
                  'block mt-2 bg-clip-text text-transparent',
                  isDark
                    ? 'bg-gradient-to-r from-blue-300 via-purple-300 to-pink-300' // More vibrant colors for dark mode
                    : 'bg-gradient-to-r from-blue-500 via-purple-600 to-pink-500', // More vibrant colors for light mode
                  inter.className,
                  'text-4xl sm:text-6xl md:text-7xl leading-tight'
                )}
              >
                {title2}
              </div>
            </h1>
          </motion.div>

          <motion.div
            custom={2}
            variants={fadeUpVariants}
            initial='hidden'
            animate='visible'
          >
            <p
              className={cn(
                'mx-auto max-w-xl text-lg md:text-xl mb-8 md:mb-12',
                isDark ? 'text-white/70' : 'text-black/70'
              )}
            >
              {description}
            </p>
          </motion.div>

          <motion.div
            custom={3}
            variants={fadeUpVariants}
            initial='hidden'
            animate='visible'
            className='flex flex-col md:flex-row items-center justify-center gap-4'
          >
            <a
              href='#'
              className={cn(
                'px-6 py-3 rounded-lg font-medium',
                'bg-primary text-primary-foreground hover:bg-primary/90',
                'transition duration-300 ease-in-out',
                'flex items-center justify-center'
              )}
            >
              Start for free
            </a>
            <a
              href='/membership'
              className={cn(
                'px-6 py-3 rounded-lg font-medium',
                isDark
                  ? 'bg-white/5 hover:bg-white/10 text-white border border-white/10'
                  : 'bg-black/5 hover:bg-black/10 text-black border border-black/10',
                'transition duration-300 ease-in-out',
                'flex items-center justify-center'
              )}
            >
              Xem các gói membership
            </a>
          </motion.div>

          <motion.div
            custom={4}
            variants={fadeUpVariants}
            initial='hidden'
            animate='visible'
            className='w-full max-w-md mx-auto mt-8'
          >
            <div
              className={cn(
                'relative rounded-full overflow-hidden',
                isDark
                  ? 'bg-white/10 border border-white/20'
                  : 'bg-black/5 border border-black/10',
                'focus-within:ring-2 focus-within:ring-primary/50 transition-all'
              )}
            >
              <input
                type='text'
                placeholder='Search for presentations...'
                className={cn(
                  'w-full py-3 px-5 pr-12 bg-transparent text-foreground',
                  'placeholder:text-foreground/50 focus:outline-none'
                )}
              />
              <button
                className='absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-primary text-primary-foreground'
                aria-label='Search'
              >
                <svg
                  xmlns='http://www.w3.org/2000/svg'
                  width='16'
                  height='16'
                  viewBox='0 0 24 24'
                  fill='none'
                  stroke='currentColor'
                  strokeWidth='2'
                  strokeLinecap='round'
                  strokeLinejoin='round'
                >
                  <circle cx='11' cy='11' r='8'></circle>
                  <line x1='21' y1='21' x2='16.65' y2='16.65'></line>
                </svg>
              </button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Gradient overlay */}
      <div
        className={cn(
          'absolute inset-0 pointer-events-none',
          isDark
            ? 'bg-gradient-to-t from-black via-transparent to-black/80'
            : 'bg-gradient-to-t from-white via-transparent to-white/80'
        )}
      />
    </div>
  );
}
