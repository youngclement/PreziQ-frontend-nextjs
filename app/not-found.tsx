"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useEffect } from "react";
import Logo from "@/components/common/logo";

export default function NotFound() {
  useEffect(() => {
    // You can add animations or logging here
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
      <div className="mb-8">
        <Logo />
      </div>

      <h1 className="mb-4 text-6xl font-bold tracking-tight text-primary">404</h1>
      <h2 className="mb-6 text-3xl font-medium text-muted-foreground">Page Not Found</h2>

      <p className="mb-8 max-w-md text-muted-foreground">
        The page you're looking for doesn't exist or has been moved to another location.
      </p>

      <div className="space-x-4">
        <Button asChild size="lg">
          <Link href="/">
            Go Home
          </Link>
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link href="/auth/login">
            Sign In
          </Link>
        </Button>
      </div>
    </div>
  );
}