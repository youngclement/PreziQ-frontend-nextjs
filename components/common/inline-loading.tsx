'use client';

import { cn } from '@/lib/utils';

interface InlineLoadingProps {
    size?: "xs" | "sm" | "md";
    variant?: "light" | "dark";
    showText?: boolean;
    text?: string;
    className?: string;
}

const InlineLoading = ({
    size = "sm",
    variant = "dark",
    showText = false,
    text = "Loading...",
    className
}: InlineLoadingProps) => {
    const sizeClasses = {
        xs: "h-3",
        sm: "h-4",
        md: "h-5",
    };

    const dotSizeClasses = {
        xs: "w-1 h-1",
        sm: "w-1.5 h-1.5",
        md: "w-2 h-2",
    };

    const textSizeClasses = {
        xs: "text-xs",
        sm: "text-sm",
        md: "text-base",
    };

    const variantClasses = {
        light: "text-white",
        dark: "text-black",
    };

    return (
        <div className={cn("flex items-center gap-2", className)}>
            <div className={cn("flex items-center gap-1", sizeClasses[size])}>
                {[0, 1, 2].map((i) => (
                    <div
                        key={i}
                        className={cn(
                            "rounded-full",
                            dotSizeClasses[size],
                            variant === "light" ? "bg-white" : "bg-black",
                            "animate-pulse",
                            i === 0 ? "animate-delay-0" :
                                i === 1 ? "animate-delay-150" :
                                    "animate-delay-300"
                        )}
                        style={{
                            animationDuration: '1.5s'
                        }}
                    />
                ))}
            </div>

            {showText && (
                <span className={cn(
                    "font-medium",
                    textSizeClasses[size],
                    variantClasses[variant]
                )}>
                    {text}
                </span>
            )}
        </div>
    );
};

export default InlineLoading; 