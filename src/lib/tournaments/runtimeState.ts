import { createAdminClient, hasServiceRoleKey } from "@/lib/supabase/admin";
import { Tournament, TournamentPayment } from "@/types/database";

type RuntimeRecordType = "tournament" | "payment" | "tombstone";

interface RuntimeStateRow<T> {
  record_type: RuntimeRecordType;
  record_id: string;
  tournament_id: string | null;
  user_id: string | null;
  checkout_request_id: string | null;
  merchant_request_id: string | null;
  phone_number: string | null;
  payload: T;
  version: number;
  created_at: string;
  updated_at: string;
}

function requireAdminClient() {
  if (!hasServiceRoleKey()) {
    throw new Error("Shared tournament state requires the Supabase service-role key.");
  }
  return createAdminClient();
}

function tournamentRow(tournament: Tournament) {
  const now = new Date().toISOString();
  return {
    record_type: "tournament" as const,
    record_id: tournament.id,
    tournament_id: tournament.id,
    user_id: null,
    checkout_request_id: null,
    merchant_request_id: null,
    phone_number: null,
    payload: tournament,
    version: 1,
    created_at: tournament.created_at || now,
    updated_at: tournament.updated_at || now,
  };
}

function paymentRow(payment: TournamentPayment) {
  const now = new Date().toISOString();
  return {
    record_type: "payment" as const,
    record_id: payment.id,
    tournament_id: payment.tournament_id,
    user_id: payment.user_id || null,
    checkout_request_id: payment.checkout_request_id || null,
    merchant_request_id: payment.merchant_request_id || null,
    phone_number: payment.phone_number || null,
    payload: payment,
    version: 1,
    created_at: payment.created_at || now,
    updated_at: payment.updated_at || now,
  };
}

function sanitizeLookupValue(value: string): string {
  return value.replace(/[^a-zA-Z0-9_+.-]/g, "").slice(0, 100);
}

export async function getSharedTournamentState(id: string): Promise<Tournament | null> {
  if (!hasServiceRoleKey()) return null;
  const { data, error } = await createAdminClient()
    .from("tournament_runtime_state")
    .select("payload")
    .eq("record_type", "tournament")
    .eq("record_id", id)
    .maybeSingle();
  if (error) throw error;
  return (data?.payload as Tournament | undefined) || null;
}

export async function listSharedTournamentStates(): Promise<Tournament[]> {
  if (!hasServiceRoleKey()) return [];
  const { data, error } = await createAdminClient()
    .from("tournament_runtime_state")
    .select("payload")
    .eq("record_type", "tournament")
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (data || []).map((row: { payload: Tournament }) => row.payload);
}

/** Insert a new fallback snapshot without clobbering a newer shared copy. */
export async function insertSharedTournamentState(tournament: Tournament): Promise<void> {
  const { error } = await requireAdminClient()
    .from("tournament_runtime_state")
    .insert(tournamentRow(tournament));
  if (error && error.code !== "23505") throw error;
}

/**
 * Mutate shared tournament JSON with optimistic concurrency. A caller-supplied
 * updater is rerun against the latest row after a concurrent version change.
 */
export async function updateSharedTournamentState(
  id: string,
  seed: Tournament | null,
  updater: (current: Tournament) => Tournament
): Promise<Tournament> {
  const client = requireAdminClient();

  for (let attempt = 0; attempt < 8; attempt += 1) {
    const { data, error } = await client
      .from("tournament_runtime_state")
      .select("payload, version")
      .eq("record_type", "tournament")
      .eq("record_id", id)
      .maybeSingle();
    if (error) throw error;

    if (!data) {
      if (!seed) throw new Error("Shared tournament fallback was not found.");
      const { error: insertError } = await client
        .from("tournament_runtime_state")
        .insert(tournamentRow(seed));
      if (insertError && insertError.code !== "23505") throw insertError;
      continue;
    }

    const current = data.payload as Tournament;
    const next = updater(current);
    const { data: saved, error: updateError } = await client
      .from("tournament_runtime_state")
      .update({
        tournament_id: next.id,
        payload: next,
        version: Number(data.version) + 1,
        updated_at: new Date().toISOString(),
      })
      .eq("record_type", "tournament")
      .eq("record_id", id)
      .eq("version", data.version)
      .select("payload")
      .maybeSingle();
    if (updateError) throw updateError;
    if (saved?.payload) return saved.payload as Tournament;
  }

  throw new Error("Shared tournament state changed too frequently; retry the request.");
}

