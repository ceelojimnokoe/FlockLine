import Image from "next/image";
import { cn } from "@/lib/utils";

const SIZE_CLASSES = {
  sm: "h-10 w-10 text-sm",
  md: "h-14 w-14 text-base",
  lg: "h-20 w-20 text-xl",
} as const;

// Matches the Tailwind h-10/h-14/h-20 above (2.5rem/3.5rem/5rem @ 16px root)
// — next/image needs explicit intrinsic dimensions since these are remote,
// dynamically-sized URLs it can't otherwise infer.
const SIZE_PX = {
  sm: 40,
  md: 56,
  lg: 80,
} as const;

// A small, muted, varied palette so a scannable list of avatars doesn't
// read as one flat wall of the same brand blue — decorative/identity
// accents, not primary UI color, same rationale as the WhatsApp button
// staying WhatsApp-green.
const AVATAR_COLORS = [
  "bg-[#3E7C6A] text-white", // teal
  "bg-[#A9720F] text-white", // amber
  "bg-[#6D4FA0] text-white", // purple
  "bg-[#B0533C] text-white", // terracotta
  "bg-[#2F7391] text-white", // steel blue
  "bg-[#5B6B8C] text-white", // slate blue
] as const;

function hashToIndex(key: string, length: number): number {
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash * 31 + key.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) % length;
}

export function MemberAvatar({
  id,
  firstName,
  lastName,
  photoUrl,
  size = "md",
  className,
}: {
  /** Used to deterministically pick a color so the same person always gets the same one. Falls back to name if omitted. */
  id?: string;
  firstName: string;
  lastName: string;
  photoUrl?: string | null;
  size?: keyof typeof SIZE_CLASSES;
  className?: string;
}) {
  if (photoUrl) {
    return (
      <Image
        src={photoUrl}
        alt=""
        width={SIZE_PX[size]}
        height={SIZE_PX[size]}
        className={cn("shrink-0 rounded-xl object-cover", SIZE_CLASSES[size], className)}
      />
    );
  }

  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  const colorClass = AVATAR_COLORS[hashToIndex(id || `${firstName}${lastName}`, AVATAR_COLORS.length)];

  return (
    <div
      aria-hidden="true"
      className={cn(
        "flex shrink-0 items-center justify-center rounded-xl font-semibold",
        colorClass,
        SIZE_CLASSES[size],
        className
      )}
    >
      {initials}
    </div>
  );
}
