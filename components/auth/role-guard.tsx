'use client';

import { useAuth } from '@/contexts/auth-context';
import { ReactNode, useEffect, useState } from 'react';
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
    const { hasRole, isLoggedIn, user } = useAuth();
    const router = useRouter();
    const [isChecking, setIsChecking] = useState(true);
    const [hasAllowedRole, setHasAllowedRole] = useState(false);

    useEffect(() => {
        // Only proceed if we know the user's login state for sure
        // For logged in users, wait until user data is available
        if (!isLoggedIn || (isLoggedIn && user !== null)) {
            const roleCheck = allowedRoles.some(role => hasRole(role));

            setHasAllowedRole(roleCheck);
            setIsChecking(false);

            // Only redirect if not showing fallback content and user definitely doesn't have allowed roles
            if (!fallback && isLoggedIn && !roleCheck) {
                router.push(redirectTo);
            }
        }
    }, [allowedRoles, fallback, hasRole, isLoggedIn, redirectTo, router, user]);

    // Show loading while checking permissions
    if (isChecking) {
        return null; // Or a loading spinner if preferred
    }

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