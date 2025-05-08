import Link from "next/link";
import { cn } from "@/lib/utils";

interface LogoProps {
    className?: string;
    variant?: "default" | "light" | "dark" | "minimal";
    size?: "sm" | "md" | "lg";
    showText?: boolean;
}

export function Logo({
    className,
    variant = "default",
    size = "md",
    showText = true,
}: LogoProps) {
    const variantStyles = {
        default: "text-foreground fill-foreground",
        light: "text-white fill-white",
        dark: "text-black fill-black",
        minimal: "text-primary fill-primary",
    };

    const sizeStyles = {
        sm: "h-6 text-lg",
        md: "h-8 text-xl",
        lg: "h-10 text-2xl",
    };

    // Minimal variant has a simpler SVG
    if (variant === "minimal") {
        return (
            <Link href="/" className={cn("flex items-center gap-0.5", className)}>
                <div
                    className={cn(
                        "relative flex items-center",
                        sizeStyles[size],
                        variantStyles[variant]
                    )}
                >
                    <svg
                        viewBox="0 0 32 32"
                        className={cn("h-full w-auto", variantStyles[variant])}
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path
                            d="M16 3C8.832 3 3 8.832 3 16s5.832 13 13 13 13-5.832 13-13S23.168 3 16 3z"
                            fill="none"
                            strokeWidth="2"
                            stroke="currentColor"
                        />
                        <path
                            d="M16 20a4 4 0 100-8 4 4 0 000 8z"
                            stroke="currentColor"
                            strokeWidth="2"
                            fill="none"
                        />
                        <circle cx="16" cy="16" r="2" fill="currentColor" />
                    </svg>

                    {showText && (
                        <span className={cn("font-bold ml-0.5 tracking-tight", variantStyles[variant])}>
                            PQ<span className="text-primary font-black">.</span>
                        </span>
                    )}
                </div>
            </Link>
        );
    }

    return (
        <Link href="/" className={cn("flex items-center gap-2", className)}>
            <div
                className={cn(
                    "relative flex items-center",
                    sizeStyles[size],
                    variantStyles[variant]
                )}
            >
                <svg
                    viewBox="0 0 32 32"
                    className={cn("h-full w-auto", variantStyles[variant])}
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path
                        d="M16 2C8.268 2 2 8.268 2 16s6.268 14 14 14 14-6.268 14-14S23.732 2 16 2z"
                        fill="none"
                        strokeWidth="2"
                        stroke="currentColor"
                    />
                    <path
                        d="M10 13a2 2 0 100-4 2 2 0 000 4z"
                        fill="currentColor"
                    />
                    <path
                        d="M22 13a2 2 0 100-4 2 2 0 000 4z"
                        fill="currentColor"
                    />
                    <path
                        d="M16 23a6 6 0 100-12 6 6 0 000 12z"
                        stroke="currentColor"
                        strokeWidth="2"
                        fill="none"
                    />
                    <path
                        d="M16 19a2 2 0 100-4 2 2 0 000 4z"
                        fill="currentColor"
                    />
                </svg>

                {showText && (
                    <span className={cn("font-bold ml-1", variantStyles[variant])}>
                        Prezi
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-600 font-black">Q!</span>
                    </span>
                )}
            </div>
        </Link>
    );
}

export default Logo;