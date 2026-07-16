import { redirect } from "next/navigation";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ChurchLogoUpload } from "@/components/settings/church-logo-upload";
import { ChurchProfileForm } from "@/components/settings/church-profile-form";
import { getCurrentChurchUser, getChurchProfile } from "@/lib/data/church";

export default async function ChurchSettingsPage() {
  const churchUser = await getCurrentChurchUser();
  if (!churchUser) redirect("/onboarding");

  // Let a genuine query failure (bad column, RLS, network) throw and hit
  // this route's error.tsx — the old code here swallowed the query's error
  // entirely and treated a failed fetch the same as "no church," silently
  // bouncing the admin back to /dashboard with no indication anything had
  // gone wrong. `church === null` now only ever means "row genuinely
  // doesn't exist," which the page below shows an honest empty state for.
  const church = await getChurchProfile(churchUser.church_id);

  if (!church) {
    return (
      <div className="space-y-4">
        <h1 className="font-display text-2xl font-semibold text-foreground">Church profile</h1>
        <EmptyState
          title="No church profile found"
          description="We couldn't find a church profile for your account. If you just signed up, try finishing onboarding again."
        />
      </div>
    );
  }

  if (churchUser.role !== "admin") {
    return (
      <div className="space-y-4">
        <h1 className="font-display text-2xl font-semibold text-foreground">Church profile</h1>
        <Card>
          <p className="text-base text-muted-foreground">
            Only admins can edit the church profile.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl font-semibold text-foreground">Church profile</h1>

      <Card>
        <h2 className="text-lg font-semibold text-foreground">Logo</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Shown across FlockLine and on your public giving page.
        </p>
        <div className="mt-4">
          <ChurchLogoUpload
            churchId={church.id}
            churchName={church.name}
            currentLogoUrl={church.logo_url}
          />
        </div>
      </Card>

      <Card>
        <h2 className="text-lg font-semibold text-foreground">Details</h2>
        <div className="mt-4">
          <ChurchProfileForm church={church} />
        </div>
      </Card>
    </div>
  );
}
