"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { CheckCircle2, Mail, Lock, User } from "lucide-react";
import { useRouter } from "next/navigation";

const tabVariants = {
  hidden: { opacity: 0, x: 10 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.2 } }
};

interface SignUpFormProps {
  isLoading: boolean;
  setIsLoading: (isLoading: boolean) => void;
}

export default function SignUpForm({ isLoading, setIsLoading }: SignUpFormProps) {
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Implement your registration logic here
    setTimeout(() => {
      setIsLoading(false);
      router.push("/auth/sign-in");
    }, 1000);
  };

  return (
    <motion.form
      onSubmit={handleRegister}
      variants={tabVariants}
      initial="hidden"
      animate="visible"
      className="space-y-4"
    >
      <div className="space-y-2">
        <Label htmlFor="username">Full Name</Label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="username"
            placeholder="John Doe"
            className="pl-10"
            required
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="register-email">Email</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="register-email"
            placeholder="name@example.com"
            type="email"
            className="pl-10"
            required
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="register-password">Password</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="register-password"
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
            Creating account...
          </span>
        ) : (
          <span className="flex items-center gap-2">
            Create Account
            <CheckCircle2 className="h-4 w-4" />
          </span>
        )}
      </Button>
    </motion.form>
  );
}