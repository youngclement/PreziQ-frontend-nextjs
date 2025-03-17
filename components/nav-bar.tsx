"use client";

import { useState, useEffect } from "react";
import { Moon, Sun, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import Link from "next/link";

export function NavBar() {
    const [scrolled, setScrolled] = useState(false);
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const handleScroll = () => {
            setScrolled(window.scrollY > 50);
        };

        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    if (!mounted) return null;

    return (
        <nav
            className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled
                ? "bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b"
                : "bg-transparent"
                }`}
        >
            <div className="container mx-auto px-4">
                <div className="flex h-16 items-center justify-between">
                    <Link
                        href="/"
                        className="text-xl font-bold tracking-tight hover:text-primary/90 transition-colors"
                    >
                        GameLearn
                    </Link>

                    <div className="hidden md:flex items-center space-x-6">
                        <Link href="/games" className="hover:text-primary/90 transition-colors">
                            Games
                        </Link>
                        <Link href="/categories" className="hover:text-primary/90 transition-colors">
                            Categories
                        </Link>
                        <Link href="/leaderboard" className="hover:text-primary/90 transition-colors">
                            Leaderboard
                        </Link>
                    </div>

                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                            className="hover:bg-muted"
                        >
                            {theme === "dark" ? (
                                <Sun className="h-5 w-5" />
                            ) : (
                                <Moon className="h-5 w-5" />
                            )}
                        </Button>
                        <Button variant="default" className="hidden md:flex">
                            Sign In
                        </Button>
                        <Button variant="ghost" size="icon" className="md:hidden">
                            <Menu className="h-5 w-5" />
                        </Button>
                    </div>
                </div>
            </div>
        </nav>
    );
}