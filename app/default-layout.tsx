'use client';

import React from 'react';
import SimpleHeader from '@/components/simple-header';

interface DefaultLayoutProps {
    children: React.ReactNode;
    showBackButton?: boolean;
    title?: string;
}

export default function DefaultLayout({
    children,
    showBackButton = false,
    title,
}: DefaultLayoutProps) {
    return (
        <>
            <SimpleHeader showBackButton={showBackButton} title={title} />
            <div className="pt-[52px]">
                {children}
            </div>
        </>
    );
} 