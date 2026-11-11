export type SellerTierLevel = "new_seller" | "proven_seller" | "id_verified" | "top_seller";

export interface SellerTierInfo {
  level: SellerTierLevel;
  label: string;
  shortLabel: string;
  badgeClass: string;
  iconType: "shield" | "shield-check" | "crown";
  salesRequiredForNext: number;
  nextTierLabel: string | null;
  whatWasChecked: string[];
  description: string;
  perks: string[];
}

export function getSellerTier(
  salesCount: number = 0,
  rating: number = 0,
  isVerifiedSeller: boolean = false
): SellerTierInfo {
  const count = Math.max(0, Number(salesCount) || 0);
  const rate = Number(rating) || 0;

  if (isVerifiedSeller && count >= 10 && (rate === 0 || rate >= 4.5)) {
    return {
      level: "top_seller",
      label: `ID-Verified · ${count} Sales`,
      shortLabel: "ID-Verified",
      badgeClass: "bg-sx-amber-tint border-sx-amber-border text-sx-amber-text",
      iconType: "crown",
      salesRequiredForNext: 0,
      nextTierLabel: null,
      whatWasChecked: [
        "Kenyan National ID / Passport checked by eFootballMarket",
        "Registered M-Pesa payout phone number matched",
        `${count} escrow transfers confirmed by buyers`,
      ],
      description:
        "Identity-checked seller with 10+ completed M-Pesa escrow squad transfers.",
      perks: [
        "ID-Verified Top Seller badge",
        "Priority placement in Browse results",
        "Fast M-Pesa payout processing",
      ],
    };
  }

  if (isVerifiedSeller) {
    return {
      level: "id_verified",
      label: count > 0 ? `ID-Verified · ${count} ${count === 1 ? "Sale" : "Sales"}` : "ID-Verified Seller",
      shortLabel: "ID-Verified",
      badgeClass: "bg-sx-green-tint border-sx-green-border text-sx-green-text",
      iconType: "shield-check",
      salesRequiredForNext: Math.max(0, 10 - count),
      nextTierLabel: count < 10 ? "Top Seller (10+ Sales)" : null,
      whatWasChecked: [
        "Kenyan National ID / Passport checked by eFootballMarket",
        "Registered M-Pesa payout phone number matched",
        count > 0
          ? `${count} completed escrow ${count === 1 ? "transfer" : "transfers"}`
          : "All orders still go through 24-hour buyer login check",
      ],
      description:
        "Seller submitted identity documents and matched their M-Pesa payout line with our team.",
      perks: [
        "ID-Verified Seller badge on listings",
        "Higher buyer confidence on high-OVR squads",
      ],
    };
  }

  if (count >= 1) {
    const remaining = Math.max(0, 10 - count);
    return {
      level: "proven_seller",
      label: `Proven Seller · ${count} ${count === 1 ? "Sale" : "Sales"}`,
      shortLabel: `${count} ${count === 1 ? "Sale" : "Sales"}`,
      badgeClass: "bg-sx-info-tint border-sx-info-border text-sx-info-text",
      iconType: "shield-check",
      salesRequiredForNext: remaining,
      nextTierLabel: "ID-Verified Seller (submit ID in Seller Hub)",
      whatWasChecked: [
        "Registered email and Kenyan M-Pesa phone number",
        `${count} previous ${count === 1 ? "buyer" : "buyers"} logged in and confirmed squad delivery`,
        "National ID not yet submitted (optional in Seller Hub)",
      ],
      description: `Seller has completed ${count} escrow ${
        count === 1 ? "transfer" : "transfers"
      } where the buyer confirmed login.`,
      perks: [
        "Completed-sales count displayed on cards",
        "Eligible to apply for ID-Verified badge",
      ],
    };
  }

  return {
    level: "new_seller",
    label: "New Seller",
    shortLabel: "New Seller",
    badgeClass: "bg-sx-elevated border-sx-border-strong/70 text-sx-muted",
    iconType: "shield",
    salesRequiredForNext: 1,
    nextTierLabel: "Proven Seller (after 1st completed sale)",
    whatWasChecked: [
      "Account email and Kenyan phone number registered",
      "No completed sales yet — ID not yet verified",
      "Protected by escrow: seller is NOT paid until you log in and confirm the squad within 24 hours",
    ],
    description:
      "First-time or new seller with 0 completed sales so far. Your payment is still held in M-Pesa Till 1572931 until you log in and confirm the squad.",
    perks: [
      "Full M-Pesa Till 1572931 escrow hold applies",
      "Automatic Proven Seller badge after first confirmed sale",
    ],
  };
}