export async function listSharedTournamentPayments(tournamentId: string): Promise<TournamentPayment[]> {
  const { data, error } = await requireAdminClient()
    .from("tournament_runtime_state")
    .select("payload")
    .eq("record_type", "payment")
    .eq("tournament_id", tournamentId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data || []).map((row: { payload: TournamentPayment }) => row.payload);
}

export async function getSharedTournamentPayment(
  transactionId: string
): Promise<TournamentPayment | null> {
  if (!hasServiceRoleKey()) return null;
  const safeId = sanitizeLookupValue(transactionId);
  if (!safeId) return null;

  const { data, error } = await createAdminClient()
    .from("tournament_runtime_state")
    .select("payload")
    .eq("record_type", "payment")
    .or(
      `checkout_request_id.eq.${safeId},merchant_request_id.eq.${safeId},record_id.eq.${safeId}`
    )
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return (data?.payload as TournamentPayment | undefined) || null;
}

export async function getLatestSharedTournamentPayment(
  tournamentId: string,
  userId?: string,
  phoneNumber?: string
): Promise<TournamentPayment | null> {
  if (!hasServiceRoleKey()) return null;

  const safeUserId = userId ? sanitizeLookupValue(userId) : "";
  const safePhone = phoneNumber ? sanitizeLookupValue(phoneNumber) : "";
  let query = createAdminClient()
    .from("tournament_runtime_state")
    .select("payload")
    .eq("record_type", "payment")
    .eq("tournament_id", tournamentId)
    .order("created_at", { ascending: false });

  if (safeUserId && safePhone) {
    query = query.or(`user_id.eq.${safeUserId},phone_number.eq.${safePhone}`);
  } else if (safeUserId) {
    query = query.eq("user_id", safeUserId);
  } else if (safePhone) {
    query = query.eq("phone_number", safePhone);
  }

  const { data, error } = await query.limit(1).maybeSingle();
  if (error) throw error;
  return (data?.payload as TournamentPayment | undefined) || null;
}

export async function insertSharedTournamentPayment(payment: TournamentPayment): Promise<void> {
  const { error } = await requireAdminClient()
    .from("tournament_runtime_state")
    .insert(paymentRow(payment));
  if (error && error.code !== "23505") throw error;
}

export async function updateSharedTournamentPayment(
  payment: TournamentPayment,
  updater: (current: TournamentPayment) => TournamentPayment
): Promise<TournamentPayment> {
  const client = requireAdminClient();

  for (let attempt = 0; attempt < 8; attempt += 1) {
    const { data, error } = await client
      .from("tournament_runtime_state")
      .select("payload, version")
      .eq("record_type", "payment")
      .eq("record_id", payment.id)
      .maybeSingle();
    if (error) throw error;

    if (!data) {
      const { error: insertError } = await client
        .from("tournament_runtime_state")
        .insert(paymentRow(payment));
      if (insertError && insertError.code !== "23505") throw insertError;
      continue;
    }

    const current = data.payload as TournamentPayment;
    const next = updater(current);
    const { data: saved, error: updateError } = await client
      .from("tournament_runtime_state")
      .update({
        tournament_id: next.tournament_id,
        user_id: next.user_id || null,
        checkout_request_id: next.checkout_request_id || null,
        merchant_request_id: next.merchant_request_id || null,
        phone_number: next.phone_number || null,
        payload: next,
        version: Number(data.version) + 1,
        updated_at: new Date().toISOString(),
      })
      .eq("record_type", "payment")
      .eq("record_id", payment.id)
      .eq("version", data.version)
      .select("payload")
      .maybeSingle();
    if (updateError) throw updateError;
    if (saved?.payload) return saved.payload as TournamentPayment;
  }

  throw new Error("Shared tournament payment state changed too frequently; retry the request.");
}

export async function deleteTournamentIfNoPaymentActivity(tournamentId: string): Promise<boolean> {
  if (!tournamentId) throw new TypeError("A tournament ID is required.");
  const { data, error } = await requireAdminClient().rpc("delete_tournament_if_no_payment_activity", {
    p_tournament_id: tournamentId,
  });
  if (error) throw error;
  if (typeof data !== "boolean") {
    throw new Error("Tournament deletion returned an unexpected result.");
  }
  return data;
}
