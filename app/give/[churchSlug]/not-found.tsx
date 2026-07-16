export default function GivePageNotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-background px-6 py-10 text-center">
      <h1 className="text-xl font-semibold text-foreground">Giving page not found</h1>
      <p className="mt-2 max-w-xs text-base text-muted-foreground">
        This link doesn&apos;t match a church on FlockLine. Please check it with your church
        office.
      </p>
    </main>
  );
}
