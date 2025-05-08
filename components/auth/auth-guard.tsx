'use client';

import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface AuthGuardProps {
    children: React.ReactNode;
}

/**
 * AuthGuard component - Protects routes that require authentication
 * @param children - The content to render if user is authenticated
 */
export default function AuthGuard({ children }: AuthGuardProps) {
    const { isLoggedIn } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isLoggedIn) {
            router.push('/auth/login');
        }
    }, [isLoggedIn, router]);

    // Only render children if user is logged in
    if (!isLoggedIn) {
        return null;
    }

    return <>{children}</>;
} 