'use client';

import React, { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import BgDark from '../image/bg-dark2.jpg';
import BgLight from '../image/bg-light2.jpeg';
import { useRouter, usePathname } from 'next/navigation';
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Use a fallback image before client-side rendering
  // You could use one of your imported images as the default
  let backgroundImage = BgLight.src; // Default to light theme

  // Only change the image after component is mounted client-side
  if (mounted) {
    backgroundImage =
      resolvedTheme === 'dark'
        ? BgDark.src // Use the imported dark image
        : BgLight.src; // Use the imported light image
  }
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const accessToken = localStorage.getItem('accessToken');

    if (accessToken && pathname.startsWith('/auth/login')) {
      router.push('/');
    }
  }, [pathname, router]);

  return (
    <div className="min-h-screen bg-background">
      <section className="bg-card">
        <div className="lg:grid lg:min-h-screen lg:grid-cols-12">
          <aside className="relative block h-16 lg:order-first lg:col-span-5 lg:h-full xl:col-span-6">
            {/* Add a fade-in transition effect */}
            <div className="absolute inset-0 overflow-hidden">
              <img
                src={backgroundImage}
                alt="Auth background"
                className="absolute inset-0 h-full w-full object-cover transition-opacity duration-500"
              />

              {/* Optional overlay to adjust image brightness based on theme */}
              <div
                className={`absolute inset-0 ${resolvedTheme === 'dark'
                    ? 'bg-black/20' // Slightly darken image in dark mode
                    : 'bg-white/10' // Slightly brighten in light mode
                  }`}
              />
            </div>

            {/* Optional: Add a subtle brand element or message */}
            <div className="absolute bottom-6 left-6 z-10">
              <div className="text-white text-shadow-sm">
                <h2 className="text-xl font-semibold">PreziQ</h2>
                <p className="text-sm opacity-80">
                  Create stunning presentations with PreziQ{' '}
                </p>
              </div>
            </div>
          </aside>
          {children}
        </div>
      </section>
    </div>
  );
}
