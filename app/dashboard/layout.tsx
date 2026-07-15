import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TopBar } from "@/components/layout/top-bar";
import { BottomNav } from "@/components/layout/bottom-nav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const { data: churchUser } = await supabase
    .from("church_users")
    .select("church_id")
    .maybeSingle();

  if (!churchUser) {
    redirect("/onboarding");
  }

  const { data: church } = await supabase
    .from("churches")
    .select("name")
    .eq("id", churchUser.church_id)
    .single();

  const churchName = church?.name ?? "Your Church";

  return (
    <div className="min-h-dvh bg-background">
      <TopBar churchName={churchName} />
      <main className="mx-auto max-w-2xl px-4 pb-24 pt-4">{children}</main>
      <BottomNav />
    </div>
  );
}
