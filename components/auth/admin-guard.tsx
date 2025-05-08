'use client';

import { useAuth } from '@/contexts/auth-context';
import { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface AdminGuardProps {
    children: ReactNode;
    fallback?: ReactNode;
}

/**
 * AdminGuard component to protect content that should only be visible to admin users.
 * If the user is not an admin, they will be shown the fallback content or redirected to the forbidden page.
 */
export function AdminGuard({ children, fallback }: AdminGuardProps) {
    const { hasRole, isLoggedIn } = useAuth();
    const router = useRouter();
    const isAdmin = hasRole('ADMIN');

    useEffect(() => {
        // Only redirect if not showing fallback content and user is definitely not an admin
        if (!fallback && isLoggedIn && !isAdmin) {
            router.push('/forbidden');
        }
    }, [fallback, isAdmin, isLoggedIn, router]);

    // If user is an admin, show the protected content
    if (isAdmin) {
        return <>{children}</>;
    }

    // If fallback is provided, show it instead of redirecting
    if (fallback) {
        return <>{fallback}</>;
    }

    // Return null while the redirect happens
    return null;
} 