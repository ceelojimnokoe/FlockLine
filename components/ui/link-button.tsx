import Link, { type LinkProps } from "next/link";
import { type AnchorHTMLAttributes } from "react";
import { buttonBaseClasses, buttonVariantClasses, type ButtonVariant } from "./button";
import { cn } from "@/lib/utils";

type LinkButtonProps = LinkProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof LinkProps> & {
    variant?: ButtonVariant;
  };

/** Button-styled navigation link, for empty-state CTAs and similar. */
export function LinkButton({ className, variant = "primary", ...props }: LinkButtonProps) {
  return (
    <Link
      className={cn(buttonBaseClasses, buttonVariantClasses[variant], className)}
      {...props}
    />
  );
}
