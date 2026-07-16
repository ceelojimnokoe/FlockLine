const RELATIVE_UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 60 * 60 * 24 * 365],
  ["month", 60 * 60 * 24 * 30],
  ["week", 60 * 60 * 24 * 7],
  ["day", 60 * 60 * 24],
  ["hour", 60 * 60],
  ["minute", 60],
];

const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

/** "3 days ago", "2 months ago" — falls back to "just now" for <1 minute. */
export function formatRelativeDate(iso: string): string {
  const seconds = (new Date(iso).getTime() - Date.now()) / 1000;
  for (const [unit, secondsInUnit] of RELATIVE_UNITS) {
    if (Math.abs(seconds) >= secondsInUnit) {
      return rtf.format(Math.round(seconds / secondsInUnit), unit);
    }
  }
  return "just now";
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/** "Tue, 16 Jul · 6:00 PM" — used for session/meeting timestamps. */
export function formatDateTime(iso: string): string {
  const date = new Date(iso);
  const datePart = date.toLocaleDateString("en-GH", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
  const timePart = date.toLocaleTimeString("en-GH", { hour: "numeric", minute: "2-digit" });
  return `${datePart} · ${timePart}`;
}

export function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat("en-GH", {
    style: "currency",
    currency,
    currencyDisplay: "narrowSymbol",
  }).format(amount);
}

/**
 * Always computed in Ghana's timezone regardless of where the server
 * itself runs — a Server Component has no access to the visitor's actual
 * timezone, and "Good evening" showing at 8am because the server is on
 * UTC would be a worse bug than just assuming this app's primary market.
 */
export function getTimeOfDayGreeting(): string {
  const hour = Number(
    new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      hour12: false,
      timeZone: "Africa/Accra",
    }).format(new Date())
  );
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}
