"use client";

import Link from "next/link";
import { HeartHandshake } from "lucide-react";
import { useState, useEffect } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Logo from "@/components/common/logo";

export default function LoginPage() {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const [formData, setFormData] = useState({
        email: "",
        phoneNumber: "",
        password: "",
    });

    const [loginMethod, setLoginMethod] = useState<"email" | "phone">("email");

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const toggleLoginMethod = () => {
        setLoginMethod(prev => prev === "email" ? "phone" : "email");
        // Reset the values when switching
        setFormData(prev => ({
            ...prev,
            email: loginMethod === "email" ? "" : prev.email,
            phoneNumber: loginMethod === "phone" ? "" : prev.phoneNumber
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Submit logic here
        console.log(formData);
    };

    // If not mounted yet, render a minimal placeholder to match server-side rendering
    if (!mounted) {
        return (
            <main className="flex items-center justify-center px-8 py-8 sm:px-12 lg:col-span-7 lg:px-16 lg:py-12 xl:col-span-6">
                <div className="max-w-xl lg:max-w-3xl">
                    <div className="h-10 w-32"></div> {/* Logo placeholder */}
                    <h1 className="mt-6 text-2xl font-bold sm:text-3xl md:text-4xl">
                        Welcome Back
                    </h1>
                    <p className="mt-4 leading-relaxed">
                        Sign in to your PreziQ account to continue creating and sharing amazing presentations.
                    </p>
                    {/* Form placeholder */}
                    <div className="mt-8 grid grid-cols-6 gap-6"></div>
                </div>
            </main>
        );
    }

    return (
        <main className="flex items-center justify-center px-8 py-8 sm:px-12 lg:col-span-7 lg:px-16 lg:py-12 xl:col-span-6">
            <div className="max-w-xl lg:max-w-3xl">
                <Link className="block text-blue-600" href="/">
                    <Logo />
                </Link>

                <h1 className="mt-6 text-2xl font-bold sm:text-3xl md:text-4xl flex items-center gap-4">
                    Welcome Back <HeartHandshake className="size-6" />
                </h1>

                <p className="mt-4 leading-relaxed">
                    Sign in to your PreziQ account to continue creating and sharing amazing presentations.
                </p>

                <form onSubmit={handleSubmit} className="mt-8 grid grid-cols-6 gap-6">
                    {loginMethod === "email" ? (
                        <div className="col-span-6">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                type="email"
                                id="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                className="mt-1 w-full rounded-md shadow-sm"
                                required
                            />
                        </div>
                    ) : (
                        <div className="col-span-6">
                            <Label htmlFor="phoneNumber">Phone Number</Label>
                            <Input
                                type="tel"
                                id="phoneNumber"
                                name="phoneNumber"
                                value={formData.phoneNumber}
                                onChange={handleChange}
                                className="mt-1 w-full rounded-md shadow-sm"
                                placeholder="e.g., 0886332809"
                                required
                            />
                        </div>
                    )}

                    <div className="col-span-6">
                        <Label htmlFor="password">Password</Label>
                        <Input
                            type="password"
                            id="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            className="mt-1 w-full rounded-md shadow-sm"
                            required
                        />
                    </div>

                    <div className="col-span-6">
                        <Button
                            type="button"
                            variant="link"
                            className="p-0 h-auto text-sm"
                            onClick={toggleLoginMethod}
                        >
                            Sign in with {loginMethod === "email" ? "phone number" : "email"} instead
                        </Button>
                    </div>

                    <div className="col-span-6 flex justify-between items-center">
                        <Button type="submit" className="px-10">Sign in</Button>
                        <Link href="/auth/forgot-password" className="text-sm text-primary underline">
                            Forgot password?
                        </Link>
                    </div>

                    <div className="col-span-6 text-center mt-4">
                        <p className="text-sm text-gray-500">
                            Don't have an account?{" "}
                            <Link href="/auth/register" className="underline text-primary">
                                Sign up
                            </Link>
                        </p>
                    </div>
                </form>
            </div>
        </main>
    );
}