import Image from "next/image";
import { cn } from "@/lib/utils";

const SIZE_CLASSES = {
  sm: "h-8 w-8 text-sm",
  md: "h-10 w-10 text-base",
  lg: "h-14 w-14 text-xl",
} as const;

// Matches the Tailwind h-8/h-10/h-14 above — see the same note in avatar.tsx.
const SIZE_PX = {
  sm: 32,
  md: 40,
  lg: 56,
} as const;

/**
 * Logo chip + name (+ optional subtitle), used in both the blue TopBar and
 * on light backgrounds (login, the public give page) — text color is
 * deliberately left to `currentColor` / opacity rather than hardcoded, so
 * it reads correctly against either.
 */
export function ChurchIdentity({
  name,
  logoUrl,
  subtitle,
  size = "md",
}: {
  name: string;
  logoUrl?: string | null;
  subtitle?: string;
  size?: keyof typeof SIZE_CLASSES;
}) {
  const initial = name.charAt(0).toUpperCase();

  return (
    <div className="flex min-w-0 items-center gap-2.5">
      {logoUrl ? (
        <Image
          src={logoUrl}
          alt=""
          width={SIZE_PX[size]}
          height={SIZE_PX[size]}
          className={cn("shrink-0 rounded-xl object-cover", SIZE_CLASSES[size])}
        />
      ) : (
        <div
          aria-hidden="true"
          className={cn(
            "flex shrink-0 items-center justify-center rounded-xl bg-sky-400 font-display font-semibold text-primary-950",
            SIZE_CLASSES[size]
          )}
        >
          {initial}
        </div>
      )}
      <div className="min-w-0">
        <p className="truncate font-semibold leading-tight">{name}</p>
        {subtitle && <p className="truncate text-xs leading-tight opacity-80">{subtitle}</p>}
      </div>
    </div>
  );
}
