"use client";

import Link from "next/link";
import { HeartHandshake } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import Logo from "@/components/common/logo";

export default function RegisterPage() {
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        phoneNumber: "",
        password: "",
        confirmPassword: "",
        subscribe: false,
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleCheckboxChange = (checked: boolean) => {
        setFormData(prev => ({
            ...prev,
            subscribe: checked
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Submit logic here
        console.log(formData);
    };

    return (
        <main className="flex items-center justify-center px-8 py-8 sm:px-12 lg:col-span-7 lg:px-16 lg:py-12 xl:col-span-6">
            <div className="max-w-xl lg:max-w-3xl">
                <Link className="block text-blue-600" href="/">
                    <Logo />
                </Link>

                <h1 className="mt-6 text-2xl flex items-center gap-4 font-bold sm:text-3xl md:text-4xl">
                    Welcome {isClient && <HeartHandshake className="size-6" />}
                </h1>

                <p className="mt-4 leading-relaxed">
                    Join PreziQ to explore amazing presentations and connect with like-minded creators.
                </p>

                <form onSubmit={handleSubmit} className="mt-8 grid grid-cols-6 gap-6">
                    <div className="col-span-6 sm:col-span-3">
                        <Label htmlFor="firstName">First Name</Label>
                        <Input
                            type="text"
                            id="firstName"
                            name="firstName"
                            value={formData.firstName}
                            onChange={handleChange}
                            className="mt-1 w-full rounded-md shadow-sm"
                            required
                        />
                    </div>

                    <div className="col-span-6 sm:col-span-3">
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input
                            type="text"
                            id="lastName"
                            name="lastName"
                            value={formData.lastName}
                            onChange={handleChange}
                            className="mt-1 w-full rounded-md shadow-sm"
                            required
                        />
                    </div>

                    <div className="col-span-6 sm:col-span-3">
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

                    <div className="col-span-6 sm:col-span-3">
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

                    <div className="col-span-6 sm:col-span-3">
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

                    <div className="col-span-6 sm:col-span-3">
                        <Label htmlFor="confirmPassword">Confirm Password</Label>
                        <Input
                            type="password"
                            id="confirmPassword"
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            className="mt-1 w-full rounded-md shadow-sm"
                            required
                        />
                    </div>

                    <div className="col-span-6">
                        <Label htmlFor="subscribe" className="flex gap-4">
                            <Checkbox
                                id="subscribe"
                                checked={formData.subscribe}
                                onCheckedChange={handleCheckboxChange}
                                className="size-5 text-blue-600 shadow-sm rounded-sm"
                            />
                            <span className="text-sm">Subscribe to our newsletter</span>
                        </Label>
                    </div>

                    <div className="col-span-6">
                        <p className="text-sm text-gray-500">
                            By creating an account, you agree to our
                            <Link href="/terms" className="underline ml-1">
                                terms and conditions
                            </Link>
                            {" "}and{" "}
                            <Link href="/privacy" className="underline">
                                privacy policy
                            </Link>.
                        </p>
                    </div>

                    <div className="col-span-6 flex flex-col md:flex-row items-center justify-center md:justify-start sm:gap-4">
                        <Button type="submit" className="px-10">Create an account</Button>

                        <p className="mt-4 text-sm text-gray-500 sm:mt-0">
                            Already have an account?{" "}
                            <Link href="/auth/login" className="underline text-primary">
                                Log in
                            </Link>
                        </p>
                    </div>
                </form>
            </div>
        </main>
    );
}