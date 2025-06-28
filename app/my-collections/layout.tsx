'use client';

import React from 'react';
import PageLayout from '@/components/layout/page-layout';
import SimpleHeader from '@/components/simple-header';
export default function MyCollectionsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <SimpleHeader />
      <PageLayout title='My Collections' fullWidth>
        {children}
      </PageLayout>
    </>
  );
}
