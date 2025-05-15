'use client';

import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/language-context';
import { Button } from '@/components/ui/button';
import { Globe, Check } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { useTheme } from 'next-themes';
import { usePathname } from 'next/navigation';

export default function LanguageToggle({ className }: { className?: string }) {
    const { language, setLanguage } = useLanguage();
    const [mounted, setMounted] = useState(false);
    const [scroll, setScroll] = useState(false);
    const { theme } = useTheme();
    const pathname = usePathname();

    // Check if we're on the home page and adjust badge accordingly
    const isHomePage = pathname === '/';

    useEffect(() => {
        setMounted(true);

        const handleScroll = () => {
            // Use same scroll threshold as header
            const scrollThreshold = isHomePage ? window.innerHeight * 0.8 : 20;
            if (window.scrollY > scrollThreshold) {
                setScroll(true);
            } else {
                setScroll(false);
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, [isHomePage]);

    // If not mounted yet, render a placeholder with same dimensions
    if (!mounted) {
        return (
            <Button
                variant="ghost"
                size="icon"
                className={cn('hover:bg-muted rounded-full h-9 w-9 flex items-center justify-center', className)}
                aria-label="Toggle language"
            >
                <Globe className="h-4 w-4" />
            </Button>
        );
    }

    // Determine if we're in transparent mode (home page, not scrolled, dark theme)
    const isTransparent = isHomePage && !scroll && theme === 'dark';

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className={cn('hover:bg-muted rounded-full h-9 w-9 flex items-center justify-center relative', className)}
                    aria-label="Toggle language"
                >
                    <Globe className={cn("h-4 w-4", className)} />
                    <span className={cn(
                        "absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold",
                        isTransparent
                            ? "bg-white text-black"
                            : "bg-primary text-primary-foreground"
                    )}>
                        {language.toUpperCase()}
                    </span>
                    <span className="sr-only">Toggle language</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem
                    className={cn('cursor-pointer flex items-center justify-between', language === 'en' && 'bg-accent')}
                    onClick={() => setLanguage('en')}
                >
                    <span>English</span>
                    {language === 'en' && <Check className="h-4 w-4 ml-2" />}
                </DropdownMenuItem>
                <DropdownMenuItem
                    className={cn('cursor-pointer flex items-center justify-between', language === 'vi' && 'bg-accent')}
                    onClick={() => setLanguage('vi')}
                >
                    <span>Tiếng Việt</span>
                    {language === 'vi' && <Check className="h-4 w-4 ml-2" />}
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
} 