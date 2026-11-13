import {
  formatCompactNumber,
  formatCurrency,
  formatSmartListingTitle,
  getKonamiIdStatusInfo,
  getListingPriceContext,
  getPlatformLabel,
  getPlaystyleLabel,
} from "@/lib/utils";
import { formatWhatsAppPhone } from "@/lib/utils/phone";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ListingService } from "@/services/listingService";
import { getVerifiedSellerReviews } from "@/services/reviewService";
import { Listing } from "@/types/database";
import { BuyNowButton } from "@/components/marketplace/BuyNowButton";
import { ListingGallery } from "@/components/marketplace/ListingGallery";
import { VerifiedSellerBadge } from "@/components/marketplace/VerifiedSellerBadge";
import { MakeOfferButton } from "@/components/marketplace/MakeOfferButton";
import { ProposeSwapModal } from "@/components/marketplace/ProposeSwapModal";
import { SellerReviewsSection } from "@/components/marketplace/SellerReviewsSection";
import { ChatSellerWhatsAppButton } from "@/components/marketplace/ChatSellerWhatsAppButton";
import { SellerListingOffersPanel } from "@/components/marketplace/SellerListingOffersPanel";
import { ListingCard } from "@/components/marketplace/ListingCard";
import { FavoriteButton } from "@/components/marketplace/FavoriteButton";
import { CompareButton } from "@/components/marketplace/CompareButton";
import {
  RecentlyViewedRow,
  RecentlyViewedTracker,
} from "@/components/marketplace/RecentlyViewedRow";
import { ListingActionsBar } from "@/components/marketplace/ListingActionsBar";
import { ListingStickyBottomBar } from "@/components/marketplace/ListingStickyBottomBar";
import { KonamiTransferChecklistTrigger } from "@/components/escrow/KonamiTransferChecklistModal";
import { AdBanner } from "@/components/common/AdBanner";
import { Button } from "@/components/ui/Button";
import { DetailTabLink } from "@/components/ui/DetailTabLink";
import {
  ArrowLeft,
  ArrowRight,
  ArrowRightLeft,
  CheckCircle2,
  Edit3,
  Lock,
  MessageCircle,
  ShieldCheck,
  Star,
  Users,
} from "lucide-react";
import { isListingOnFlashSale } from "@/lib/utils/flashSale";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Metadata } from "next";

export const revalidate = 0;

interface ListingDetailPageProps {
  params: {
    id: string;
  };
}

export async function generateMetadata({ params }: ListingDetailPageProps): Promise<Metadata> {
  try {
    const resolvedParams = await Promise.resolve(params);
    const supabase = createServerSupabaseClient();
    const listingService = new ListingService(supabase);
    const listing = await listingService.getListingById(resolvedParams.id);

    if (!listing) {
      return {
        title: "Squad Listing",
      };
    }

    const primaryImage =
      listing.images?.find((img) => img.is_primary)?.image_url ||
      listing.images?.[0]?.image_url ||
      "/opengraph-image";

    const displayTitle = formatSmartListingTitle(listing);
    const title = `${displayTitle} (${listing.overall_team_strength} OVR)`;
    const description = `${listing.overall_team_strength} OVR Clean Konami ID eFootball squad listed at ${formatCurrency(
      listing.price
    )}. Protected via Safaricom M-Pesa Till 1572931 with 24-hour buyer inspection.`;

    return {
      title,
      description,
      alternates: {
        canonical: `https://www.efootballmarket.co.ke/listings/${listing.id}`,
      },
      openGraph: {
        title,
        description,
        type: "website",
        images: [{ url: primaryImage, alt: displayTitle }],
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: [primaryImage],
      },
    };
  } catch {
    return {
      title: "Squad Listing",
    };
  }
}

