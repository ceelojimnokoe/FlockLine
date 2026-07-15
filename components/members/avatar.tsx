import { cn } from "@/lib/utils";

const SIZE_CLASSES = {
  sm: "h-10 w-10 text-sm",
  md: "h-14 w-14 text-base",
  lg: "h-20 w-20 text-xl",
} as const;

export function MemberAvatar({
  firstName,
  lastName,
  photoUrl,
  size = "md",
  className,
}: {
  firstName: string;
  lastName: string;
  photoUrl?: string | null;
  size?: keyof typeof SIZE_CLASSES;
  className?: string;
}) {
  if (photoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- member photos are arbitrary external URLs, not build-time known
      <img
        src={photoUrl}
        alt=""
        className={cn("shrink-0 rounded-full object-cover", SIZE_CLASSES[size], className)}
      />
    );
  }

  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();

  return (
    <div
      aria-hidden="true"
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-primary-100 font-semibold text-primary-800",
        SIZE_CLASSES[size],
        className
      )}
    >
      {initials}
    </div>
  );
}
