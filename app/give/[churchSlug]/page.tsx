import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { GiveForm } from "@/components/giving/give-form";
import { ChurchIdentity } from "@/components/layout/church-identity";
import { getPublicChurchBySlug, getPublicGivingFunds } from "@/lib/data/public-giving";

type PageProps = {
  params: Promise<{ churchSlug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { churchSlug } = await params;
  const church = await getPublicChurchBySlug(churchSlug);

  if (!church) return { title: "Give — FlockLine" };

  return {
    title: `Give to ${church.name}`,
    description: `Support ${church.name} securely online — card or mobile money.`,
    openGraph: {
      title: `Give to ${church.name}`,
      description: `Support ${church.name} securely online — card or mobile money.`,
      images: church.logo_url ? [{ url: church.logo_url }] : undefined,
    },
  };
}

export default async function GivePage({ params }: PageProps) {
  const { churchSlug } = await params;
  const church = await getPublicChurchBySlug(churchSlug);

  if (!church) notFound();

  const funds = await getPublicGivingFunds(church.id);

  return (
    <main className="min-h-dvh bg-background">
      <div className="bg-sky-100 px-5 py-6 text-primary-900">
        <div className="mx-auto w-full max-w-sm">
          <ChurchIdentity name={`Give to ${church.name}`} logoUrl={church.logo_url} size="lg" />
          <p className="mt-2 text-sm opacity-80">Secure giving — card or mobile money.</p>
          {church.giving_message && (
            <p className="mt-3 text-sm text-primary-900/90">{church.giving_message}</p>
          )}
        </div>
      </div>

      <div className="mx-auto w-full max-w-sm px-5 py-6">
        {funds.length === 0 ? (
          <p className="text-center text-base text-muted-foreground">
            This church hasn&apos;t set up giving yet. Please check back soon.
          </p>
        ) : (
          <GiveForm churchId={church.id} churchName={church.name} funds={funds} />
        )}
      </div>
    </main>
  );
}
