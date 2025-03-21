import React from "react";
import { Send, Mail } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { UserImage } from "../common/user-image";
import { useTheme } from "next-themes";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const people = [
    {
        id: 1,
        name: "John Doe",
        designation: "Presentation Designer",
        image:
            "https://images.unsplash.com/photo-1599566150163-29194dcaad36?ixlib=rb-4.0.3&auto=format&fit=crop&w=3387&q=80",
    },
    {
        id: 2,
        name: "Robert Johnson",
        designation: "Marketing Director",
        image:
            "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60",
    },
    {
        id: 3,
        name: "Jane Smith",
        designation: "Content Strategist",
        image:
            "https://images.unsplash.com/photo-1580489944761-15a19d654956?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60",
    },
    {
        id: 4,
        name: "Emily Davis",
        designation: "UX Designer",
        image:
            "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60",
    },
    {
        id: 5,
        name: "Tyler Durden",
        designation: "Public Speaker",
        image:
            "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=3540&q=80",
    },
    {
        id: 6,
        name: "Dora",
        designation: "Presentation Coach",
        image:
            "https://images.unsplash.com/photo-1544725176-7c40e5a71c5e?ixlib=rb-4.0.3&auto=format&fit=crop&w=3534&q=80",
    },
];

const fadeUpVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.8,
            delay: 0.1 + i * 0.1,
            ease: [0.25, 0.4, 0.25, 1],
        },
    }),
};

const Newsletter = () => {
    const { theme, resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const isDark = mounted && (resolvedTheme === "dark" || theme === "dark");

    if (!mounted) {
        return <div className="py-16 mx-auto sm:py-24" />;
    }

    return (
        <section className={cn(
            "relative overflow-hidden",
            isDark ? "bg-black" : "bg-white"
        )}>
            {/* Geometric shapes for background */}
            {/* <div className="absolute inset-0">
                <div className={cn(
                    "absolute top-0 left-1/2 w-32 h-32 transform -translate-x-1/2 -translate-y-1/2 rotate-45",
                    isDark ? "bg-white/5" : "bg-black/5"
                )} />
                <div className={cn(
                    "absolute bottom-0 right-0 w-40 h-40 transform translate-x-1/3 translate-y-1/3 rounded-full",
                    isDark ? "bg-white/5" : "bg-black/5"
                )} />
            </div> */}

            <div className="relative px-4 py-16 mx-auto sm:px-6 lg:px-8 max-w-7xl sm:py-24">
                <div className="grid items-center max-w-5xl grid-cols-1 mx-auto lg:grid-cols-2 gap-y-12 lg:gap-x-16">
                    <motion.div
                        className="lg:order-2"
                        initial="hidden"
                        animate="visible"
                        variants={fadeUpVariants}
                        custom={0}
                    >
                        <div className="text-center lg:text-left">
                            <Badge
                                variant={"outline"}
                                className={cn(
                                    "inline-flex items-center px-3 py-1 text-sm font-medium rounded-full border-highlight",
                                    isDark
                                        ? "bg-white/10 border-white/20"
                                        : "bg-black/5 border-black/10"
                                )}
                            >
                                <Mail className="w-4 h-4 mr-2 random-highlight" />
                                <span className="text-highlight">PreziQ Newsletter</span>
                            </Badge>

                            <h2 className={cn(
                                "mt-6 text-xl font-bold tracking-tight sm:text-xl lg:text-3xl",
                                "text-foreground"
                            )}>
                                Stay ahead with our presentation <span className="text-highlight">insights & templates</span>
                            </h2>

                            <p className={cn(
                                "mt-4 text-lg",
                                "text-muted-foreground"
                            )}>
                                Get updates on presentation design trends, public speaking tips,
                                exclusive templates, and expert advice to elevate your presentations.
                            </p>

                            <form className="mt-8 space-y-4 sm:space-y-0">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4">
                                    <div className="relative flex-1">
                                        <input
                                            type="email"
                                            placeholder="Enter your email address"
                                            className={cn(
                                                "shadow-lg w-full rounded-lg px-4 py-3 h-12 focus-visible:ring-0 focus-visible:ring-offset-0 focus:border-transparent",
                                                isDark
                                                    ? "bg-white/5 text-white placeholder:text-white/50 border border-white/10 focus:border-highlight"
                                                    : "bg-black/5 text-black placeholder:text-black/50 border border-black/10 focus:border-highlight"
                                            )}
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        className={cn(
                                            "inline-flex items-center justify-center px-6 py-3 mt-4 sm:mt-0 text-base font-medium rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 bg-highlight-hover",
                                            "bg-primary text-primary-foreground border-transparent"
                                        )}
                                    >
                                        Subscribe
                                        <Send className="w-5 h-5 ml-2" />
                                    </button>
                                </div>
                            </form>
                            <p className={cn(
                                "text-xs mt-2",
                                "text-muted-foreground"
                            )}>
                                By subscribing, you agree to our{" "}
                                <Link href="#" className="text-highlight hover:opacity-80">
                                    Privacy Policy
                                </Link>{" "}
                                and{" "}
                                <Link href="#" className="text-highlight hover:opacity-80">
                                    Terms and Conditions
                                </Link>
                            </p>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-5 justify-center sm:justify-normal items-center mt-8">
                            <div className="flex items-center justify-center lg:justify-start border-highlight rounded-full p-1">
                                <UserImage items={people} />
                            </div>
                            <p className={cn(
                                "ml-4 text-sm font-medium",
                                "text-muted-foreground"
                            )}>
                                <span className="text-foreground">Over <span className="text-highlight font-bold">10K</span> presentation pros</span>
                                <br /> have already subscribed.
                            </p>
                        </div>
                    </motion.div>

                    <motion.div
                        className="lg:order-1"
                        initial="hidden"
                        animate="visible"
                        variants={fadeUpVariants}
                        custom={1}
                    >
                        <div className={cn(
                            "overflow-hidden rounded-xl shadow-xl border-highlight",
                            isDark
                                ? "bg-white/5 border border-white/10"
                                : "bg-black/5 border border-black/10"
                        )}>
                            <img
                                className="w-full h-full object-cover"
                                src="/newsletter-image.jpg" // Update with your actual image path
                                alt="Stay connected with PreziQ newsletter"
                                onError={(e) => {
                                    // Fallback if image not found
                                    e.currentTarget.src = "https://fastly.picsum.photos/id/60/1920/1200.jpg?hmac=fAMNjl4E_sG_WNUjdU39Kald5QAHQMh-_-TsIbbeDNI";
                                }}
                            />
                            <div className={cn(
                                "absolute inset-0",
                                isDark
                                    ? "bg-gradient-to-tr from-black/60 via-transparent to-transparent"
                                    : "bg-gradient-to-tr from-white/30 via-transparent to-transparent"
                            )} />
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
};

export default Newsletter;