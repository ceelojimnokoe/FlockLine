import { type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type AlertVariant = "error" | "success";

interface AlertProps extends HTMLAttributes<HTMLDivElement> {
  variant?: AlertVariant;
}

const variantClasses: Record<AlertVariant, string> = {
  error: "border-destructive/30 bg-destructive/10 text-destructive",
  success: "border-primary/30 bg-primary-50 text-primary-800",
};

export function Alert({ className, variant = "error", ...props }: AlertProps) {
  return (
    <div
      role="status"
      className={cn(
        "mb-6 rounded-xl border px-4 py-3 text-sm",
        variantClasses[variant],
        className
      )}
      {...props}
    />
  );
}
