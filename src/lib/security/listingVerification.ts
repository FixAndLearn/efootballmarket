import crypto from "crypto";
import sharp from "sharp";

/**
 * Listing verification: cheap, deterministic checks that catch the lies sellers
 * actually tell, without needing a machine-learning pipeline.
 *
 * Two signals, both observable from data we already collect:
 *
 *  1. IMAGE REUSE. If the exact same screenshot appears on two listings, at
 *     least one of them is describing an account the seller does not have.
 *     File hash catches an unmodified re-upload; perceptual hash catches the
 *     same image re-encoded, cropped slightly or resized.
 *
 *  2. STRENGTH CONSISTENCY. Every eFootball squad screen prints the team
 *     strength. A listing claiming 3240 whose screenshot says 3010 is the most
 *     common misrepresentation, and it is the one that most annoys buyers.
 *
 * OCR is deliberately not a hard dependency. If no OCR engine is available we
 * return "manual" rather than guessing — a wrong automatic rejection is worse
 * than a queued review.
 */

export type VerificationOutcome =
  | "verified"
  | "mismatch"
  | "rejected"
  | "manual"
  | "skipped";

export interface VerificationResult {
  outcome: VerificationOutcome;
  /** Strength digits read from the screenshot, when OCR worked. */
  detectedStrength: number | null;
  /** Hash shared with another listing, when image reuse was detected. */
  duplicateImageHash: string | null;
  notes: string;
}

/** How far the screenshot may differ from the listing before we flag it. */
export const STRENGTH_TOLERANCE = 3;

/**
 * 64-bit average hash. Resize to 8x8 greyscale and compare each pixel to the
 * mean. Robust to resizing and re-encoding; not robust to heavy cropping, which
 * is fine — a seller cropping the strength out is itself suspicious.
 */
export async function perceptualHash(buffer: Buffer): Promise<string> {
  const { data } = await sharp(buffer)
    .resize(8, 8, { fit: "fill" })
    .greyscale()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const pixels = Array.from(data);
  const mean = pixels.reduce((a, b) => a + b, 0) / pixels.length;
  return pixels.map((v) => (v >= mean ? "1" : "0")).join("");
}

export function exactHash(buffer: Buffer): string {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

/**
 * Hamming distance between two 64-bit hashes. Below ~6 bits different is almost
 * always the same picture.
 */
export function hashDistance(a: string, b: string): number {
  if (a.length !== b.length) return Number.MAX_SAFE_INTEGER;
  let d = 0;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) d++;
  return d;
}

export const NEAR_DUPLICATE_DISTANCE = 6;

/**
 * Reads the team strength out of screenshot text.
 *
 * eFootball squad screens render strength as a 4-digit number in the 2xxx-3xxx
 * range. We take the most frequent 4-digit token in that band rather than the
 * first match, because the screenshot also contains player ratings (also
 * 4-digit-ish) and coin balances.
 */
export function extractStrengthFromText(text: string): number | null {
  const candidates = text.match(/\b([23]\d{3})\b/g);
  if (!candidates) return null;

  const counts = new Map<number, number>();
  for (const raw of candidates) {
    const n = Number(raw);
    if (n >= 2000 && n <= 3999) counts.set(n, (counts.get(n) || 0) + 1);
  }
  if (counts.size === 0) return null;

  // Highest count wins; ties resolve to the larger number, since strength is
  // usually the largest value printed on the screen.
  let best = -1;
  let bestCount = -1;
  counts.forEach((count, value) => {
    if (count > bestCount || (count === bestCount && value > best)) {
      best = value;
      bestCount = count;
    }
  });
  return best;
}

/**
 * Optional OCR. `tesseract.js` is not in package.json; if it is absent we fall
 * back to manual review instead of failing the import and breaking the build.
 */
async function tryOcr(buffer: Buffer): Promise<string | null> {
  try {
    const dynamicRequire = eval("require") as NodeRequire;
    const tesseract = dynamicRequire("tesseract.js");
    const {
      data: { text },
    } = await tesseract.recognize(buffer, "eng");
    return typeof text === "string" ? text : null;
  } catch {
    return null;
  }
}

/**
 * Verifies one uploaded screenshot against the strength the listing claims.
 *
 * @param buffer            raw image bytes
 * @param claimedStrength   listings.overall_team_strength
 * @param knownImageHashes  hashes already used by other listings
 */
export async function verifyListingScreenshot(
  buffer: Buffer,
  claimedStrength: number | null,
  knownImageHashes: { exact: string[]; perceptual: string[] } = { exact: [], perceptual: [] }
): Promise<VerificationResult> {
  let exact: string;
  let perceptual: string;
  try {
    exact = exactHash(buffer);
    perceptual = await perceptualHash(buffer);
  } catch (err) {
    // Unreadable image: not a fraud signal by itself, just human review.
    return {
      outcome: "manual",
      detectedStrength: null,
      duplicateImageHash: null,
      notes: "Image could not be decoded for verification; queued for manual review.",
    };
  }

  // Reuse is the strongest signal, and it does not depend on OCR at all.
  if (knownImageHashes.exact.includes(exact)) {
    return {
      outcome: "rejected",
      detectedStrength: null,
      duplicateImageHash: exact,
      notes: "This exact screenshot is already attached to another listing.",
    };
  }
  for (const known of knownImageHashes.perceptual) {
    if (hashDistance(known, perceptual) <= NEAR_DUPLICATE_DISTANCE) {
      return {
        outcome: "rejected",
        detectedStrength: null,
        duplicateImageHash: perceptual,
        notes: "This screenshot is near-identical to one used on another listing.",
      };
    }
  }

  if (claimedStrength == null) {
    return {
      outcome: "manual",
      detectedStrength: null,
      duplicateImageHash: null,
      notes: "Listing does not state a team strength, so there is nothing to compare.",
    };
  }

  const text = await tryOcr(buffer);
  if (text == null) {
    return {
      outcome: "manual",
      detectedStrength: null,
      duplicateImageHash: null,
      notes: "No OCR engine available; queued for manual strength check.",
    };
  }

  const detected = extractStrengthFromText(text);
  if (detected == null) {
    return {
      outcome: "manual",
      detectedStrength: null,
      duplicateImageHash: null,
      notes: "Could not read a team strength from the screenshot; queued for manual review.",
    };
  }

  if (Math.abs(detected - claimedStrength) > STRENGTH_TOLERANCE) {
    return {
      outcome: "mismatch",
      detectedStrength: detected,
      duplicateImageHash: null,
      notes: `Listing says ${claimedStrength} OVR but the screenshot reads ${detected} OVR.`,
    };
  }

  return {
    outcome: "verified",
    detectedStrength: detected,
    duplicateImageHash: null,
    notes: `Screenshot strength (${detected}) matches the listing.`,
  };
}

/**
 * Fingerprint of an *account*, as opposed to an image. Used to spot the
 * sell -> recall -> relist loop: the same squad reappearing as a new listing.
 *
 * Dream team name carries most of the signal. These fields change only if the
 * seller actually plays the account in between.
 */
export function accountFingerprint(listing: {
  dream_team_name?: string | null;
  overall_team_strength?: number | null;
  matches_played?: number | null;
  wins?: number | null;
  goals_scored?: number | null;
}): string {
  const parts = [
    (listing.dream_team_name || "").trim().toLowerCase(),
    String(listing.overall_team_strength ?? ""),
    String(listing.matches_played ?? ""),
    String(listing.wins ?? ""),
    String(listing.goals_scored ?? ""),
  ];
  return crypto.createHash("sha256").update(parts.join("|")).digest("hex");
}
