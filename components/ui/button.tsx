import { type ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

export type ButtonVariant = "primary" | "secondary" | "ghost";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

export const buttonVariantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-primary text-primary-foreground hover:bg-primary-700 active:bg-primary-800",
  secondary:
    "bg-neutral-200 text-foreground hover:bg-neutral-300 active:bg-neutral-400",
  ghost: "bg-transparent text-primary hover:bg-primary-50",
};

export const buttonBaseClasses =
  "inline-flex min-h-tap items-center justify-center rounded-xl px-5 text-base font-medium transition-colors disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(buttonBaseClasses, buttonVariantClasses[variant], className)}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
