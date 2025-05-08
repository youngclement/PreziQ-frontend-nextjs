'use client';

import React from 'react';
import SimpleHeader from '../simple-header';

interface PageLayoutProps {
    children: React.ReactNode;
    showBackButton?: boolean;
    title?: string;
    fullWidth?: boolean;
    noPadding?: boolean;
    collectionPage?: boolean;
}

const PageLayout = ({
    children,
    showBackButton = false,
    title,
    fullWidth = false,
    noPadding = false,
    collectionPage = false
}: PageLayoutProps) => {
    return (
        <div className={`min-h-screen flex flex-col ${collectionPage ? 'overflow-hidden' : ''}`}>
            <SimpleHeader showBackButton={showBackButton} title={title} />

            <main className={`flex-1 ${!noPadding ? 'pt-[52px]' : 'mt-[52px]'} ${collectionPage ? 'p-0 overflow-hidden' : ''}`}>
                <div className={`${fullWidth ? 'w-full' : 'container mx-auto px-4 md:px-6'} ${!noPadding && !collectionPage ? 'py-4' : ''} ${collectionPage ? 'h-full overflow-hidden' : ''}`}>
                    {children}
                </div>
            </main>
        </div>
    );
};

export default PageLayout; 