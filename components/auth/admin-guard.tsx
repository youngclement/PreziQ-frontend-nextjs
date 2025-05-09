'use client';

import { useAuth } from '@/contexts/auth-context';
import { ReactNode, useEffect, useState } from 'react';
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
    const { hasRole, isLoggedIn, user } = useAuth();
    const router = useRouter();
    const [isChecking, setIsChecking] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        // Only proceed if we know the user's login state for sure
        // For logged in users, wait until user data is available
        if (!isLoggedIn || (isLoggedIn && user !== null)) {
            const adminCheck = hasRole('ADMIN');

            setIsAdmin(adminCheck);
            setIsChecking(false);

            // Only redirect if user is definitely logged in, not an admin, and we don't have fallback content
            if (!fallback && isLoggedIn && !adminCheck) {
                router.push('/forbidden');
            }
        }
    }, [fallback, hasRole, isLoggedIn, router, user]);

    // Show loading while checking permissions
    if (isChecking) {
        return null; // Or a loading spinner if preferred
    }

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