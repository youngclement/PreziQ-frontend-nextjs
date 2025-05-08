'use client';

import React from 'react';
import PageLayout from '@/components/layout/page-layout';

export default function CollectionLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <PageLayout title="Question Editor" fullWidth noPadding collectionPage>
            {children}
        </PageLayout>
    );
} 