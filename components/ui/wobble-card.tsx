"use client";
import React, { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export const WobbleCard = ({
    children,
    containerClassName,
    className,
    variant: initialVariant = "auto",
}: {
    children: React.ReactNode;
    containerClassName?: string;
    className?: string;
    variant?: "dark" | "light" | "auto";
}) => {
    const { theme, systemTheme } = useTheme();
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const [isHovering, setIsHovering] = useState(false);

    // Determine the actual variant based on theme
    const currentTheme = theme === "system" ? systemTheme : theme;
    const variant = initialVariant === "auto"
        ? (currentTheme === "dark" ? "dark" : "light")
        : initialVariant;

    const handleMouseMove = (event: React.MouseEvent<HTMLElement>) => {
        const { clientX, clientY } = event;
        const rect = event.currentTarget.getBoundingClientRect();
        const x = (clientX - (rect.left + rect.width / 2)) / 20;
        const y = (clientY - (rect.top + rect.height / 2)) / 20;
        setMousePosition({ x, y });
    };

    return (
        <motion.section
            onMouseMove={handleMouseMove}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => {
                setIsHovering(false);
                setMousePosition({ x: 0, y: 0 });
            }}
            style={{
                transform: isHovering
                    ? `translate3d(${mousePosition.x}px, ${mousePosition.y}px, 0) scale3d(1, 1, 1)`
                    : "translate3d(0px, 0px, 0) scale3d(1, 1, 1)",
                transition: "transform 0.1s ease-out",
            }}
            className={cn(
                "mx-auto w-full relative rounded-2xl overflow-hidden",
                variant === "dark"
                    ? "bg-black dark:bg-zinc-900 text-white"
                    : "bg-white dark:bg-zinc-800 text-black dark:text-white",
                containerClassName
            )}
        >
            <div
                className={cn(
                    "relative h-full sm:mx-0 sm:rounded-2xl overflow-hidden",
                    variant === "dark"
                        ? "dark:[background-image:radial-gradient(88%_100%_at_top,rgba(255,255,255,0.25),rgba(255,255,255,0))] [background-image:radial-gradient(88%_100%_at_top,rgba(255,255,255,0.25),rgba(255,255,255,0))]"
                        : "dark:[background-image:radial-gradient(88%_100%_at_top,rgba(255,255,255,0.1),rgba(255,255,255,0))] [background-image:radial-gradient(88%_100%_at_top,rgba(0,0,0,0.03),rgba(0,0,0,0))]"
                )}
                style={{
                    boxShadow: variant === "dark"
                        ? "0 10px 32px rgba(0, 0, 0, 0.12), 0 1px 1px rgba(0, 0, 0, 0.05), 0 0 0 1px rgba(0, 0, 0, 0.05), 0 4px 6px rgba(0, 0, 0, 0.08), 0 24px 108px rgba(0, 0, 0, 0.10)"
                        : "0 10px 32px rgba(0, 0, 0, 0.06), 0 1px 1px rgba(0, 0, 0, 0.03), 0 0 0 1px rgba(0, 0, 0, 0.03), 0 4px 6px rgba(0, 0, 0, 0.05), 0 24px 108px rgba(0, 0, 0, 0.07)",
                }}
            >
                <motion.div
                    style={{
                        transform: isHovering
                            ? `translate3d(${-mousePosition.x}px, ${-mousePosition.y}px, 0) scale3d(1.03, 1.03, 1)`
                            : "translate3d(0px, 0px, 0) scale3d(1, 1, 1)",
                        transition: "transform 0.1s ease-out",
                    }}
                    className={cn("h-full px-4 py-20 sm:px-10", className)}
                >
                    <Noise variant={variant} />
                    {children}
                </motion.div>
            </div>
        </motion.section>
    );
};

const Noise = ({ variant = "dark" }: { variant?: "dark" | "light" }) => {
    return (
        <div
            className={cn(
                "absolute inset-0 w-full h-full scale-[1.2] transform",
                variant === "dark"
                    ? "opacity-10 [mask-image:radial-gradient(#fff,transparent,75%)]"
                    : "opacity-5 [mask-image:radial-gradient(#000,transparent,75%)]"
            )}
            style={{
                backgroundImage: "url(/noise.webp)",
                backgroundSize: "30%",
            }}
        ></div>
    );
};