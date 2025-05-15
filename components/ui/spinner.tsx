import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  variant?: "light" | "dark";
  showText?: boolean;
  text?: string;
  className?: string;
}

export function LoadingSpinner({
  size = "md",
  variant = "dark",
  showText = false,
  text = "Loading...",
  className
}: LoadingSpinnerProps) {
  const sizeClasses = {
    xs: "w-3 h-3",
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-10 h-10",
    xl: "w-16 h-16",
  };

  const textSizeClasses = {
    xs: "text-xs",
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
    xl: "text-xl",
  };

  const variantClasses = {
    light: "border-white text-white",
    dark: "border-black text-black",
  };

  return (
    <div className={cn("flex flex-col items-center justify-center", className)}>
      <div className="relative">
        {/* Outer static ring */}
        <div className={cn(
          "rounded-full border-2 opacity-30",
          sizeClasses[size],
          variantClasses[variant]
        )}></div>

        {/* Inner spinning ring */}
        <div className={cn(
          "absolute top-0 left-0 rounded-full border-2 border-t-transparent animate-spin",
          sizeClasses[size],
          variantClasses[variant]
        )}></div>
      </div>

      {showText && (
        <div className={cn(
          "mt-2 font-medium animate-pulse",
          textSizeClasses[size],
          variantClasses[variant]
        )}>
          {text}
        </div>
      )}
    </div>
  );
}