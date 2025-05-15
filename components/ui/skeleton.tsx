import { cn } from "@/lib/utils"

function Skeleton({
  className,
  variant = "dark",
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { variant?: "light" | "dark" }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md",
        variant === "light" ? "bg-white/20" : "bg-black/10",
        className
      )}
      {...props}
    />
  )
}

function SkeletonText({
  className,
  variant = "dark",
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { variant?: "light" | "dark" }) {
  return (
    <Skeleton
      className={cn("h-4 w-full", className)}
      variant={variant}
      {...props}
    />
  )
}

function SkeletonCircle({
  className,
  variant = "dark",
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { variant?: "light" | "dark" }) {
  return (
    <Skeleton
      className={cn("rounded-full", className)}
      variant={variant}
      {...props}
    />
  )
}

function SkeletonCard({
  className,
  variant = "dark",
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { variant?: "light" | "dark" }) {
  return (
    <div className={cn("space-y-3", className)} {...props}>
      <Skeleton className="h-[125px] w-full rounded-lg" variant={variant} />
      <div className="space-y-2">
        <SkeletonText className="h-4 w-[80%]" variant={variant} />
        <SkeletonText className="h-4 w-[90%]" variant={variant} />
        <SkeletonText className="h-4 w-[60%]" variant={variant} />
      </div>
    </div>
  )
}

function SkeletonAvatar({
  className,
  variant = "dark",
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { variant?: "light" | "dark" }) {
  return (
    <SkeletonCircle
      className={cn("h-10 w-10", className)}
      variant={variant}
      {...props}
    />
  )
}

export { Skeleton, SkeletonText, SkeletonCircle, SkeletonCard, SkeletonAvatar }
