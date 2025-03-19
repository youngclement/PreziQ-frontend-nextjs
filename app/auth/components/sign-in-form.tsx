"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { LucideChevronRight, Mail, Lock } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const tabVariants = {
  hidden: { opacity: 0, x: 10 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.2 } }
};

interface SignInFormProps {
  isLoading: boolean;
  setIsLoading: (isLoading: boolean) => void;
}

export default function SignInForm({ isLoading, setIsLoading }: SignInFormProps) {
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Implement your login logic here
    setTimeout(() => {
      setIsLoading(false);
      router.push("/");
    }, 1000);
  };

  return (
    <motion.form
      onSubmit={handleLogin}
      variants={tabVariants}
      initial="hidden"
      animate="visible"
      className="space-y-4"
    >
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="email"
            placeholder="name@example.com"
            type="email"
            className="pl-10"
            required
          />
        </div>
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Password</Label>
          <Link href="/forgot-password" className="text-sm text-primary hover:underline">
            Forgot password?
          </Link>
        </div>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="password"
            type="password"
            className="pl-10"
            required
          />
        </div>
      </div>
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? (
          <span className="flex items-center gap-2">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent"></span>
            Signing in...
          </span>
        ) : (
          <span className="flex items-center gap-2">
            Sign In
            <LucideChevronRight className="h-4 w-4" />
          </span>
        )}
      </Button>
    </motion.form>
  );
}