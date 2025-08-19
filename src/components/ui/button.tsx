import React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  children: React.ReactNode;
}

// Simple loading spinner component
const Spinner = ({ size = 16 }: { size?: number }) => (
  <svg
    className="animate-spin"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
  >
    <circle
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="2"
      strokeDasharray="60"
      strokeDashoffset="40"
      strokeLinecap="round"
    />
  </svg>
);

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      loading = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const baseClasses =
      "inline-flex items-center justify-center rounded-md font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed border text-center tracking-tight";

    const variantClasses = {
      primary:
        "bg-[var(--color-primary)] hover:bg-[#19378f] active:bg-[#142b70] text-white border-transparent shadow-sm hover:shadow focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2",
      secondary:
        "bg-white text-[var(--color-primary)] border border-[var(--color-primary)]/20 hover:bg-[var(--color-primary-bg)] active:bg-[#d1daf0]",
      outline:
        "bg-transparent text-[var(--color-primary)] border border-[var(--color-primary)] hover:bg-[var(--color-primary-bg)]",
      ghost:
        "bg-transparent text-[var(--color-primary)]/80 border-transparent hover:bg-[var(--color-primary-bg)]",
      danger:
        "bg-red-600 hover:bg-red-700 active:bg-red-800 text-white border-transparent",
    };

    const sizeClasses = {
      sm: "h-8 px-3 text-sm gap-1.5",
      md: "h-11 px-5 text-sm gap-2",
      lg: "h-12 px-7 text-base gap-2",
    };

    return (
      <button
        className={cn(
          baseClasses,
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        disabled={disabled || loading}
        ref={ref}
        {...props}
      >
        {loading && <Spinner size={16} />}
        {loading && <span />}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
