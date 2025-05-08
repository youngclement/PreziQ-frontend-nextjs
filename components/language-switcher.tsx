'use client';

import React, { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/language-context';
import { Button } from '@/components/ui/button';
import { Globe, Check } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuLabel,
    DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { useTheme } from 'next-themes';

export interface LanguageSwitcherProps {
    className?: string;
    variant?: 'default' | 'minimal' | 'text';
    align?: 'start' | 'center' | 'end';
    showLabel?: boolean;
}

export function LanguageSwitcher({
    className,
    variant = 'default',
    align = 'end',
    showLabel = false,
}: LanguageSwitcherProps) {
    const { language, setLanguage, t } = useLanguage();
    const { theme } = useTheme();
    const [mounted, setMounted] = useState(false);
    const [isChanging, setIsChanging] = useState(false);

    // Available languages
    const languages = [
        { code: 'en', label: 'English' },
        { code: 'vi', label: 'Tiếng Việt' },
    ];

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleLanguageChange = (lang: string) => {
        if (lang === language) return;

        setIsChanging(true);
        // Add a slight delay to make the transition smoother
        setTimeout(() => {
            setLanguage(lang);
            setIsChanging(false);
        }, 150);
    };

    // If not mounted, render a placeholder
    if (!mounted) {
        return (
            <Button
                variant="ghost"
                size="icon"
                className={cn('rounded-full h-9 w-9 flex items-center justify-center', className)}
                aria-label="Toggle language"
            >
                <Globe className="h-4 w-4" />
            </Button>
        );
    }

    if (variant === 'minimal') {
        return (
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="ghost"
                        size="icon"
                        className={cn('rounded-full flex items-center justify-center', className)}
                        aria-label="Change language"
                    >
                        <span className="sr-only">Change language</span>
                        <Globe className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align={align} className="w-40">
                    {languages.map((lang) => (
                        <DropdownMenuItem
                            key={lang.code}
                            className={cn(
                                'flex items-center justify-between cursor-pointer',
                                language === lang.code && 'bg-accent text-accent-foreground'
                            )}
                            onClick={() => handleLanguageChange(lang.code)}
                        >
                            <span>{lang.label}</span>
                            {language === lang.code && <Check className="h-4 w-4 ml-2" />}
                        </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>
        );
    }

    if (variant === 'text') {
        return (
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="ghost"
                        size="sm"
                        className={cn('gap-1.5', className)}
                    >
                        <Globe className="h-3.5 w-3.5" />
                        <span>{language === 'en' ? 'EN' : 'VI'}</span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align={align} className="w-40">
                    {languages.map((lang) => (
                        <DropdownMenuItem
                            key={lang.code}
                            className={cn(
                                'flex items-center justify-between cursor-pointer',
                                language === lang.code && 'bg-accent text-accent-foreground'
                            )}
                            onClick={() => handleLanguageChange(lang.code)}
                        >
                            <span>{lang.label}</span>
                            {language === lang.code && <Check className="h-4 w-4 ml-2" />}
                        </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>
        );
    }

    // Default variant
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                        'rounded-full h-9 w-9 flex items-center justify-center relative',
                        isChanging && 'opacity-50',
                        className
                    )}
                    aria-label="Toggle language"
                >
                    <Globe className="h-4 w-4" />
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                        {language.toUpperCase()}
                    </span>
                    <span className="sr-only">Toggle language</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align={align}>
                <DropdownMenuLabel>
                    {t('selectLanguage') || 'Select language'}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {languages.map((lang) => (
                    <DropdownMenuItem
                        key={lang.code}
                        className={cn(
                            'cursor-pointer flex items-center justify-between',
                            language === lang.code && 'bg-accent'
                        )}
                        onClick={() => handleLanguageChange(lang.code)}
                    >
                        <span>{lang.label}</span>
                        {language === lang.code && <Check className="h-4 w-4 ml-2" />}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
} 