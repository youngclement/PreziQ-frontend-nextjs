'use client';

import { useAuth } from '@/contexts/auth-context';
import { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface RoleGuardProps {
    children: ReactNode;
    allowedRoles: string[];
    fallback?: ReactNode;
    redirectTo?: string;
}

/**
 * RoleGuard component to protect content that should only be visible to users with specific roles.
 * If the user doesn't have any of the allowed roles, they will be shown the fallback content
 * or redirected to the specified page (defaults to /forbidden).
 */
export function RoleGuard({
    children,
    allowedRoles,
    fallback,
    redirectTo = '/forbidden'
}: RoleGuardProps) {
    const { hasRole, isLoggedIn } = useAuth();
    const router = useRouter();

    // Check if user has any of the allowed roles
    const hasAllowedRole = allowedRoles.some(role => hasRole(role));

    useEffect(() => {
        // Only redirect if not showing fallback content and user definitely doesn't have allowed roles
        if (!fallback && isLoggedIn && !hasAllowedRole) {
            router.push(redirectTo);
        }
    }, [fallback, hasAllowedRole, isLoggedIn, redirectTo, router]);

    // If user has at least one of the allowed roles, show the protected content
    if (hasAllowedRole) {
        return <>{children}</>;
    }

    // If fallback is provided, show it instead of redirecting
    if (fallback) {
        return <>{fallback}</>;
    }

    // Return null while the redirect happens
    return null;
} 