"use client";

import { useState, useEffect } from "react";
import { Moon, Sun, Menu, X, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTheme } from "next-themes";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { InteractiveHoverButton } from "./ui/button-hover-login";

export function NavBar() {
    const [scrolled, setScrolled] = useState(false);
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [sessionCode, setSessionCode] = useState('');

    useEffect(() => {
        setMounted(true);
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };

        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    // Close mobile menu when screen is resized to desktop view
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 768 && mobileMenuOpen) {
                setMobileMenuOpen(false);
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [mobileMenuOpen]);

    const handleSessionSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (sessionCode) {
            // Handle joining a session with the code
            console.log('Joining session with code:', sessionCode);
            // You would add navigation or session joining logic here
        }
    };

    if (!mounted) return null;

    const navLinks = [
        { href: "/collections", label: "Collections" },
        { href: "/my-collections", label: "My Collections" },
        { href: "/games", label: "Games" },
        { href: "/categories", label: "Categories" },
        { href: "/leaderboard", label: "Leaderboard" }
    ];

    return (
        <nav
            className={cn(
                "fixed top-0 w-full z-50 transition-all duration-300",
                scrolled
                    ? "bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b shadow-sm h-16"
                    : "bg-transparent h-20"
            )}
        >
            <div className="container mx-auto px-4 h-full max-w-7xl">
                <div className="flex h-full items-center justify-between">
                    {/* Menu button on mobile */}
                    <div className="md:hidden">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="rounded-full h-9 w-9 flex items-center justify-center"
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            aria-label="Toggle menu"
                            aria-expanded={mobileMenuOpen}
                        >
                            {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
                        </Button>
                    </div>

                    {/* Desktop Navigation Links - Left side */}
                    <div className="hidden md:flex items-center space-x-6">
                        {navLinks.slice(0, 3).map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className="hover:text-primary transition-colors font-medium relative group py-2 px-1"
                            >
                                {link.label}
                                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full"></span>
                            </Link>
                        ))}
                    </div>

                    {/* Logo and Session Input - Center */}
                    <div className="flex-1 flex justify-center items-center">
                        <div className="flex flex-col items-center">
                            {/* Logo */}
                            <Link
                                href="/"
                                className={cn(
                                    "font-bold tracking-tight hover:text-primary transition-all duration-300 flex items-center",
                                    scrolled ? "text-lg" : "text-xl"
                                )}
                            >
                                <span className="bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
                                    GameLearn
                                </span>
                            </Link>

                            {/* Session Code Form */}
                            <form onSubmit={handleSessionSubmit} className="mt-1 flex items-center">
                                <Input
                                    type="text"
                                    placeholder="Enter session code"
                                    value={sessionCode}
                                    onChange={(e) => setSessionCode(e.target.value)}
                                    className="h-8 w-40 text-sm border-primary focus:ring-primary"
                                />
                                <Button type="submit" variant="ghost" size="sm" className="h-8 px-2 ml-1">
                                    <LogIn className="h-3.5 w-3.5" />
                                </Button>
                            </form>
                        </div>
                    </div>

                    {/* Right side actions */}
                    <div className="flex items-center gap-3">
                        {/* More nav links on desktop */}
                        <div className="hidden md:flex items-center space-x-6">
                            {navLinks.slice(3).map((link) => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className="hover:text-primary transition-colors font-medium relative group py-2 px-1"
                                >
                                    {link.label}
                                    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full"></span>
                                </Link>
                            ))}
                        </div>

                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                            className="hover:bg-muted rounded-full h-9 w-9 flex items-center justify-center"
                            aria-label="Toggle theme"
                        >
                            {theme === "dark" ? (
                                <Sun className="h-4 w-4" />
                            ) : (
                                <Moon className="h-4 w-4" />
                            )}
                        </Button>
                        <div className="hidden sm:block">
                            <Link href='/auth'><InteractiveHoverButton>Sign In</InteractiveHoverButton></Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile Navigation */}
            <div
                className={cn(
                    "md:hidden absolute top-full left-0 w-full bg-background border-b shadow-lg overflow-hidden transition-all duration-300 ease-in-out",
                    mobileMenuOpen ? "max-h-[300px] opacity-100" : "max-h-0 opacity-0"
                )}
            >
                <div className="container mx-auto px-4 py-4 flex flex-col space-y-3">
                    {navLinks.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className="py-2.5 px-4 hover:bg-accent rounded-md transition-colors flex items-center font-medium"
                            onClick={() => setMobileMenuOpen(false)}
                        >
                            {link.label}
                        </Link>
                    ))}
                    <div className="sm:hidden pt-2">
                        <Button className="w-full rounded-full">
                            Sign In
                        </Button>
                    </div>
                </div>
            </div>
        </nav>
    );
}