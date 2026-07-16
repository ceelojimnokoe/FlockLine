import { redirect } from "next/navigation";
import { TopBar } from "@/components/layout/top-bar";
import { BottomNav } from "@/components/layout/bottom-nav";
import { getCurrentChurch } from "@/lib/data/church";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const church = await getCurrentChurch();

  if (!church) {
    redirect("/onboarding");
  }

  return (
    <div className="min-h-dvh bg-background">
      <TopBar churchName={church.name} />
      <main className="mx-auto max-w-2xl px-4 pb-24 pt-4 print:p-0">{children}</main>
      <BottomNav />
    </div>
  );
}
