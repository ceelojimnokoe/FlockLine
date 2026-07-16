import Link from "next/link";

export function Fab({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      aria-label={label}
      className="fixed bottom-24 right-4 z-30 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-600 text-3xl font-medium leading-none text-primary-foreground shadow-lg shadow-primary-900/30 hover:bg-primary-700 print:hidden"
    >
      +
    </Link>
  );
}
