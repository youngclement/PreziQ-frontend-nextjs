"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useEffect } from "react";
import { Shield } from "lucide-react";
import Logo from "@/components/common/logo";

export default function Forbidden() {
  useEffect(() => {
    // You can add analytics tracking or other effects here
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
      <div className="mb-8">
        <Logo />
      </div>

      <div className="mb-6 flex justify-center">
        <Shield size={64} className="text-destructive" />
      </div>

      <h1 className="mb-4 text-5xl font-bold tracking-tight text-primary">Access Denied</h1>
      <h2 className="mb-6 text-2xl font-medium text-muted-foreground">You don't have permission to access this page</h2>

      <p className="mb-8 max-w-md text-muted-foreground">
        This area is restricted. Please contact an administrator if you believe this is an error.
      </p>

      <div className="space-x-4">
        <Button asChild size="lg">
          <Link href="/">
            Return Home
          </Link>
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link href="/auth/login">
            Sign In with Different Account
          </Link>
        </Button>
      </div>
    </div>
  );
}