export type SellerTierLevel = "rookie" | "verified" | "master";

export interface SellerTierInfo {
  level: SellerTierLevel;
  label: string;
  shortLabel: string;
  badgeClass: string;
  iconType: "shield" | "shield-check" | "crown";
  salesRequiredForNext: number;
  nextTierLabel: string | null;
  description: string;
  perks: string[];
}

export function getSellerTier(salesCount: number = 0, rating: number = 5.0): SellerTierInfo {
  const count = Math.max(0, Number(salesCount) || 0);
  const rate = Number(rating) || 5.0;

  if (count >= 10 && rate >= 4.5) {
    return {
      level: "master",
      label: "Top Rated Trader",
      shortLabel: "Top Rated",
      badgeClass:
        "bg-sx-amber-tint border-sx-amber-border text-sx-amber-text",
      iconType: "crown",
      salesRequiredForNext: 0,
      nextTierLabel: null,
      description: "High-volume seller with 10+ completed escrow account transfers and strong buyer feedback.",
      perks: [
        "Top Rated Trader badge on all listings",
        "Priority browse visibility",
        "Fast-track M-Pesa withdrawal processing",
        "Direct trade support channel",
      ],
    };
  }

  if (count >= 3) {
    const remaining = Math.max(0, 10 - count);
    return {
      level: "verified",
      label: "Experienced Trader",
      shortLabel: "Experienced",
      badgeClass:
        "bg-sx-green-tint border-sx-green-border text-sx-green-text",
      iconType: "shield-check",
      salesRequiredForNext: remaining,
      nextTierLabel: "Top Rated Trader",
      description: "Active seller with 3+ completed account transfers under platform escrow.",
      perks: [
        "Experienced Trader shield badge on all listings",
        "Elevated browse ranking above new sellers",
        "Access to WhatsApp promotional flyer tools",
      ],
    };
  }

  const remaining = Math.max(0, 3 - count);
  return {
    level: "rookie",
    label: "New Trader",
    shortLabel: "New",
    badgeClass:
      "bg-sx-stone border-sx-border text-sx-muted",
    iconType: "shield",
    salesRequiredForNext: remaining,
    nextTierLabel: "Experienced Trader",
    description: "Seller trading under standard 24-hour Safaricom Till 1572931 Escrow Protection.",
    perks: [
      "Escrow Protection via Till 1572931",
      "Transparent platform escrow commission",
      "Automatic tier upgrade after 3 completed sales",
    ],
  };
}
