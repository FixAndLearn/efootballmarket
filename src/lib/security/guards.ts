import crypto from "crypto";
import { NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient, hasServiceRoleKey } from "@/lib/supabase/admin";
import { isUserAdmin } from "./adminAuth";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Extracts canonical client IP behind Cloudflare / Vercel / reverse proxies.
 */
export function getClientIp(req: NextRequest): string {
  const cfIp = req.headers.get("cf-connecting-ip");
  if (cfIp) return cfIp.trim();

  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }

  return req.headers.get("x-real-ip")?.trim() || "unknown";
}

/**
 * Constant-time string comparison to prevent timing side-channel attacks on webhook/cron secrets.
 */
export function timingSafeCompare(provided?: string | null, expected?: string | null): boolean {
  if (!provided || !expected) return false;
  const bufA = Buffer.from(provided, "utf8");
  const bufB = Buffer.from(expected, "utf8");
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * Validates strict UUID v1-v8 format before interpolating or querying sensitive admin tables.
 */
export function isValidUuid(value?: string | null): value is string {
  if (!value) return false;
  return UUID_REGEX.test(value.trim());
}

/**
 * Sanitizes external transaction/request IDs to safe characters (`A-Z`, `a-z`, `0-9`, `_`, `-`)
 * so user input can never inject PostgREST `.or()` filter operators.
 */
export function sanitizeTransactionId(raw?: string | null): string {
  if (!raw) return "";
  return String(raw).trim().replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 80);
}

/**
 * Verifies binary magic bytes of uploaded images so attackers cannot disguise
 * HTML/SVG/JS/executable payloads behind a fake `image/png` Content-Type header.
 */
export function verifyImageMagicBytes(buffer: Buffer): {
  valid: boolean;
  detectedExt?: "jpg" | "png" | "webp";
  detectedMime?: string;
} {
  if (!buffer || buffer.length < 12) {
    return { valid: false };
  }

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { valid: true, detectedExt: "jpg", detectedMime: "image/jpeg" };
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return { valid: true, detectedExt: "png", detectedMime: "image/png" };
  }

  // WebP: "RIFF" .... "WEBP"
  if (
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return { valid: true, detectedExt: "webp", detectedMime: "image/webp" };
  }

  return { valid: false };
}

/**
 * Verifies caller is an authenticated, non-suspended Admin (or presents a valid CRON_SECRET bearer token).
 */
export async function verifyAdminOrSecret(req: NextRequest): Promise<{
  authorized: boolean;
  userId?: string;
  email?: string;
}> {
  const cronSecret = process.env.CRON_SECRET || process.env.ADMIN_API_SECRET;
  const authHeader = req.headers.get("authorization");
  if (cronSecret && authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7).trim();
    if (timingSafeCompare(token, cronSecret)) {
      return { authorized: true, email: "system@cron" };
    }
  }

  const supabase = createServerSupabaseClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { authorized: false };
  }

  const client = hasServiceRoleKey() ? createAdminClient() : supabase;

  const { data: profile } = await client
    .from("profiles")
    .select("role, is_suspended")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.is_suspended) {
    return { authorized: false };
  }

  if (isUserAdmin(user.email, profile?.role)) {
    return { authorized: true, userId: user.id, email: user.email };
  }

  const { data: roleRows } = await client
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .in("role", ["admin", "super_admin"]);

  if (roleRows && roleRows.length > 0) {
    return { authorized: true, userId: user.id, email: user.email };
  }

  return { authorized: false };
}

/**
 * Masks Kenyan phone numbers (`254794400365` -> `254794***365`) for public responses.
 */
export function maskPhoneNumber(phone?: string | null): string {
  if (!phone) return "";
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 7) return "***";
  return `${digits.slice(0, 6)}***${digits.slice(-3)}`;
}
