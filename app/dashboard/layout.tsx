import { redirect } from "next/navigation";
import { TopBar } from "@/components/layout/top-bar";
import { BottomNav } from "@/components/layout/bottom-nav";
import { DesktopSidebar } from "@/components/layout/desktop-sidebar";
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
    <div className="min-h-dvh bg-background md:pl-60">
      <DesktopSidebar churchName={church.name} logoUrl={church.logo_url} />
      <TopBar churchName={church.name} logoUrl={church.logo_url} />
      <main className="mx-auto max-w-5xl px-4 pb-24 pt-4 md:pb-8 print:p-0">{children}</main>
      <BottomNav />
    </div>
  );
}
