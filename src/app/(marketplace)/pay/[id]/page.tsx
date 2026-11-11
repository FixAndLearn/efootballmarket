import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ListingService } from "@/services/listingService";
import { DirectCheckoutForm } from "@/components/marketplace/DirectCheckoutForm";
import { formatSmartListingTitle } from "@/lib/utils";
import { notFound } from "next/navigation";
import { Metadata } from "next";

export const revalidate = 0;

interface DirectPayPageProps {
  params: {
    id: string;
  };
}

export async function generateMetadata({ params }: DirectPayPageProps): Promise<Metadata> {
  const supabase = createServerSupabaseClient();
  const listingService = new ListingService(supabase);
  const listing = await listingService.getListingById(params.id);

  if (!listing) {
    return { title: "Direct Checkout | eFootballMarket" };
  }

  const displayTitle = formatSmartListingTitle(listing);
  return {
    title: `Instant M-Pesa Checkout: ${displayTitle} | eFootballMarket`,
    description: `Pay KES ${listing.price.toLocaleString()} securely via Till 1572931 escrow for ${displayTitle}. Escrow-protected Konami ID transfer with 24-hour inspection.`,
  };
}

export default async function DirectPayPage({ params }: DirectPayPageProps) {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile = null;
  if (user) {
    const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
    profile = data;
  }

  const listingService = new ListingService(supabase);
  const listing = await listingService.getListingById(params.id);

  if (!listing) {
    notFound();
  }

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full space-y-4">
      <div className="p-4 rounded-xl bg-sx-stone border border-sx-border text-xs text-sx-ink-soft leading-relaxed">
        <strong className="text-sx-ink">Before you pay (Till 1572931 · KES 0 extra buyer fee):</strong>{" "}
        Safaricom M-Pesa transfers your payment to eFootballMarket Kenya&apos;s business Buy Goods Till 1572931, where we hold the funds during the seller&apos;s 12-hour delivery window and your 24-hour login inspection (which starts when credentials are submitted). Note that Konami&apos;s Terms of Use restrict account transfers and publisher rules apply after handover.
      </div>
      <DirectCheckoutForm
        listing={listing}
        currentUserId={user?.id}
        currentUserPhone={profile?.phone_number || ""}
        currentUserName={profile?.first_name ? `${profile.first_name} ${profile.last_name || ""}`.trim() : profile?.username || ""}
      />
    </div>
  );
}