export default async function ListingDetailPage({ params }: ListingDetailPageProps) {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const listingService = new ListingService(supabase);
  const listing = await listingService.getListingById(params.id);

  if (!listing) {
    notFound();
  }

  let relatedListings: Listing[] = [];
  try {
    const relatedResult = await listingService.getListings({
      platform: listing.platform,
      limit: 6,
    });
    relatedListings = (relatedResult.listings || []).filter((l) => l.id !== listing.id).slice(0, 3);
  } catch (err) {
    console.error("Error fetching related listings:", err);
  }

  const isOwner = Boolean(user && listing.seller_id === user.id);
  const konamiStatus = getKonamiIdStatusInfo(listing.konami_id_status);
  const displayTitle = formatSmartListingTitle(listing);
  const priceContext = getListingPriceContext(listing);
  const sellerReviews = listing.seller_id
    ? await getVerifiedSellerReviews(listing.seller_id, 6)
    : [];

  const primaryImage =
    listing.images?.find((img) => img.is_primary)?.image_url ||
    listing.images?.[0]?.image_url ||
    "https://www.efootballmarket.co.ke/opengraph-image";

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: "https://www.efootballmarket.co.ke",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Browse Squads",
        item: "https://www.efootballmarket.co.ke/browse",
      },
      {
        "@type": "ListItem",
        position: 3,
        name: getPlatformLabel(listing.platform),
        item: `https://www.efootballmarket.co.ke/browse?platform=${encodeURIComponent(
          listing.platform
        )}`,
      },
      {
        "@type": "ListItem",
        position: 4,
        name: displayTitle,
        item: `https://www.efootballmarket.co.ke/listings/${listing.id}`,
      },
    ],
  };

  const productJsonLd: Record<string, any> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: displayTitle,
    description:
      listing.description ||
      `${listing.overall_team_strength} OVR verified eFootball squad on ${getPlatformLabel(
        listing.platform
      )} with M-Pesa Till 1572931 escrow protection.`,
    sku: listing.id,
    image: [primaryImage],
    brand: {
      "@type": "Brand",
      name: "eFootball (Konami)",
    },
    offers: {
      "@type": "Offer",
      url: `https://www.efootballmarket.co.ke/listings/${listing.id}`,
      priceCurrency: listing.currency || "KES",
      price: Number(listing.price || 0),
      availability:
        listing.status === "published"
          ? "https://schema.org/InStock"
          : "https://schema.org/SoldOut",
      seller: {
        "@type": "Person",
        name: listing.seller?.username
          ? `@${listing.seller.username}`
          : "Verified Seller",
      },
    },
  };

  if (
    listing.seller &&
    Number(listing.seller.seller_rating) > 0 &&
    Number(listing.seller.total_reviews_count) > 0
  ) {
    productJsonLd.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: Number(listing.seller.seller_rating).toFixed(1),
      reviewCount: Number(listing.seller.total_reviews_count),
      bestRating: 5,
      worstRating: 1,
    };
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 lg:pb-12 w-full space-y-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([productJsonLd, breadcrumbJsonLd]).replace(
            /</g,
            "\\u003c"
          ),
        }}
      />
      {/* Top Breadcrumb Bar */}
      <RecentlyViewedTracker listing={listing} />
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-sx-border">
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-sx-muted flex-wrap">
          <Link href="/" className="hover:text-sx-ink transition-colors">
            Home
          </Link>
          <span className="text-sx-muted">/</span>
          <Link href="/browse" className="hover:text-sx-ink transition-colors">
            Browse Squads
          </Link>
          <span className="text-sx-muted">/</span>
          <Link
            href={`/browse?platform=${encodeURIComponent(listing.platform)}`}
            className="hover:text-sx-ink transition-colors"
          >
            {getPlatformLabel(listing.platform)}
          </Link>
          <span className="text-sx-muted">/</span>
          <span className="text-sx-ink-soft font-medium truncate max-w-[220px] sm:max-w-sm">
            {displayTitle}
          </span>
        </nav>

        <div className="flex items-center gap-2 flex-wrap">
          <CompareButton listing={listing} variant="pill" />
          <ListingActionsBar listingId={listing.id} listingTitle={displayTitle} />
          <FavoriteButton
            listingId={listing.id}
            initialCount={listing.favorites_count || 0}
            variant="pill"
          />
          <Link
            href="/browse"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-sx-muted hover:text-sx-ink transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Browse</span>
          </Link>
          {isOwner && listing.status !== "sold" && listing.status !== "in_escrow" && (
            <Link href={`/seller/edit-listing/${listing.id}`}>
              <Button variant="gold" size="sm">
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Listing</span>
              </Button>
            </Link>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 items-start">
        {/* Left Column: Screenshots & Squad Telemetry (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          <ListingGallery
            images={listing.images || []}
            title={displayTitle}
            platform={listing.platform}
            overallTeamStrength={listing.overall_team_strength}
          />

          {/* Main Squad Telemetry Sheet */}
          <div className="store-panel rounded-2xl p-6 sm:p-7 space-y-6">
            <div className="space-y-2 border-b border-sx-border pb-5">
              <div className="flex items-center gap-2 text-[11px] font-mono text-sx-muted flex-wrap">
                <span className="px-2 py-0.5 rounded bg-sx-stone border border-sx-border text-sx-ink-soft uppercase">
                  {getPlatformLabel(listing.platform)}
                </span>
                <span>ID: #{listing.id.slice(0, 8).toUpperCase()}</span>
                <span>&middot;</span>
                <span>Region: {listing.region || "Global"}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-sx-ink font-display">
                {displayTitle}
              </h1>

              {/* Above-the-Fold Seller Trust & Review Summary (Baymard PDP Standard) */}
              {listing.seller && (
                <div className="pt-1 flex flex-wrap items-center gap-2.5 text-xs text-sx-muted">
                  {listing.seller.username ? (
                    <Link
                      href={`/u/${encodeURIComponent(listing.seller.username)}`}
                      className="font-semibold text-sx-ink hover:text-sx-green-text hover:underline"
                    >
                      @{listing.seller.username}
                    </Link>
                  ) : null}
                  <VerifiedSellerBadge seller={listing.seller} size="sm" showPopover={true} />
                  {(listing.seller.completed_sales_count || 0) > 0 && (
                    <span className="inline-flex items-center gap-1 text-sx-ink-soft font-medium">
                      {listing.seller.seller_rating ? (
                        <>
                          <Star className="w-3.5 h-3.5 text-sx-amber-text fill-amber-400" />
                          <span className="font-mono font-bold">
                            {Number(listing.seller.seller_rating).toFixed(1)}
                          </span>
                          <span>&middot;</span>
                        </>
                      ) : null}
                      <span>
                        {listing.seller.completed_sales_count} verified{" "}
                        {listing.seller.completed_sales_count === 1 ? "sale" : "sales"}
                      </span>
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Standardized Squad Comparison Specs */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-xl bg-sx-stone border border-sx-border">
                <span className="block text-[10px] font-mono uppercase text-sx-muted">
                  Platform
                </span>
                <span className="text-sm font-bold text-sx-ink mt-1 block">
                  {getPlatformLabel(listing.platform)}
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-sx-stone border border-sx-border">
                <span className="block text-[10px] font-mono uppercase text-sx-muted">
                  Collective Strength
                </span>
                <span className="text-lg font-bold text-sx-green-text font-mono mt-0.5 block">
                  {listing.overall_team_strength ? `${listing.overall_team_strength} OVR` : "Declared"}
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-sx-stone border border-sx-border">
                <span className="block text-[10px] font-mono uppercase text-sx-muted">
                  eFootball Coins
                </span>
                <span className="text-lg font-bold text-sx-amber-text font-mono mt-0.5 block">
                  {formatCompactNumber(listing.coin_balance)}
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-sx-stone border border-sx-border">
                <span className="block text-[10px] font-mono uppercase text-sx-muted">
                  Manager
                </span>
                <span className="text-sm font-bold text-sx-ink truncate mt-1 block">
                  {listing.manager_name || "Not specified"}
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-sx-stone border border-sx-border">
                <span className="block text-[10px] font-mono uppercase text-sx-muted">
                  Playstyle
                </span>
                <span className="text-sm font-bold text-sx-ink truncate mt-1 block">
                  {getPlaystyleLabel(listing.primary_playstyle)}
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-sx-stone border border-sx-border">
                <span className="block text-[10px] font-mono uppercase text-sx-muted">
                  Formation &amp; Peak Div
                </span>
                <span className="text-sm font-bold text-sx-ink font-mono mt-1 block">
                  {listing.formation || "Custom XI"} · Div {listing.highest_division || listing.current_division}
                </span>
              </div>
            </div>

            {/* Compact Verification Strip (Detailed Info Opens in New Tab) */}
            <div className="px-4 py-3 rounded-xl bg-sx-subtle border border-sx-border flex flex-wrap items-center justify-between gap-2 text-xs text-sx-muted">
              <span className="inline-flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-sx-green-text shrink-0" />
                <span>
                  <strong className="text-sx-ink">24h Inspection Hold on Till 1572931:</strong>{" "}
                  Seller stats are verified in-game by you before payout.
                </span>
              </span>
              <DetailTabLink href="/escrow-guarantee">
                What We Check
              </DetailTabLink>
            </div>

            {/* Card Tier Counts */}
            {((listing.epic_players_count || 0) +
              (listing.big_time_players_count || 0) +
              (listing.highlight_players_count || 0) +
              (listing.featured_players_count || 0) +
              (listing.legend_players_count || 0) > 0 ||
              (listing.key_players_list && listing.key_players_list.length > 0)) && (
              <div className="p-5 rounded-xl bg-sx-stone border border-sx-border space-y-4">
                <h2 className="text-xs font-mono uppercase font-bold text-sx-muted tracking-wider">
                  Card Breakdown
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-center">
                  {[
                    { label: "Epics", value: listing.epic_players_count || 0, accent: "text-sx-amber-text" },
                    { label: "Big Time", value: listing.big_time_players_count || 0, accent: "text-sx-amber-text" },
                    { label: "Highlights", value: listing.highlight_players_count || 0, accent: "text-sx-green-text" },
                    { label: "Featured", value: listing.featured_players_count || 0, accent: "text-sx-ink" },
                    { label: "Legends", value: listing.legend_players_count || 0, accent: "text-sx-ink" },
                  ].map((tier) => (
                    <div
                      key={tier.label}
                      className="p-3 rounded-lg bg-sx-canvas border border-sx-border"
                    >
                      <span className="block text-[10px] font-mono uppercase text-sx-muted">
                        {tier.label}
                      </span>
                      <span className={`text-xl font-bold font-mono mt-0.5 block ${tier.accent}`}>
                        {tier.value}
                      </span>
                    </div>
                  ))}
                </div>

                {listing.key_players_list && listing.key_players_list.length > 0 && (
                  <div className="pt-3 border-t border-sx-border">
                    <span className="block text-[11px] font-mono uppercase text-sx-muted mb-2">
                      Notable Squad Players ({listing.key_players_list.length})
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {listing.key_players_list.map((player, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-1 rounded-md bg-sx-canvas border border-sx-border text-xs font-medium text-sx-ink-soft"
                        >
                          {player}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Seller Notes */}
            <div className="space-y-2">
              <h2 className="text-xs font-mono uppercase font-bold text-sx-muted tracking-wider">
                Seller Notes &amp; Tactical Setup ({getPlaystyleLabel(listing.primary_playstyle)})
              </h2>
              <div className="p-4 rounded-xl bg-sx-stone border border-sx-border text-xs sm:text-sm text-sx-ink-soft leading-relaxed whitespace-pre-line">
                {listing.description || "No additional seller notes provided."}
              </div>
            </div>

            {/* Clean Handover Reference Bar (Interactive 6-Step Checklist + Full Guides) */}
            <div className="p-4 rounded-xl bg-sx-subtle border border-sx-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-sx-ink font-semibold">
                <ShieldCheck className="w-4 h-4 text-sx-green-text shrink-0" />
                <span>24-Hour Buyer Handover &amp; Clean Konami ID Protocol</span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <KonamiTransferChecklistTrigger className="shadow-none py-1 rounded-full" />
                <DetailTabLink href="/dispute-policy" variant="pill">
                  Refund &amp; Dispute Rules
                </DetailTabLink>
              </div>
            </div>
          </div>

          {/* Verified Buyer Reviews for this Seller */}
          {listing.seller && (
            <SellerReviewsSection
              sellerUsername={listing.seller.username || "Trader"}
              sellerRating={listing.seller.seller_rating}
              totalReviewsCount={listing.seller.total_reviews_count}
              completedSalesCount={listing.seller.completed_sales_count}
              reviews={sellerReviews}
              compact
            />
          )}
        </div>

        {/* Right Column: Sticky Checkout & Seller Box (4 cols) */}
        <div id="listing-inline-cta" className="lg:col-span-4 space-y-5 lg:sticky lg:top-28">
          <div className="store-panel rounded-2xl p-6 space-y-5">
            <div className="pb-4 border-b border-sx-border space-y-2.5">
              <div>
                <span className="text-[11px] font-mono uppercase tracking-wider text-sx-muted">
                  Purchase Price
                </span>
                <div className="flex items-baseline justify-between gap-2 mt-1">
                  <span className="text-3xl font-bold text-sx-ink font-mono">
                    {formatCurrency(listing.price, listing.currency)}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-sx-green-tint border border-sx-green-border text-[10px] font-mono font-bold text-sx-green-text uppercase">
                    Till 1572931
                  </span>
                </div>
              </div>

              {listing.status === "published" && (
                <div
                  className={`px-3 py-2 rounded-xl border text-xs flex items-center justify-between gap-2 ${
                    priceContext.tier === "great_deal"
                      ? "bg-sx-green-tint border-sx-green-border text-sx-green-text"
                      : "bg-sx-stone border-sx-border text-sx-muted"
                  }`}
                >
                  <span className="font-bold text-sx-ink shrink-0">
                    {priceContext.label}
                  </span>
                  <span className="text-[11px] text-right">
                    {priceContext.detail}
                  </span>
                </div>
              )}

              {/* Transparent Buyer Cost Breakdown */}
              <div className="p-3 rounded-xl bg-sx-subtle border border-sx-border space-y-1.5 text-xs">
                <div className="flex items-center justify-between text-sx-muted">
                  <span>Squad Ask Price</span>
                  <span className="font-mono font-semibold text-sx-ink">
                    {formatCurrency(listing.price, listing.currency)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sx-muted">
                  <span>Buyer Escrow Protection Fee</span>
                  <span className="font-mono font-bold text-sx-green-text">
                    KES 0 (Free)
                  </span>
                </div>
                <div className="pt-1.5 border-t border-sx-border flex items-center justify-between font-bold text-sx-ink">
                  <span>Total M-Pesa Till 1572931</span>
                  <span className="font-mono text-sm">
                    {formatCurrency(listing.price, listing.currency)}
                  </span>
                </div>
              </div>
            </div>

            {/* Konami Link Status */}
            <div className="p-3.5 rounded-xl bg-sx-stone border border-sx-border space-y-1">
              <div className="flex items-center gap-2">
                <Lock className="w-3.5 h-3.5 text-sx-green-text" />
                <span className="text-xs font-semibold text-sx-ink">{konamiStatus.label}</span>
              </div>
              <p className="text-[11px] text-sx-muted leading-relaxed">
                {konamiStatus.description}
              </p>
            </div>

            {/* Primary Actions */}
            {isOwner ? (
              <div className="space-y-3">
                {listing.status === "sold" ? (
                  <div className="p-4 rounded-xl bg-sx-stone border border-sx-border text-center space-y-1">
                    <span className="text-xs font-bold text-sx-ink-soft block">Sold &amp; Transferred</span>
                    <p className="text-[11px] text-sx-muted">Sold accounts cannot be edited.</p>
                  </div>
                ) : listing.status === "in_escrow" ? (
                  <div className="p-4 rounded-xl bg-sx-amber-tint border border-sx-amber-border text-center space-y-1">
                    <span className="text-xs font-bold text-sx-amber-text block">In Active Escrow</span>
                    <p className="text-[11px] text-sx-muted">Locked during buyer handover.</p>
                  </div>
                ) : (
                  <Link href={`/seller/edit-listing/${listing.id}`} className="block">
                    <Button variant="gold" size="lg" className="w-full">
                      <Edit3 className="w-4 h-4" />
                      <span>Edit Listing</span>
                    </Button>
                  </Link>
                )}

                {listing.status === "published" && (
                  <SellerListingOffersPanel listingId={listing.id} />
                )}
              </div>
            ) : listing.status !== "published" ? (
              <div className="p-4 rounded-xl bg-sx-stone border border-sx-border text-center space-y-2">
                <Lock className="w-5 h-5 text-sx-amber-text mx-auto" />
                <h3 className="text-sm font-bold text-sx-ink">
                  {listing.status === "sold" ? "Account Sold" : "Locked in Escrow"}
                </h3>
                <p className="text-xs text-sx-muted">
                  {listing.status === "sold"
                    ? "This squad has already been delivered to a buyer."
                    : "A buyer is currently completing their 24-hour inspection."}
                </p>
                <Link href="/browse" className="inline-block pt-1">
                  <Button variant="secondary" size="sm">
                    Browse Available Squads
                  </Button>
                </Link>
              </div>
            ) : isListingOnFlashSale(listing) ? (
              <div className="space-y-2.5">
                <div className="p-3 rounded-xl bg-sx-amber-tint border border-amber-500/35 text-xs text-sx-amber-text">
                  <strong className="text-sx-ink block">Friday Drop Fixed Price</strong>
                  <span className="text-[11px] text-sx-amber-text">
                    Custom offers are paused during the 8-hour Friday Drop window.
                  </span>
                </div>
                <BuyNowButton
                  listingId={listing.id}
                  priceFormatted={formatCurrency(listing.price, listing.currency)}
                />
                <ChatSellerWhatsAppButton
                  sellerUsername={listing.seller?.username}
                  listingId={listing.id}
                  listingTitle={displayTitle}
                  listingPrice={listing.price}
                  listingCurrency={listing.currency}
                  overallTeamStrength={listing.overall_team_strength}
                />
              </div>
            ) : (
              <div className="space-y-2.5">
                <BuyNowButton
                  listingId={listing.id}
                  priceFormatted={formatCurrency(listing.price, listing.currency)}
                />
                <MakeOfferButton listing={listing} className="w-full" />
                <ChatSellerWhatsAppButton
                  sellerUsername={listing.seller?.username}
                  listingId={listing.id}
                  listingTitle={displayTitle}
                  listingPrice={listing.price}
                  listingCurrency={listing.currency}
                  overallTeamStrength={listing.overall_team_strength}
                />
              </div>
            )}

            {/* On-Platform Escrow Swap Proposal + WhatsApp Option */}
            {listing.allows_swap && !isOwner && !isListingOnFlashSale(listing) && listing.status === "published" && (
              <div className="p-3.5 rounded-xl bg-sx-subtle border border-sx-green-border space-y-2.5">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-sx-green-text">
                  <ArrowRightLeft className="w-3.5 h-3.5" />
                  <span>Open to Squad Swap + Cash Top-Up</span>
                </div>
                {listing.swap_preferences && (
                  <p className="text-[11px] text-sx-ink-soft leading-relaxed">
                    Preferences: &ldquo;{listing.swap_preferences}&rdquo;
                  </p>
                )}
                <ProposeSwapModal listing={listing} />
              </div>
            )}

            {/* Compact Protection Summary + New-Tab Detailed Rules */}
            <div className="border-t border-sx-border pt-3.5 space-y-2 text-xs text-sx-muted">
              <div className="flex items-center gap-2 text-sx-ink font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5 text-sx-green-text shrink-0" />
                <span>KES 0 buyer fee · 12h delivery · 24h login check</span>
              </div>
              <div className="flex items-center justify-between gap-2 text-[11px]">
                <span>Independent marketplace (publisher rules apply)</span>
                <DetailTabLink href="/escrow-guarantee">
                  Full Rules
                </DetailTabLink>
              </div>
            </div>

            {/* Seller Card */}
            <div className="border-t border-sx-border pt-4 space-y-3">
              <span className="block text-[10px] font-mono uppercase tracking-wider text-sx-muted">
                Listed By (tap badge for details)
              </span>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-sx-stone border border-sx-border flex items-center justify-center font-mono font-bold text-xs text-sx-ink-soft">
                  {listing.seller?.username ? listing.seller.username.slice(0, 2).toUpperCase() : <Users className="w-4 h-4" />}
                </div>
                <div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {listing.seller?.username ? (
                      <Link
                        href={`/u/${encodeURIComponent(listing.seller.username)}`}
                        className="text-sm font-semibold text-sx-ink hover:text-sx-green-text hover:underline transition-colors"
                      >
                        @{listing.seller.username}
                      </Link>
                    ) : (
                      <span className="text-sm font-semibold text-sx-ink">Seller</span>
                    )}
                    <VerifiedSellerBadge seller={listing.seller} size="sm" showPopover={true} />
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-sx-muted mt-0.5">
                    {(listing.seller?.completed_sales_count || 0) > 0 ? (
                      <>
                        {listing.seller?.seller_rating ? (
                          <>
                            <Star className="w-3 h-3 text-sx-amber-text fill-amber-400" />
                            <span>{Number(listing.seller.seller_rating).toFixed(1)}</span>
                            <span>&middot;</span>
                          </>
                        ) : null}
                        <span>
                          {listing.seller?.completed_sales_count} completed{" "}
                          {listing.seller?.completed_sales_count === 1 ? "sale" : "sales"}
                        </span>
                      </>
                    ) : listing.seller?.is_verified_seller ? (
                      <span>National ID &amp; M-Pesa phone checked · 0 sales yet</span>
                    ) : (
                      <span>0 sales yet · Payment held in 24h escrow</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <AdBanner
        slot="listing_detail_bottom"
        format="horizontal"
        hasContent={Boolean(listing.description && listing.description.length > 80)}
      />

      {/* Related Squads */}
      {relatedListings.length > 0 && (
        <section className="pt-6 border-t border-sx-border space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-sx-ink font-display">
              More {getPlatformLabel(listing.platform)} Squads
            </h2>
            <Link
              href={`/browse?platform=${listing.platform}`}
              className="inline-flex items-center gap-1 text-xs font-semibold text-sx-green-text hover:text-sx-green-text"
            >
              <span>View all</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {relatedListings.map((relListing) => (
              <ListingCard key={relListing.id} listing={relListing} />
            ))}
          </div>
        </section>
      )}

      {/* Recently Inspected Squads */}
      <RecentlyViewedRow excludeId={listing.id} minItems={1} />

      {/* Smart Mobile Sticky Action Bar (auto-hides whenever inline Purchase Card is visible on screen) */}
      <ListingStickyBottomBar
        listing={listing}
        isOwner={isOwner}
        isFlashSale={isListingOnFlashSale(listing)}
      />
    </div>
  );
}
