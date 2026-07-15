import { signOut } from "@/app/dashboard/actions";

export function TopBar({ churchName }: { churchName: string }) {
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-card">
      <div className="mx-auto flex min-h-tap max-w-2xl items-center justify-between px-4">
        <span className="truncate text-lg font-semibold text-foreground">
          {churchName}
        </span>
        <form action={signOut}>
          <button
            type="submit"
            className="min-h-tap px-2 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            Sign out
          </button>
        </form>
      </div>
    </header>
  );
}
