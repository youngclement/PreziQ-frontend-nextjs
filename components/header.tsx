'use client';

import React, { useEffect, useState } from 'react';
import { Menu, LogIn, Moon, Sun } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useTheme } from 'next-themes';
import UserMenu from './user-menu';
import { useAuth } from '@/contexts/auth-context';
import LanguageToggle from './language-toggle';
import { useLanguage } from '@/contexts/language-context';
import { usePathname } from 'next/navigation';

import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/components/ui/navigation-menu';
import Link from 'next/link';
import Logo from './common/logo';
import { motion } from 'framer-motion';
import { InteractiveHoverButton } from './ui/button-hover-login';

// Theme toggle butt

type NavItem = {
  title: string;
  href: string;
  children?: NavItem[];
};

const navItems: NavItem[] = [
  {
    title: 'features',
    href: '#',
    children: [
      { title: 'aiPresentationBuilder', href: '#' },
      { title: 'designTemplates', href: '#' },
      { title: 'realtimeCollaboration', href: '#' },
    ],
  },
  {
    title: 'useCase',
    href: '#',
    children: [
      { title: 'marketingTeams', href: '#' },
      { title: 'salesProfessionals', href: '#' },
      { title: 'education', href: '#' },
    ],
  },
  { title: 'pricing', href: '/membership' },
  { title: 'achievements', href: '/achievements' },
  { title: 'testimonials', href: '#testimonials' },
  { title: 'faq', href: '#faq' },
  { title: 'blog', href: '/blog' },
];

const MobileNav = ({ isTransparent }: { isTransparent: boolean }) => {
  const { t } = useLanguage();

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant='ghost'
          size='icon'
          className={cn(
            'md:hidden',
            isTransparent ? 'text-white hover:bg-transparent' : 'hover:bg-muted'
          )}
        >
          <Menu className='h-6 w-6' />
        </Button>
      </SheetTrigger>
      <SheetContent side='right'>
        <div className='flex justify-start pt-4 pb-6'>
          <Logo variant='default' size='md' />
        </div>
        <nav className='flex flex-col gap-4'>
          {navItems.map((item) => (
            <div key={item.title}>
              {item.children ? (
                <>
                  <div className='font-medium mb-2'>{t(item.title)}</div>
                  <div className='pl-4 flex flex-col gap-2'>
                    {item.children.map((child) => (
                      <Link
                        key={child.title}
                        href={child.href}
                        className='text-sm text-muted-foreground hover:text-foreground transition-colors'
                      >
                        {t(child.title)}
                      </Link>
                    ))}
                  </div>
                </>
              ) : (
                <Link
                  href={item.href}
                  className='font-medium hover:text-highlight transition-colors'
                >
                  {t(item.title)}
                </Link>
              )}
            </div>
          ))}
        </nav>
        <div className='mt-8 space-y-3'>
          <Button variant='outline' className='w-full justify-center' asChild>
            <Link href='/auth/login'>
              <LogIn className='mr-2 h-4 w-4' /> {t('signIn')}
            </Link>
          </Button>
          <Button className='w-full justify-center' asChild>
            <Link href='/auth/register'>{t('signUp')}</Link>
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

const DesktopNav = ({ isTransparent }: { isTransparent: boolean }) => {
  const { t } = useLanguage();

  return (
    <NavigationMenu className='hidden md:flex'>
      <NavigationMenuList className='gap-1'>
        {navItems.map((item) => (
          <NavigationMenuItem key={item.title}>
            {item.children ? (
              <>
                <NavigationMenuTrigger
                  className={cn(
                    'bg-transparent',
                    isTransparent
                      ? 'hover:bg-transparent text-white'
                      : 'hover:bg-accent/50'
                  )}
                >
                  {t(item.title)}
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <div className='grid gap-3 p-4 w-[400px]'>
                    {item.children.map((child) => (
                      <NavigationMenuLink
                        key={child.title}
                        href={child.href}
                        className='block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground'
                      >
                        <div className='text-sm font-medium leading-none'>
                          {t(child.title)}
                        </div>
                      </NavigationMenuLink>
                    ))}
                  </div>
                </NavigationMenuContent>
              </>
            ) : (
              <Link
                href={item.href}
                className={cn(
                  'group inline-flex h-10 w-max items-center justify-center px-4 py-2 text-sm font-medium transition-colors focus:outline-none',
                  isTransparent
                    ? 'text-white hover:text-primary focus:text-primary'
                    : 'hover:text-highlight focus:text-highlight'
                )}
              >
                {t(item.title)}
              </Link>
            )}
          </NavigationMenuItem>
        ))}
      </NavigationMenuList>
    </NavigationMenu>
  );
};

const Header = () => {
  const [scroll, setScroll] = useState(false);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { isLoggedIn } = useAuth();
  const { t } = useLanguage();
  const pathname = usePathname();

  // Check if we're on the home page
  const isHomePage = pathname === '/';

  // Handle scroll logic
  const handleScroll = () => {
    // Use a higher threshold for the home page to wait until we're past the hero section
    const scrollThreshold = isHomePage ? window.innerHeight * 0.8 : 20;

    if (window.scrollY > scrollThreshold) {
      setScroll(true);
    } else {
      setScroll(false);
    }
  };

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    setMounted(true); // Set mounted to true after component mounts
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [isHomePage]);

  // Use different styling based on if we're on home page and if we've scrolled
  const isTransparent = isHomePage && !scroll;

  return (
    <div className={cn(
      'fixed top-0 left-0 right-0 z-50  transition-all duration-500',
      isTransparent ? 'px-0 pb-6' : 'px-4 py-3'
    )}>
      <header
        className={cn(
          'mx-auto transition-all duration-500 px-12',
          isTransparent
            ? 'w-full px-24 pt-4 backdrop-blur-[1px]'
            : 'max-w-7xl rounded-full border border-border/40 bg-background/60 px-4 backdrop-blur-md',
          scroll ? 'shadow-lg shadow-primary/5' : isTransparent ? '' : 'bg-background/30'
        )}
      >
        <div className='flex h-14 items-center justify-between'>
          <div className='flex items-center gap-4'>
            <Logo className={isTransparent ? 'text-white' : ''} />
            <DesktopNav isTransparent={isTransparent} />
          </div>

          <div className='flex items-center gap-3'>
            <LanguageToggle className={isTransparent ? 'text-white hover:bg-transparent' : ''} />
            <Button
              variant='ghost'
              size='icon'
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className={cn(
                'rounded-full h-9 w-9 flex items-center justify-center',
                isTransparent ? 'text-white hover:bg-transparent' : 'hover:bg-muted'
              )}
              aria-label='Toggle theme'
            >
              {mounted &&
                (theme === 'dark' ? (
                  <Sun className='h-4 w-4' />
                ) : (
                  <Moon className='h-4 w-4' />
                ))}
            </Button>
            {isLoggedIn ? (
              <UserMenu />
            ) : (
              <div className='hidden sm:block'>
                <Link href='/auth/login'>
                  <InteractiveHoverButton
                    className={isTransparent ? 'text-white border-white/20 bg-transparent hover:bg-white/5' : ''}
                  >
                    {t('signIn')}
                  </InteractiveHoverButton>
                </Link>
              </div>
            )}
            <MobileNav isTransparent={isTransparent} />
          </div>
        </div>
      </header>
    </div>
  );
};

export default Header;
