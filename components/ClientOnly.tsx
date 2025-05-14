'use client';

import { useEffect, useState } from 'react';

type ClientOnlyProps = {
    children: React.ReactNode;
};

/**
 * Component that renders its children only on the client-side,
 * preventing hydration issues with browser APIs like document and window.
 *
 * Use this to wrap components that use browser-only APIs to prevent
 * "document is not defined" errors during server-side rendering.
 */
export default function ClientOnly({ children }: ClientOnlyProps) {
    const [hasMounted, setHasMounted] = useState(false);

    // Only show the component after it has mounted on client
    useEffect(() => {
        setHasMounted(true);
    }, []);

    if (!hasMounted) {
        return null;
    }

    return <>{children}</>;
} 