import { toWhatsAppUrl } from "@/lib/phone";
import { cn } from "@/lib/utils";

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M17.47 14.38c-.29-.15-1.71-.84-1.97-.94-.27-.1-.46-.15-.65.15-.2.29-.75.94-.92 1.13-.17.2-.34.22-.63.08-.29-.15-1.22-.45-2.32-1.43-.86-.76-1.44-1.71-1.6-2-.17-.29-.02-.45.13-.6.13-.13.29-.34.44-.51.15-.17.2-.29.29-.48.1-.2.05-.37-.02-.51-.08-.15-.65-1.57-.9-2.15-.24-.57-.48-.49-.65-.5h-.56c-.2 0-.51.07-.78.37-.27.29-1.02 1-1.02 2.43 0 1.43 1.04 2.81 1.19 3 .15.2 2.05 3.13 4.96 4.39.69.3 1.23.48 1.65.61.7.22 1.33.19 1.83.12.56-.08 1.71-.7 1.95-1.38.24-.68.24-1.26.17-1.38-.07-.13-.26-.2-.55-.35Z" />
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.83.5 3.55 1.36 5.03L2 22l5.24-1.44a9.9 9.9 0 0 0 4.8 1.22h.01c5.46 0 9.9-4.45 9.9-9.91C21.96 6.45 17.5 2 12.04 2Zm0 18.09h-.01a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-3.11.85.83-3.03-.19-.31a8.16 8.16 0 0 1-1.26-4.36c0-4.52 3.68-8.2 8.23-8.2 2.2 0 4.26.86 5.82 2.42a8.16 8.16 0 0 1 2.41 5.79c0 4.52-3.68 8.17-8.23 8.17Z" />
    </svg>
  );
}

/**
 * Renders nothing if the member has no valid, messageable phone number —
 * there's nothing safe to link to.
 */
export function WhatsAppButton({
  phone,
  variant = "icon",
  className,
}: {
  phone: string | null | undefined;
  variant?: "icon" | "button";
  className?: string;
}) {
  const url = toWhatsAppUrl(phone);
  if (!url) return null;

  if (variant === "icon") {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Message on WhatsApp"
        onClick={(e) => e.stopPropagation()}
        className={cn(
          "flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-primary-600 hover:bg-primary-50",
          className
        )}
      >
        <WhatsAppIcon className="h-6 w-6" />
      </a>
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "inline-flex min-h-tap items-center justify-center gap-2 rounded-xl bg-primary-600 px-5 text-base font-medium text-primary-foreground hover:bg-primary-700",
        className
      )}
    >
      <WhatsAppIcon className="h-5 w-5" />
      Message on WhatsApp
    </a>
  );
}
