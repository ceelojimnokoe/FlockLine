import Link from "next/link";
import { Upload, MessageSquareText, LogOut, ChevronRight, Building2, Users2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { signOut } from "@/app/dashboard/actions";

const LINKS = [
  {
    href: "/dashboard/settings/church",
    label: "Church profile",
    icon: Building2,
  },
  {
    href: "/dashboard/groups",
    label: "Groups & sessions",
    icon: Users2,
  },
  {
    href: "/dashboard/members/import",
    label: "Import members from CSV",
    icon: Upload,
  },
  {
    href: "/dashboard/followups/templates",
    label: "Manage WhatsApp templates",
    icon: MessageSquareText,
  },
];

export default function MorePage() {
  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl font-semibold text-foreground">More</h1>

      <Card className="p-0">
        <ul className="divide-y divide-border">
          {LINKS.map((link) => {
            const Icon = link.icon;
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="flex min-h-tap items-center gap-3 px-4 text-base text-foreground hover:bg-neutral-100"
                >
                  <Icon className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
                  <span className="flex-1">{link.label}</span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                </Link>
              </li>
            );
          })}
        </ul>
      </Card>

      <Card className="p-0">
        <form action={signOut}>
          <button
            type="submit"
            className="flex min-h-tap w-full items-center gap-3 px-4 text-base font-medium text-destructive hover:bg-destructive/5"
          >
            <LogOut className="h-5 w-5" aria-hidden="true" />
            Sign out
          </button>
        </form>
      </Card>
    </div>
  );
}
