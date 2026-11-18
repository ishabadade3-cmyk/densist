import * as React from "react";
import { cn } from "@/lib/utils";

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "text" | "circular" | "rectangular" | "button";
}

export function Skeleton({ className, variant = "rectangular", ...props }: SkeletonProps) {
  const variantStyles = {
    text: "h-4 w-full rounded-sm",
    circular: "h-12 w-12 rounded-full",
    rectangular: "h-32 w-full rounded-md",
    button: "h-11 w-32 rounded-md",
  };

  return (
    <div
      aria-hidden="true"
      className={cn(
        "animate-pulse bg-muted/70",
        variantStyles[variant],
        className
      )}
      {...props}
    />
  );
}

