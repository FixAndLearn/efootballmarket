import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combines Tailwind classes cleanly and resolves conflicts.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Formats monetary amounts in KES (Kenyan Shillings) or custom currency.
 */
export function formatCurrency(amount: number, currency: string = "KES"): string {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Formats large gaming stats (e.g. 1,200,000 GP -> 1.2M GP).
 */
export function formatCompactNumber(number: number): string {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    compactDisplay: "short",
  }).format(number);
}

/**
 * Maps raw playstyle keys to human readable titles.
 */
export function getPlaystyleLabel(playstyle: string): string {
  const map: Record<string, string> = {
    possession: "Possession Game",
    quick_counter: "Quick Counter",
    long_ball_counter: "Long Ball Counter",
    out_wide: "Out Wide",
    long_ball: "Long Ball",
  };
  return map[playstyle] || playstyle;
}

/**
 * Maps platform codes to display badges.
 */
export function getPlatformLabel(platform: string): string {
  const map: Record<string, string> = {
    android: "Android Mobile",
    ios: "iOS Mobile",
    pc_steam: "PC / Steam",
    playstation_4: "PlayStation 4",
    playstation_5: "PlayStation 5",
    xbox_one: "Xbox One",
    xbox_series_x: "Xbox Series X/S",
  };
  return map[platform] || platform;
}

export function getShortPlatformLabel(platform: string): string {
  const map: Record<string, string> = {
    android: "Android",
    ios: "iOS",
    pc_steam: "PC / Steam",
    playstation_4: "PS4",
    playstation_5: "PS5",
    xbox_one: "Xbox One",
    xbox_series_x: "Xbox X/S",
  };
  return map[platform] || platform;
}

export function getShortPlaystyleLabel(playstyle?: string | null): string | null {
  if (!playstyle) return null;
  const map: Record<string, string> = {
    quick_counter: "Quick Counter",
    long_ball_counter: "LBC Meta",
    possession: "Possession",
    out_wide: "Out Wide",
    long_ball: "Long Ball",
  };
  return map[playstyle] || getPlaystyleLabel(playstyle);
}

/**
 * Enriches bare 3-4 digit numeric titles (e.g. "3252", "3163") into descriptive
 * marketplace headlines while keeping real custom seller headlines untouched.
 */
export function formatSmartListingTitle(listing: {
  title?: string | null;
  overall_team_strength?: number | null;
  dream_team_name?: string | null;
  platform?: string | null;
  primary_playstyle?: string | null;
  epic_players_count?: number | null;
  big_time_players_count?: number | null;
}): string {
  const raw = (listing.title || "").trim();
  const isBareNumericOrShort =
    !raw ||
    /^\d{3,4}(\s*\+?\s*(ovr|strength))?$/i.test(raw) ||
    raw.length <= 5;

  if (!isBareNumericOrShort) {
    return raw;
  }

  const ovr = listing.overall_team_strength || raw;
  const epics =
    Number(listing.epic_players_count || 0) +
    Number(listing.big_time_players_count || 0);
  const teamName = listing.dream_team_name?.trim();
  const shortPlat = getShortPlatformLabel(listing.platform || "android");
  const styleLabel = getShortPlaystyleLabel(listing.primary_playstyle);

  if (teamName && !/^\d+$/.test(teamName)) {
    return `${teamName} · ${ovr} OVR ${shortPlat} Squad`;
  }
  if (epics > 0) {
    return `${ovr} OVR · ${epics}-Epic ${shortPlat} Squad`;
  }
  if (styleLabel) {
    return `${ovr} OVR ${styleLabel} · ${shortPlat} Squad`;
  }
  return `${ovr} OVR Verified ${shortPlat} Dream Team`;
}

/**
 * Maps Konami ID status to user-friendly badge data.
 */
export function getKonamiIdStatusInfo(status: string): { label: string; safe: boolean; description: string } {
  switch (status) {
    case "linked_changeable":
      return {
        label: "Konami ID Changeable",
        safe: true,
        description: "Seller can transfer the Konami ID and associated email directly to buyer.",
      };
    case "unlinked":
      return {
        label: "Konami ID Unlinked",
        safe: true,
        description: "Account is not yet bound to Konami ID. Buyer can bind their own email immediately.",
      };
    case "linked_immutable":
      return {
        label: "Konami ID Locked",
        safe: false,
        description: "Account email cannot be modified. Extreme caution advised.",
      };
    default:
      return {
        label: status,
        safe: false,
        description: "Unknown linking status.",
      };
  }
}

/**
 * Calibrated Kenyan eFootball squad price benchmark (KES) based on OVR, Epics, Coins & Division.
 */
export function getListingPriceContext(listing: {
  price?: number | null;
  overall_team_strength?: number | null;
  epic_players_count?: number | null;
  big_time_players_count?: number | null;
  coin_balance?: number | null;
  highest_division?: number | null;
  current_division?: number | null;
  platform?: string | null;
}): {
  tier: "great_deal" | "fair_price" | "premium";
  label: string;
  detail: string;
} {
  const price = Number(listing.price || 0);
  const ovr = Number(listing.overall_team_strength || 3100);
  const epics =
    Number(listing.epic_players_count || 0) +
    Number(listing.big_time_players_count || 0);
  const coins = Number(listing.coin_balance || 0);
  const peakDiv = Math.min(
    Number(listing.highest_division || 10),
    Number(listing.current_division || 10)
  );

  let fairMid = 650;
  if (ovr >= 3240) fairMid = 2600 + (ovr - 3240) * 35;
  else if (ovr >= 3200) fairMid = 1400 + (ovr - 3200) * 28;
  else if (ovr >= 3150) fairMid = 850 + (ovr - 3150) * 11;
  else if (ovr >= 3050) fairMid = 450 + (ovr - 3050) * 4;

  fairMid += Math.min(1800, epics * 115);
  fairMid += Math.min(1200, Math.round(coins * 0.8));
  if (peakDiv <= 2) fairMid += 250;
  if (listing.platform && listing.platform !== "android" && listing.platform !== "ios") {
    fairMid += 350;
  }

  const lowEst = Math.max(150, Math.round((fairMid * 0.75) / 50) * 50);
  const highEst = Math.max(lowEst + 250, Math.round((fairMid * 1.3) / 50) * 50);

  if (price > 0 && price <= lowEst) {
    return {
      tier: "great_deal",
      label: "Great Value",
      detail: `Below typical KES ${lowEst.toLocaleString()}–${highEst.toLocaleString()} ask for ${ovr} OVR`,
    };
  }
  if (price <= highEst) {
    return {
      tier: "fair_price",
      label: "Fair Market Ask",
      detail: `Within typical KES ${lowEst.toLocaleString()}–${highEst.toLocaleString()} range for ${ovr} OVR`,
    };
  }
  return {
    tier: "premium",
    label: "Negotiable Ask",
    detail: `Typical ${ovr} OVR range: KES ${lowEst.toLocaleString()}–${highEst.toLocaleString()} · Make Offer open`,
  };
}

// Re-export phone normalization & WhatsApp helpers
export {
  normalizePhoneNumber,
  formatInternationalPhone,
  formatDisplayPhone,
  formatWhatsAppPhone,
  buildWhatsAppLink,
  type NormalizedPhone,
} from "./utils/phone";
