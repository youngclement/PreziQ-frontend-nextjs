'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ForgotPasswordPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to login page, as this dialog is meant to be opened from login
    router.push('/auth/login');
  }, [router]);

  return null;
}
