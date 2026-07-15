import { createClient } from "@/lib/supabase/server";
import { TopBar } from "@/components/layout/top-bar";
import { BottomNav } from "@/components/layout/bottom-nav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userMetadata = data?.claims?.user_metadata as
    | { church_name?: string }
    | undefined;
  const churchName = userMetadata?.church_name || "Your Church";

  return (
    <div className="min-h-dvh bg-background">
      <TopBar churchName={churchName} />
      <main className="mx-auto max-w-2xl px-4 pb-24 pt-4">{children}</main>
      <BottomNav />
    </div>
  );
}
