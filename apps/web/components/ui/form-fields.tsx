import * as React from "react";
import { cn } from "@/lib/utils";

// --- Label ---
export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
}

export const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, required, children, ...props }, ref) => (
    <label
      ref={ref}
      className={cn("text-sm font-medium text-foreground flex items-center gap-1 mb-1.5 select-none", className)}
      {...props}
    >
      {children}
      {required && (
        <span className="text-destructive font-bold" aria-hidden="true">
          *
        </span>
      )}
    </label>
  )
);
Label.displayName = "Label";

// --- Input ---
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  state?: "default" | "error" | "success";
  errorMessage?: string;
  helperText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, state = "default", errorMessage, helperText, id, ...props }, ref) => {
    const errorId = id ? `${id}-error` : undefined;
    const helperId = id ? `${id}-helper` : undefined;
    const isError = state === "error" || !!errorMessage;
    const isSuccess = state === "success";

    const stateStyles = {
      default: "border-border hover:border-primary/50 focus:border-primary focus:ring-primary",
      error: "border-destructive text-destructive focus:border-destructive focus:ring-destructive",
      success: "border-success text-foreground focus:border-success focus:ring-success",
    };

    return (
      <div className="w-full flex flex-col gap-1">
        <div className="relative flex items-center">
          <input
            id={id}
            ref={ref}
            aria-invalid={isError ? "true" : "false"}
            aria-describedby={
              isError && errorId ? errorId : helperText && helperId ? helperId : undefined
            }
            className={cn(
              "w-full h-11 px-3.5 py-2 text-sm bg-card text-foreground rounded-md border shadow-sm transition-colors duration-fast placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-muted/30",
              isError
                ? stateStyles.error
                : isSuccess
                ? stateStyles.success
                : stateStyles.default,
              className
            )}
            {...props}
          />
          {isSuccess && (
            <span className="absolute right-3 text-success pointer-events-none" aria-hidden="true">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </span>
          )}
          {isError && (
            <span className="absolute right-3 text-destructive pointer-events-none" aria-hidden="true">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                <path strokeLinecap="round" strokeWidth="2" d="M12 8v4m0 4h.01" />
              </svg>
            </span>
          )}
        </div>
        {errorMessage && (
          <p id={errorId} role="alert" className="text-xs text-destructive font-medium mt-0.5">
            {errorMessage}
          </p>
        )}
        {!errorMessage && helperText && (
          <p id={helperId} className="text-xs text-muted-foreground mt-0.5">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";

// --- Textarea ---
export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  state?: "default" | "error" | "success";
  errorMessage?: string;
  helperText?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, state = "default", errorMessage, helperText, id, ...props }, ref) => {
    const errorId = id ? `${id}-error` : undefined;
    const isError = state === "error" || !!errorMessage;

    return (
      <div className="w-full flex flex-col gap-1">
        <textarea
          id={id}
          ref={ref}
          aria-invalid={isError ? "true" : "false"}
          aria-describedby={isError && errorId ? errorId : undefined}
          className={cn(
            "w-full min-h-[100px] p-3 text-sm bg-card text-foreground rounded-md border shadow-sm transition-colors duration-fast placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-muted/30",
            isError
              ? "border-destructive text-destructive focus:border-destructive focus:ring-destructive"
              : "border-border hover:border-primary/50 focus:border-primary focus:ring-primary",
            className
          )}
          {...props}
        />
        {errorMessage && (
          <p id={errorId} role="alert" className="text-xs text-destructive font-medium mt-0.5">
            {errorMessage}
          </p>
        )}
        {!errorMessage && helperText && (
          <p className="text-xs text-muted-foreground mt-0.5">{helperText}</p>
        )}
      </div>
    );
  }
);
Textarea.displayName = "Textarea";

// --- Select ---
export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  state?: "default" | "error" | "success";
  errorMessage?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, state = "default", errorMessage, id, children, ...props }, ref) => {
    const errorId = id ? `${id}-error` : undefined;
    const isError = state === "error" || !!errorMessage;

    return (
      <div className="w-full flex flex-col gap-1">
        <select
          id={id}
          ref={ref}
          aria-invalid={isError ? "true" : "false"}
          aria-describedby={isError && errorId ? errorId : undefined}
          className={cn(
            "w-full h-11 px-3.5 py-2 text-sm bg-card text-foreground rounded-md border shadow-sm transition-colors duration-fast focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed",
            isError
              ? "border-destructive text-destructive focus:ring-destructive"
              : "border-border hover:border-primary/50 focus:border-primary focus:ring-primary",
            className
          )}
          {...props}
        >
          {children}
        </select>
        {errorMessage && (
          <p id={errorId} role="alert" className="text-xs text-destructive font-medium mt-0.5">
            {errorMessage}
          </p>
        )}
      </div>
    );
  }
);
Select.displayName = "Select";

// --- Checkbox ---
export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: React.ReactNode;
  errorMessage?: string;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, errorMessage, id, ...props }, ref) => {
    const errorId = id ? `${id}-error` : undefined;

    return (
      <div className="flex flex-col gap-1">
        <label className="flex items-start gap-2.5 cursor-pointer text-sm text-foreground select-none">
          <input
            id={id}
            type="checkbox"
            ref={ref}
            className={cn(
              "h-5 w-5 mt-0.5 rounded border-border text-primary focus:ring-2 focus:ring-primary focus:ring-offset-1 transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-50",
              className
            )}
            {...props}
          />
          <span className="leading-tight">{label}</span>
        </label>
        {errorMessage && (
          <p id={errorId} role="alert" className="text-xs text-destructive font-medium pl-7">
            {errorMessage}
          </p>
        )}
      </div>
    );
  }
);
Checkbox.displayName = "Checkbox";

