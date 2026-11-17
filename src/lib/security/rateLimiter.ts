import { createHmac, randomUUID } from "crypto";
import { createAdminClient, hasServiceRoleKey } from "@/lib/supabase/admin";

/**
 * Shared, database-backed rate limits and idempotency claims.
 *
 * Vercel functions are isolated and may run concurrently, so process-local
 * Maps cannot enforce a global limit or protect financial operations. These
 * helpers require the service-role client and the matching Supabase migration;
 * they deliberately fail closed if that shared store is unavailable.
 */

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

export type IdempotencyClaim<T> =
  | { status: "acquired"; ownerToken: string }
  | { status: "cached"; response: T }
  | { status: "in_progress" };

export class SharedSecurityStateUnavailableError extends Error {
  constructor() {
    super("Shared security state is unavailable.");
    this.name = "SharedSecurityStateUnavailableError";
  }
}

function requireSharedStore() {
  if (!hasServiceRoleKey()) {
    throw new SharedSecurityStateUnavailableError();
  }

  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret) {
    throw new SharedSecurityStateUnavailableError();
  }

  return {
    client: createAdminClient(),
    secret,
  };
}

function hashKey(secret: string, namespace: string, key: string): string {
  return createHmac("sha256", secret)
    .update(`${namespace}\0${key}`)
    .digest("hex");
}

/** Return the same pseudonymous fingerprint used by shared idempotency claims. */
export function hashSharedIdempotencyKey(key: string): string {
  validateKey(key);
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!hasServiceRoleKey() || !secret) {
    throw new SharedSecurityStateUnavailableError();
  }
  return hashKey(secret, "idempotency", key);
}

function validateKey(key: string): void {
  if (typeof key !== "string" || key.length === 0 || key.length > 2048) {
    throw new TypeError("A shared-state key must contain between 1 and 2048 characters.");
  }
}

function validateDuration(value: number, name: string, max = 86_400_000): void {
  if (!Number.isInteger(value) || value < 1 || value > max) {
    throw new RangeError(`${name} must be a positive integer no greater than ${max} milliseconds.`);
  }
}

function rpcFailure(): never {
  // Do not include the identifier, hashed key, or service credential in logs.
  console.error("Shared API security-state RPC failed.");
  throw new SharedSecurityStateUnavailableError();
}

/**
 * Atomically consume one hit from a fixed-window limit shared by all instances.
 * `identifier` should include the intended dimensions (for example user + IP).
 */
export async function checkRateLimit(
  identifier: string,
  limit = 60,
  windowMs = 60_000
): Promise<RateLimitResult> {
  validateKey(identifier);
  if (!Number.isInteger(limit) || limit < 1 || limit > 100_000) {
    throw new RangeError("limit must be an integer between 1 and 100000.");
  }
  validateDuration(windowMs, "windowMs");

  const { client, secret } = requireSharedStore();
  const keyHash = hashKey(secret, "rate-limit", identifier);

  try {
    const { data, error } = await client.rpc("consume_shared_rate_limit", {
      p_key_hash: keyHash,
      p_limit: limit,
      p_window_ms: windowMs,
    });
    if (error) rpcFailure();

    const row = Array.isArray(data) ? data[0] : data;
    const resetAt = Date.parse(String(row?.reset_at || ""));
    if (
      !row ||
      typeof row.allowed !== "boolean" ||
      !Number.isFinite(resetAt)
    ) {
      rpcFailure();
    }

    return {
      success: row.allowed,
      limit,
      remaining: Math.max(0, Number(row.remaining) || 0),
      reset: Math.ceil(resetAt / 1000),
    };
  } catch (error) {
    if (error instanceof SharedSecurityStateUnavailableError) throw error;
    rpcFailure();
  }
}

/**
 * Atomically reserve an idempotency key before a side effect begins. A cached
 * result is returned to later callers; concurrent callers get `in_progress`.
 */
export async function claimIdempotencyKey<T = unknown>(
  key: string,
  maxAgeMs = 60_000,
  leaseMs = Math.max(maxAgeMs, 120_000)
): Promise<IdempotencyClaim<T>> {
  validateKey(key);
  validateDuration(maxAgeMs, "maxAgeMs");
  validateDuration(leaseMs, "leaseMs");

  const { client, secret } = requireSharedStore();
  const keyHash = hashKey(secret, "idempotency", key);
  const ownerToken = randomUUID();

  try {
    const { data, error } = await client.rpc("claim_shared_idempotency_key", {
      p_key_hash: keyHash,
      p_owner_token: ownerToken,
      p_cache_ttl_ms: maxAgeMs,
      p_lease_ttl_ms: leaseMs,
    });
    if (error) rpcFailure();

    const result = Array.isArray(data) ? data[0] : data;
    if (result?.status === "acquired") {
      return { status: "acquired", ownerToken };
    }
    if (result?.status === "cached") {
      return { status: "cached", response: result.response as T };
    }
    if (result?.status === "in_progress") {
      return { status: "in_progress" };
    }
    rpcFailure();
  } catch (error) {
    if (error instanceof SharedSecurityStateUnavailableError) throw error;
    rpcFailure();
  }
}

/** Store a completed response only if this request still owns the claim. */
export async function completeIdempotencyKey<T>(
  key: string,
  ownerToken: string,
  response: T,
  maxAgeMs = 60_000
): Promise<void> {
  validateKey(key);
  validateDuration(maxAgeMs, "maxAgeMs");
  if (!ownerToken) throw new TypeError("An idempotency owner token is required.");

  const { client, secret } = requireSharedStore();
  const keyHash = hashKey(secret, "idempotency", key);

  try {
    const { data, error } = await client.rpc("complete_shared_idempotency_key", {
      p_key_hash: keyHash,
      p_owner_token: ownerToken,
      p_response: response,
      p_cache_ttl_ms: maxAgeMs,
    });
    if (error || data !== true) rpcFailure();
  } catch (error) {
    if (error instanceof SharedSecurityStateUnavailableError) throw error;
    rpcFailure();
  }
}

/** Release a claim when the request is known to have made no side effect. */
export async function releaseIdempotencyKey(
  key: string,
  ownerToken: string
): Promise<void> {
  validateKey(key);
  if (!ownerToken) throw new TypeError("An idempotency owner token is required.");

  const { client, secret } = requireSharedStore();
  const keyHash = hashKey(secret, "idempotency", key);

  try {
    const { error } = await client.rpc("release_shared_idempotency_key", {
      p_key_hash: keyHash,
      p_owner_token: ownerToken,
    });
    if (error) rpcFailure();
  } catch (error) {
    if (error instanceof SharedSecurityStateUnavailableError) throw error;
    rpcFailure();
  }
}
