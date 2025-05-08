"use client";

import React from 'react';
import { Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import DefaultLayout from '../default-layout';

export default function ForbiddenPage() {
  const router = useRouter();

  return (
    <DefaultLayout showBackButton={false} title="Access Denied">
      <div className="container max-w-md mx-auto px-4 py-16 flex flex-col items-center justify-center text-center">
        <Shield className="text-red-500 w-16 h-16 mb-6" />
        <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
        <p className="text-muted-foreground mb-8">
          You don't have permission to access this area. This section requires administrator privileges.
        </p>
        <div className="flex gap-4">
          <Button
            onClick={() => router.push('/')}
            variant="outline"
            className="mx-auto"
          >
            Go to Home
          </Button>
        </div>
      </div>
    </DefaultLayout>
  );
}