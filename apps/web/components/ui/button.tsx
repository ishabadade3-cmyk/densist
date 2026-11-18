import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "accent" | "destructive" | "link";
  size?: "sm" | "md" | "lg" | "icon";
  isLoading?: boolean;
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      isLoading = false,
      asChild = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium rounded-md transition-colors duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none active:scale-[0.98]";

    const variantStyles: Record<string, string> = {
      primary:
        "bg-primary text-primary-foreground hover:bg-primary-hover focus-visible:ring-primary focus-visible:ring-offset-background shadow-sm",
      secondary:
        "bg-secondary text-secondary-foreground hover:bg-secondary-hover focus-visible:ring-secondary focus-visible:ring-offset-background shadow-sm font-semibold",
      outline:
        "border border-primary text-primary bg-transparent hover:bg-accent hover:text-accent-foreground focus-visible:ring-primary focus-visible:ring-offset-background",
      ghost:
        "text-foreground bg-transparent hover:bg-accent/50 hover:text-accent-foreground focus-visible:ring-primary focus-visible:ring-offset-background",
      accent:
        "bg-accent text-accent-foreground hover:bg-accent-hover focus-visible:ring-primary focus-visible:ring-offset-background font-medium",
      destructive:
        "bg-destructive text-destructive-foreground hover:opacity-90 focus-visible:ring-destructive focus-visible:ring-offset-background shadow-sm",
      link:
        "text-primary underline-offset-4 hover:underline focus-visible:ring-primary p-0 h-auto font-normal",
    };

    const sizeStyles: Record<string, string> = {
      sm: "h-8 px-3 text-xs gap-1.5",
      md: "h-11 px-4 text-sm gap-2 min-h-[44px]", // 44px min touch target per WCAG 2.2
      lg: "h-12 px-6 text-base gap-2.5 min-h-[44px]",
      icon: "h-11 w-11 min-h-[44px] min-w-[44px] p-0",
    };

    const combinedClassName = cn(baseStyles, variantStyles[variant], sizeStyles[size], className);

    if (asChild && React.isValidElement(children)) {
      const child = children as React.ReactElement<{ className?: string }>;
      return React.cloneElement(child, {
        className: cn(combinedClassName, child.props.className),
      });
    }

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        aria-busy={isLoading}
        className={combinedClassName}
        {...props}
      >
        {isLoading && (
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";

