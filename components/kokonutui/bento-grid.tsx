"use client";

import { cn } from "@/lib/utils";
import {
    GamepadIcon,
    TrendingUp,
    Trophy,
    Users,
    Timer,
    Layers,
    Presentation
} from "lucide-react";
import { useTheme } from "next-themes";
import { useState, useEffect } from "react";

interface BentoItem {
    title: string;
    description: string;
    icon: React.ReactNode;
    status?: string;
    tags?: string[];
    meta?: string;
    cta?: string;
    colSpan?: number;
    hasPersistentHover?: boolean;
}

interface BentoGridProps {
    items?: BentoItem[];
    className?: string;
    variant?: "default" | "compact" | "featured";
}

const itemsSample: BentoItem[] = [
    {
        title: "Interactive Quizzes",
        meta: "Kahoot-style",
        description:
            "Create engaging quiz competitions with real-time leaderboards, multiple choice questions, and timed responses",
        icon: <GamepadIcon className="w-4 h-4 text-blue-500" />,
        status: "Popular",
        tags: ["Quiz", "Competition", "Interactive"],
        colSpan: 2,
        hasPersistentHover: true,
    },
    {
        title: "Performance Analytics",
        meta: "Real-time",
        description: "Track participant scores and gather detailed insights about learning progress",
        icon: <TrendingUp className="w-4 h-4 text-emerald-500" />,
        status: "Essential",
        tags: ["Analytics", "Performance"],
    },
    {
        title: "Team Competitions",
        meta: "Multiplayer",
        description: "Organize players into teams for collaborative challenges and group competitions",
        icon: <Users className="w-4 h-4 text-purple-500" />,
        tags: ["Teams", "Collaboration"],
        colSpan: 2,
    },
    {
        title: "Game Templates",
        meta: "Ready-to-use",
        description: "Choose from multiple game types including quizzes, memory games, and word puzzles",
        icon: <Layers className="w-4 h-4 text-sky-500" />,
        status: "Featured",
        tags: ["Templates", "Variety"],
    },
];

export default function BentoGrid({
    items = itemsSample,
    className,
    variant = "default"
}: BentoGridProps) {
    const { theme, resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const isDark = mounted && (resolvedTheme === "dark" || theme === "dark");

    if (!mounted) {
        return <section className="py-16 w-full" />;
    }

    return (
        <section className={cn(
            "py-16 w-full",
            isDark ? "bg-black" : "bg-white"
        )}>
            <div className="container mx-auto px-4">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold mb-3 text-foreground">
                        Game-Based Learning <span className="text-highlight">Features</span>
                    </h2>
                    <p className="text-base text-muted-foreground max-w-2xl mx-auto">
                        Engage your audience with interactive games and competitions that make learning fun
                    </p>
                </div>

                <div className={cn(
                    "grid gap-4 max-w-7xl mx-auto",
                    variant === "compact" ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4" :
                        variant === "featured" ? "grid-cols-1 md:grid-cols-3 lg:grid-cols-4" :
                            "grid-cols-1 md:grid-cols-3 gap-5",
                    className
                )}>
                    {items.map((item, index) => (
                        <div
                            key={index}
                            className={cn(
                                "group relative p-5 rounded-xl overflow-hidden transition-all duration-300",
                                isDark
                                    ? "border border-white/10 bg-white/5"
                                    : "border border-black/10 bg-black/5",
                                "hover:shadow-lg hover:border-highlight",
                                "hover:-translate-y-1 will-change-transform",
                                item.colSpan ? `col-span-1 md:col-span-${item.colSpan}` : "col-span-1",
                                {
                                    "shadow-lg -translate-y-1 border-highlight":
                                        item.hasPersistentHover,
                                }
                            )}
                        >
                            {/* Gradient background effect */}
                            <div
                                className={`absolute inset-0 ${item.hasPersistentHover
                                    ? "opacity-100"
                                    : "opacity-0 group-hover:opacity-100"
                                    } transition-opacity duration-300`}
                            >
                                <div className={cn(
                                    "absolute inset-0",
                                    isDark
                                        ? "bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.03)_1px,transparent_1px)]"
                                        : "bg-[radial-gradient(circle_at_center,rgba(0,0,0,0.02)_1px,transparent_1px)]",
                                    "bg-[length:5px_5px]"
                                )} />
                            </div>

                            {/* Content */}
                            <div className="relative flex flex-col space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className={cn(
                                        "w-10 h-10 rounded-lg flex items-center justify-center",
                                        isDark ? "bg-white/10" : "bg-black/10",
                                        "group-hover:bg-highlight/20 transition-all duration-300"
                                    )}>
                                        {item.icon}
                                    </div>
                                    <span
                                        className={cn(
                                            "text-xs font-medium px-2.5 py-1 rounded-lg backdrop-blur-xs",
                                            isDark ? "bg-white/10 text-white" : "bg-black/10 text-black",
                                            "transition-colors duration-300",
                                            isDark ? "group-hover:bg-white/20" : "group-hover:bg-black/20"
                                        )}
                                    >
                                        {item.status || "Feature"}
                                    </span>
                                </div>

                                <div className="space-y-2.5">
                                    <h3 className="font-semibold text-foreground tracking-tight text-base">
                                        {item.title}
                                        <span className="ml-2 text-xs text-muted-foreground font-normal">
                                            {item.meta}
                                        </span>
                                    </h3>
                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                        {item.description}
                                    </p>
                                </div>

                                <div className="flex items-center justify-between mt-3">
                                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                                        {item.tags?.map((tag, i) => (
                                            <span
                                                key={i}
                                                className={cn(
                                                    "px-2.5 py-1 rounded-md backdrop-blur-xs transition-all duration-200",
                                                    isDark
                                                        ? "bg-white/10 hover:bg-white/20"
                                                        : "bg-black/10 hover:bg-black/20"
                                                )}
                                            >
                                                #{tag}
                                            </span>
                                        ))}
                                    </div>
                                    <span className="text-xs text-highlight opacity-0 group-hover:opacity-100 transition-opacity">
                                        {item.cta || "Learn more →"}
                                    </span>
                                </div>
                            </div>

                            {/* Border gradient */}
                            <div
                                className={`absolute inset-0 -z-10 rounded-xl p-px border-highlight ${item.hasPersistentHover
                                    ? "opacity-100"
                                    : "opacity-0 group-hover:opacity-100"
                                    } transition-opacity duration-300`}
                            />
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}