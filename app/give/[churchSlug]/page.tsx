import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { GiveForm } from "@/components/giving/give-form";
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
    <main className="flex min-h-dvh flex-col justify-center bg-background px-5 py-10">
      <div className="mx-auto w-full max-w-sm">
        <div className="mb-8 text-center">
          {church.logo_url && (
            // eslint-disable-next-line @next/next/no-img-element -- arbitrary external church logo URL
            <img
              src={church.logo_url}
              alt=""
              className="mx-auto mb-3 h-16 w-16 rounded-full object-cover"
            />
          )}
          <h1 className="text-2xl font-semibold text-foreground">{church.name}</h1>
          <p className="mt-1 text-base text-muted-foreground">
            Give securely with card or mobile money.
          </p>
        </div>

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
