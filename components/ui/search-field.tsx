import { Search } from "lucide-react";
import { type InputHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

export const SearchField = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <div className="relative">
    <Search
      aria-hidden="true"
      className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
    />
    <input
      ref={ref}
      type="search"
      className={cn(
        "min-h-tap w-full rounded-xl border border-input bg-card pl-10 pr-4 text-base text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className
      )}
      {...props}
    />
  </div>
));
SearchField.displayName = "SearchField";
