'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface LoadingIndicatorProps {
    variant?: 'default' | 'overlay' | 'inline' | 'page';
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
    text?: string;
    className?: string;
}

const sizeClasses = {
    xs: 'h-3 w-3',
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
    xl: 'h-12 w-12',
};

const textClasses = {
    xs: 'text-xs',
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
};

export const LoadingIndicator = ({
    variant = 'default',
    size = 'md',
    text,
    className,
}: LoadingIndicatorProps) => {
    // Base spinner component
    const Spinner = (
        <Loader2
            className={cn(
                "animate-spin text-primary",
                sizeClasses[size]
            )}
        />
    );

    // For inline usage (within buttons or text)
    if (variant === 'inline') {
        return (
            <div className={cn("inline-flex items-center gap-2", className)}>
                {Spinner}
                {text && <span className={cn(textClasses[size])}>{text}</span>}
            </div>
        );
    }

    // For overlay usage (over content)
    if (variant === 'overlay') {
        return (
            <div className={cn(
                "absolute inset-0 flex flex-col items-center justify-center bg-white/80 dark:bg-black/80 backdrop-blur-sm z-50",
                className
            )}>
                {Spinner}
                {text && <span className={cn("mt-2 font-medium", textClasses[size])}>{text}</span>}
            </div>
        );
    }

    // For full page loading
    if (variant === 'page') {
        return (
            <div className={cn(
                "fixed inset-0 flex flex-col items-center justify-center bg-white/90 dark:bg-gray-950/90 backdrop-blur-sm z-50",
                className
            )}>
                {Spinner}
                {text && <span className={cn("mt-2 font-medium", textClasses[size])}>{text}</span>}
            </div>
        );
    }

    // Default centered loading
    return (
        <div className={cn("flex flex-col items-center justify-center p-4", className)}>
            {Spinner}
            {text && <span className={cn("mt-2 font-medium", textClasses[size])}>{text}</span>}
        </div>
    );
};

export default LoadingIndicator;