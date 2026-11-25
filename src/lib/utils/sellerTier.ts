export type SellerTierLevel =
  | "new_seller"
  | "proven_seller"
  | "id_verified"
  | "top_seller"
  | "recall_flagged";

export interface SellerTierInfo {
  level: SellerTierLevel;
  label: string;
  shortLabel: string;
  badgeClass: string;
  iconType: "shield" | "shield-check" | "crown" | "alert";
  salesRequiredForNext: number;
  nextTierLabel: string | null;
  whatWasChecked: string[];
  description: string;
  perks: string[];
}

export function getSellerTier(
  salesCount: number = 0,
  rating: number = 0,
  isVerifiedSeller: boolean = false,
  confirmedRecallCount: number = 0,
  tierStatus?: string | null
): SellerTierInfo {
  const count = Math.max(0, Number(salesCount) || 0);
  const rate = Number(rating) || 0;
  const recalls = Math.max(0, Number(confirmedRecallCount) || 0);

  // Checked first and overrides every other badge. An upheld account-recovery
  // claim means this seller took back an account they sold; buyers need to see
  // that before anything else about them.
  if (recalls > 0 || tierStatus === "restricted") {
    return {
      level: "recall_flagged",
      label: recalls === 1 ? "Account Recovery Upheld" : recalls > 1 ? `${recalls} Recoveries Upheld` : "Seller Restricted",
      shortLabel: "Flagged",
      badgeClass: "bg-sx-red-tint border-sx-red-border text-sx-red-text",
      iconType: "shield",
      salesRequiredForNext: 0,
      nextTierLabel: null,
      whatWasChecked: [
        `${recalls} buyer-reported account recovery ${recalls === 1 ? "claim was" : "claims were"} upheld after review`,
        "Held escrow funds were returned to the affected buyer",
        "This seller's live listings were archived at the time of resolution",
        "The current game account and its listed player claims are not pre-audited",
      ],
      description:
        "A buyer reported that this seller recovered an account after the sale, and an administrator upheld that report. Do not buy from this seller.",
      perks: [],
    };
  }

  // The database tier is authoritative when available: its thresholds are
  // based on confirmed sales and clean recall-window history, not a client-side
  // estimate. Older profiles without seller_tier keep the legacy fallback.
  if (tierStatus === "trusted") {
    return {
      level: "top_seller",
      label: `Trusted Seller · ${count} Sales`,
      shortLabel: "Trusted",
      badgeClass: "bg-sx-amber-tint border-sx-amber-border text-sx-amber-text",
      iconType: "crown",
      salesRequiredForNext: 0,
      nextTierLabel: null,
      whatWasChecked: ["20+ buyer-confirmed sales", "10 clean post-sale recall windows", "No upheld account-recovery claims", "The current game account and listing details are not pre-audited"],
      description: "Trusted tier: 20 or more completed sales and 10 clean recall windows, with no upheld account-recovery claims.",
      perks: ["Trusted Seller badge", "Completed sale history shown to buyers"],
    };
  }
  if (tierStatus === "established") {
    return {
      level: "proven_seller",
      label: `Established Seller · ${count} Sales`,
      shortLabel: "Established",
      badgeClass: "bg-sx-info-tint border-sx-info-border text-sx-info-text",
      iconType: "shield-check",
      salesRequiredForNext: Math.max(0, 20 - count),
      nextTierLabel: "Trusted (20 sales + 10 clean windows)",
      whatWasChecked: ["At least 5 buyer-confirmed sales", "No upheld account-recovery claims", "The current game account and listing details are not pre-audited"],
      description: "Established tier: at least 5 completed sales and no upheld account-recovery claims. The listed account is still checked at handover, not pre-audited.",
      perks: ["Established Seller badge", "Completed sale history shown to buyers"],
    };
  }
  if (tierStatus === "new") {
    return {
      level: "new_seller",
      label: "New Seller",
      shortLabel: "New Seller",
      badgeClass: "bg-sx-elevated border-sx-border-strong/70 text-sx-muted",
      iconType: "shield",
      salesRequiredForNext: Math.max(0, 5 - count),
      nextTierLabel: "Established (5+ confirmed sales)",
      whatWasChecked: ["No upheld account-recovery claims", `${count} completed sales on record`, "The listed account and player claims are not pre-audited"],
      description: "New seller tier. Eligible checkout purchases are protected by escrow; the current game account is checked during buyer handover, not pre-audited.",
      perks: ["Eligible checkout purchases use escrow", "Tier updates as clean sales history accumulates"],
    };
  }

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
