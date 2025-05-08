'use client';

import React from 'react';
import PageLayout from '@/components/layout/page-layout';

export default function CollectionsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <PageLayout title="Collections" fullWidth>
            {children}
        </PageLayout>
    );
} 