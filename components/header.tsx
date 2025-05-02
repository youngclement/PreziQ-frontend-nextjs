'use client';

import React, { useEffect, useState } from 'react';
import { Menu, LogIn, Moon, Sun } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useTheme } from 'next-themes';
import UserMenu from './user-menu';
import { useAuth } from '@/contexts/auth-context';

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
    title: 'Features',
    href: '#',
    children: [
      { title: 'AI Presentation Builder', href: '#' },
      { title: 'Design Templates', href: '#' },
      { title: 'Real-time Collaboration', href: '#' },
    ],
  },
  {
    title: 'Use Cases',
    href: '#',
    children: [
      { title: 'Marketing Teams', href: '#' },
      { title: 'Sales Professionals', href: '#' },
      { title: 'Education', href: '#' },
    ],
  },
  { title: 'Pricing', href: '/membership' },
  { title: 'Achievements', href: '/achievements' },
  { title: 'Testimonials', href: '#testimonials' },
  { title: 'FAQ', href: '#faq' },
  { title: 'Blog', href: '/blog' },
];

const MobileNav = () => (
  <Sheet>
    <SheetTrigger asChild>
      <Button variant='ghost' size='icon' className='md:hidden'>
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
                <div className='font-medium mb-2'>{item.title}</div>
                <div className='pl-4 flex flex-col gap-2'>
                  {item.children.map((child) => (
                    <Link
                      key={child.title}
                      href={child.href}
                      className='text-sm text-muted-foreground hover:text-foreground transition-colors'
                    >
                      {child.title}
                    </Link>
                  ))}
                </div>
              </>
            ) : (
              <Link
                href={item.href}
                className='font-medium hover:text-highlight transition-colors'
              >
                {item.title}
              </Link>
            )}
          </div>
        ))}
      </nav>
      <div className='mt-8 space-y-3'>
        <Button variant='outline' className='w-full justify-center' asChild>
          <Link href='/auth/login'>
            <LogIn className='mr-2 h-4 w-4' /> Sign In
          </Link>
        </Button>
        <Button className='w-full justify-center' asChild>
          <Link href='/auth/register'>Sign Up Free</Link>
        </Button>
      </div>
    </SheetContent>
  </Sheet>
);

const DesktopNav = () => (
  <NavigationMenu className='hidden md:flex'>
    <NavigationMenuList className='gap-1'>
      {navItems.map((item) => (
        <NavigationMenuItem key={item.title}>
          {item.children ? (
            <>
              <NavigationMenuTrigger className='bg-transparent hover:bg-accent/50'>
                {item.title}
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
                        {child.title}
                      </div>
                    </NavigationMenuLink>
                  ))}
                </div>
              </NavigationMenuContent>
            </>
          ) : (
            <Link
              href={item.href}
              className='group inline-flex h-10 w-max items-center justify-center px-4 py-2 text-sm font-medium transition-colors hover:text-highlight focus:text-highlight focus:outline-none'
            >
              {item.title}
            </Link>
          )}
        </NavigationMenuItem>
      ))}
    </NavigationMenuList>
  </NavigationMenu>
);

const Header = () => {
  const [scroll, setScroll] = useState(false);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { isLoggedIn } = useAuth();
  // Handle scroll logic
  const handleScroll = () => {
    if (window.scrollY > 20) {
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
  }, []);

  return (
    <div className='fixed top-0 left-0 right-0 z-50 px-4 py-3'>
      <header
        className={cn(
          'mx-auto max-w-7xl rounded-full border border-border/40 bg-background/60 px-4 backdrop-blur-md transition-all duration-300',
          scroll ? 'shadow-lg shadow-primary/5' : 'bg-background/30'
        )}
      >
        <div className='flex h-14 items-center justify-between'>
          <div className='flex items-center gap-4'>
            <Logo />
            <DesktopNav />
          </div>

          <div className='flex items-center gap-3'>
            <Button
              variant='ghost'
              size='icon'
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className='hover:bg-muted rounded-full h-9 w-9 flex items-center justify-center'
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
                  <InteractiveHoverButton>Sign In</InteractiveHoverButton>
                </Link>
              </div>
            )}
            <MobileNav />
          </div>
        </div>
      </header>
    </div>
  );
};

export default Header;
