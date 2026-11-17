/**
 * Strict validation helpers for M-Pesa settlement data. Never treat a missing
 * receipt or amount as a successful settlement.
 */
export function normalizeMpesaReceiptNumber(value: unknown): string | null {
  if (typeof value !== "string" && typeof value !== "number") return null;

  const receipt = String(value).trim().toUpperCase();
  return /^[A-Z0-9]{8,12}$/.test(receipt) ? receipt : null;
}

export function normalizePositiveAmount(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;

  const amount = Number(value);
  return Number.isFinite(amount) && amount > 0 ? amount : null;
}

/** Compare KES amounts to the cent, without allowing a missing/zero value. */
export function amountsMatch(actual: unknown, expected: unknown): boolean {
  const actualAmount = normalizePositiveAmount(actual);
  const expectedAmount = normalizePositiveAmount(expected);
  if (actualAmount === null || expectedAmount === null) return false;

  return Math.round(actualAmount * 100) === Math.round(expectedAmount * 100);
}

/** Provider-specific evidence required before a settlement can be persisted. */
export function isValidSettlementEvidence(
  provider: unknown,
  verificationMethod: unknown
): boolean {
  return (
    (provider === "unifiedpay" && verificationMethod === "provider_status_query") ||
    (provider === "safaricom" &&
      verificationMethod === "authenticated_callback_and_status_query")
  );
}

/**
 * A completed row is trusted only when its receipt claim is provider-verified,
 * tied to this exact ledger entity and transaction ID, and has the same amount.
 */
export function isVerifiedSettlementClaim(
  claim: unknown,
  expected: {
    source: "marketplace" | "tournament";
    entityId: unknown;
    transactionIds: unknown[];
    amount: unknown;
  }
): boolean {
  if (!claim || typeof claim !== "object" || Array.isArray(claim)) return false;

  const row = claim as Record<string, unknown>;
  const transactionIds = expected.transactionIds.filter(
    (id): id is string => typeof id === "string" && id.length > 0 && id.trim() === id
  );

  return (
    row.source === expected.source &&
    String(row.entity_id) === String(expected.entityId) &&
    isValidSettlementEvidence(row.provider, row.verification_method) &&
    typeof row.transaction_id === "string" &&
    transactionIds.includes(row.transaction_id) &&
    amountsMatch(row.amount, expected.amount)
  );
}
