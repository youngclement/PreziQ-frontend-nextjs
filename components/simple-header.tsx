'use client';

import React, { useEffect, useState } from 'react';
import { Menu, Moon, Sun, User, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useTheme } from 'next-themes';

import Logo from './common/logo';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import UserMenu from './user-menu';
import { useAuth } from '@/contexts/auth-context';

interface SimpleHeaderProps {
    showBackButton?: boolean;
    title?: string;
}

const SimpleHeader = ({ showBackButton = false, title }: SimpleHeaderProps) => {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    const { isLoggedIn } = useAuth();
    const router = useRouter();

    useEffect(() => {
        setMounted(true);
    }, []);

    return (
        <div className="fixed top-0 left-0 right-0 z-50 border-b border-border/40 bg-background/95 backdrop-blur-sm overflow-hidden">
            <header className="h-[52px] w-full flex items-center justify-between px-4 overflow-hidden">
                <div className="flex items-center gap-3">
                    {showBackButton && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => router.back()}
                            className="rounded-full mr-1"
                        >
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    )}
                    <Link href="/">
                        <Logo variant="default" size="sm" />
                    </Link>
                    {title && (
                        <div className="h-5 w-px bg-gray-300 dark:bg-gray-700 mx-2" />
                    )}
                    {title && (
                        <h1 className="text-sm font-medium">{title}</h1>
                    )}
                </div>

                <div className="flex items-center gap-1">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                        className="rounded-full h-8 w-8 flex items-center justify-center"
                        aria-label="Toggle theme"
                    >
                        {mounted && (theme === 'dark' ? (
                            <Sun className="h-4 w-4" />
                        ) : (
                            <Moon className="h-4 w-4" />
                        ))}
                    </Button>

                    {isLoggedIn ? (
                        <UserMenu />
                    ) : (
                        <Button variant="ghost" size="icon" className="rounded-full" asChild>
                            <Link href="/auth/login">
                                <User className="h-4 w-4" />
                            </Link>
                        </Button>
                    )}
                </div>
            </header>
        </div>
    );
};

export default SimpleHeader; 