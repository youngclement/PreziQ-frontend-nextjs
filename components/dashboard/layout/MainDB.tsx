'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface MainProps extends React.HTMLAttributes<HTMLElement> {
  fixed?: boolean;
  ref?: React.Ref<HTMLElement>;
}

export function Main({ className, fixed, children, ...props }: MainProps) {
  return (
    <main
      className={cn(
        'flex flex-1 flex-col',
        fixed ? 'container' : 'p-4',
        className
      )}
      {...props}
    >
      {children}
    </main>
  );
}

Main.displayName = 'Main'; 