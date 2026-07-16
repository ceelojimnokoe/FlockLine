import Link from "next/link";
import { cn } from "@/lib/utils";

const TONE_CLASSES = {
  accent: "bg-sky-50 border-sky-200",
  destructive: "bg-destructive/10 border-destructive/30",
  neutral: "bg-card border-border",
} as const;

const TONE_VALUE_CLASSES = {
  accent: "text-sky-800",
  destructive: "text-destructive",
  neutral: "text-foreground",
} as const;

export type StatCardTone = keyof typeof TONE_CLASSES;

export function StatCard({
  href,
  value,
  label,
  tone = "neutral",
}: {
  href?: string;
  value: number | string;
  label: string;
  tone?: StatCardTone;
}) {
  const className = cn(
    "min-h-tap rounded-xl border p-3 text-center",
    TONE_CLASSES[tone],
    href && "hover:opacity-90"
  );

  const content = (
    <>
      <p className={cn("font-display text-2xl font-semibold", TONE_VALUE_CLASSES[tone])}>
        {value}
      </p>
      <p className="mt-0.5 text-xs text-muted-foreground">{label}</p>
    </>
  );

  if (href) {
    return (
      <Link href={href} className={className}>
        {content}
      </Link>
    );
  }

  return <div className={className}>{content}</div>;
}
