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
        "The current game account and its listed player claims are not pre-audited",
      ],
      description:
        "Seller identity was checked and 10+ M-Pesa escrow transfers were confirmed by buyers. This badge does not certify any current game account or listing content.",
      perks: [
        "ID-Verified Top Seller badge",
        "Priority placement in Browse results",
        "Seller identity and sale history shown to buyers",
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
        "The current game account and its listed player claims are not pre-audited",
      ],
      description:
        "Seller identity documents and a matching M-Pesa payout line were checked by our team. The listed game account and player claims are not pre-audited.",
      perks: [
        "ID-Verified Seller badge on listings",
        "Seller identity check displayed to buyers",
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
      nextTierLabel: "ID-Verified Seller (when identity review is available)",
      whatWasChecked: [
        "Registered email and Kenyan M-Pesa phone number",
        `${count} previous ${count === 1 ? "buyer" : "buyers"} logged in and confirmed squad delivery`,
        "No ID verification is on file",
        "The current game account and its listed player claims are not pre-audited",
      ],
      description: `Seller completed ${count} escrow ${
        count === 1 ? "transfer" : "transfers"
      } that buyers confirmed after login. This history does not verify this specific listing or game account.`,
      perks: [
        "Completed-sales count displayed on cards",
        "Seller history displayed to buyers",
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
      "No completed sales yet — no seller ID check on file",
      "The listed game account and its player claims are not pre-audited",
      "Eligible checkout orders remain held during buyer inspection",
    ],
    description:
      "New seller with 0 completed sales. Registration is checked, but the game account and listing claims are not pre-audited. For eligible marketplace checkout orders, payment is held during buyer inspection.",
    perks: [
      "Buyer protection applies to eligible marketplace checkout orders",
      "Automatic Proven Seller badge after first confirmed sale",
    ],
  };
}
