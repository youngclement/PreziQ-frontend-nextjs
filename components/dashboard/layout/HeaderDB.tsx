'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { LanguageSwitcher } from '@/components/language-switcher';

interface HeaderProps extends React.HTMLAttributes<HTMLElement> {
  fixed?: boolean;
}

export function Header({ className, fixed, children, ...props }: HeaderProps) {
  return (
    <header
      className={cn(
        'z-40 bg-background',
        fixed ? 'sticky top-0' : 'relative',
        className
      )}
      {...props}
    >
      <div className="container flex h-16 items-center gap-4">
        <SidebarTrigger />
        <Separator orientation="vertical" className="h-6" />
        {children}
        <div className="ml-auto flex items-center gap-4">
          <LanguageSwitcher variant="minimal" />
        </div>
      </div>
    </header>
  );
}

Header.displayName = 'Header';
