import * as React from "react";
import { cn } from "@/lib/utils";

export interface SectionHeadingProps extends React.HTMLAttributes<HTMLDivElement> {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
}

export const SectionHeading = React.forwardRef<HTMLDivElement, SectionHeadingProps>(
  ({ className, eyebrow, title, description, align = "left", ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex flex-col gap-2 mb-8",
          align === "center" ? "text-center items-center" : "text-left items-start",
          className
        )}
        {...props}
      >
        {eyebrow && (
          <span className="inline-block text-xs font-semibold uppercase tracking-wider text-primary px-2.5 py-1 rounded-full bg-accent/60">
            {eyebrow}
          </span>
        )}
        <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-foreground leading-tight">
          {title}
        </h2>
        {description && (
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl leading-relaxed mt-1">
            {description}
          </p>
        )}
      </div>
    );
  }
);

SectionHeading.displayName = "SectionHeading";

