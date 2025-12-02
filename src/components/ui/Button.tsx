"use client";

import { cn } from "@/lib/utils";
import { ReactNode, ButtonHTMLAttributes } from "react";
import { Loader2 } from "lucide-react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost" | "outline" | "danger";
  size?: "sm" | "md" | "lg" | "icon";
  isLoading?: boolean;
  fullWidth?: boolean;
}

export function Button({
  children,
  variant = "primary",
  size = "md",
  isLoading = false,
  fullWidth = false,
  className = "",
  disabled,
  ...props
}: ButtonProps) {
  const variants = {
    primary:
      "bg-lava-orange hover:bg-lava-spanish-orange text-white shadow-lg shadow-lava-orange/20",
    secondary: "bg-grey-425 hover:bg-grey-200/20 text-white",
    ghost: "bg-transparent hover:bg-grey-425/50 text-white",
    outline:
      "bg-transparent border border-grey-425 hover:border-grey-200 text-white",
    danger: "bg-lava-red hover:bg-lava-red/80 text-white",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-sm rounded-lg",
    md: "px-4 py-2.5 text-sm rounded-xl",
    lg: "px-6 py-3.5 text-base rounded-xl",
    icon: "p-2.5 rounded-xl",
  };

  return (
    <button
      className={cn(
        "font-semibold transition-all duration-200 touch-feedback disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2",
        variants[variant],
        sizes[size],
        fullWidth && "w-full",
        className
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
      {children}
    </button>
  );
}


