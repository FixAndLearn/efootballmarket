import { randomUUID } from "crypto";
import { createAdminClient, hasServiceRoleKey } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { Tournament, TournamentMatch, TournamentParticipant, TournamentPayment } from "@/types/database";
import { VerifiedMpesaSettlement } from "@/lib/mpesa/types";
import { calculateNetPrizePool } from "@/lib/utils/tournamentFee";
import {
  amountsMatch,
  isValidSettlementEvidence,
  normalizeMpesaReceiptNumber,
  normalizePositiveAmount,
} from "@/lib/mpesa/settlement";
import { PUBLIC_TOURNAMENT_PARTICIPANT_SELECT } from "@/lib/security/publicSanitizer";
import {
  deleteTournamentIfNoPaymentActivity,
  getLatestSharedTournamentPayment,
  getSharedTournamentPayment,
  getSharedTournamentState,
  insertSharedTournamentPayment,
  insertSharedTournamentState,
  listSharedTournamentStates,
  updateSharedTournamentPayment,
  updateSharedTournamentState,
} from "@/lib/tournaments/runtimeState";

function getSupabase() {
  const adminSupabase = createAdminClient();
  const userSupabase = createServerSupabaseClient();
  return hasServiceRoleKey() ? adminSupabase : userSupabase;
}

function formatTournament(data: any): Tournament {
  return {
    ...data,
    prize_pool_kes: Number(data.prize_pool_kes || 0),
    first_place_kes: Number(data.first_place_kes || 0),
    second_place_kes: Number(data.second_place_kes || 0),
    entry_fee_kes: Number(data.entry_fee_kes || 0),
    matches: (data.matches || []).sort((a: TournamentMatch, b: TournamentMatch) => a.match_number - b.match_number),
    participants: data.participants || [],
  };
}

function preferNewerTournament(primary: Tournament | null, shared: Tournament | null): Tournament | null {
  if (!primary) return shared;
  if (!shared) return primary;
  const primaryTime = Date.parse(primary.updated_at || primary.created_at || "");
  const sharedTime = Date.parse(shared.updated_at || shared.created_at || "");
  return Number.isFinite(sharedTime) && sharedTime > primaryTime ? shared : primary;
}

class BracketStateConflictError extends Error {}

function buildTournamentBracket(
  tournamentId: string,
  maxPlayers: number,
  players: TournamentParticipant[]
): TournamentMatch[] {
  const createdAt = new Date().toISOString();
  if (maxPlayers === 2) {
    return [
      {
        id: randomUUID(),
        tournament_id: tournamentId,
        round: "1v1 Duel Championship",
        match_number: 1,
        player1_name: players[0].gamer_tag,
        player2_name: players[1].gamer_tag,
        player1_friend_id: players[0].friend_id,
        player2_friend_id: players[1].friend_id,
        player1_user_id: players[0].user_id,
        player2_user_id: players[1].user_id,
        is_completed: false,
        created_at: createdAt,
      },
    ];
  }

  const roundNames =
    maxPlayers === 4
      ? ["Semi-Finals", "Grand Final"]
      : maxPlayers === 8
        ? ["Quarter-Finals", "Semi-Finals", "Grand Final"]
        : ["Round of 16", "Quarter-Finals", "Semi-Finals", "Grand Final"];
  const matchIdsByRound: string[][] = [];
  for (let matchCount = maxPlayers / 2; matchCount >= 1; matchCount /= 2) {
    matchIdsByRound.push(Array.from({ length: matchCount }, () => randomUUID()));
  }

  const matches: TournamentMatch[] = [];
  let matchNumber = 1;
  for (let roundIndex = 0; roundIndex < roundNames.length; roundIndex += 1) {
    const isFirstRound = roundIndex === 0;
    const isFinalRound = roundIndex === roundNames.length - 1;
    const ids = matchIdsByRound[roundIndex];
    const nextRoundIds = matchIdsByRound[roundIndex + 1];

    for (let matchIndex = 0; matchIndex < ids.length; matchIndex += 1) {
      const playerOne = isFirstRound ? players[matchIndex * 2] : null;
      const playerTwo = isFirstRound ? players[matchIndex * 2 + 1] : null;
      const previousRoundName = roundNames[roundIndex - 1];
      matches.push({
        id: ids[matchIndex],
        tournament_id: tournamentId,
        round: roundNames[roundIndex],
        match_number: matchNumber++,
        player1_name: playerOne?.gamer_tag ||
          (isFinalRound ? "Finalist 1" : `Winner ${previousRoundName} ${matchIndex * 2 + 1}`),
        player2_name: playerTwo?.gamer_tag ||
          (isFinalRound ? "Finalist 2" : `Winner ${previousRoundName} ${matchIndex * 2 + 2}`),
        player1_friend_id: playerOne?.friend_id,
        player2_friend_id: playerTwo?.friend_id,
        player1_user_id: playerOne?.user_id,
        player2_user_id: playerTwo?.user_id,
        is_completed: false,
        next_match_id: nextRoundIds?.[Math.floor(matchIndex / 2)],
        next_match_slot: nextRoundIds ? (matchIndex % 2) + 1 : undefined,
        created_at: createdAt,
      });
    }
  }
  return matches;
}

export class TournamentService {
  /**
   * Fetch all active tournaments with their brackets and participants.
   * Returns empty array if none exist. Never returns fake/mock demo data.
   */
  static async getAllTournaments(): Promise<Tournament[]> {
    let databaseTournaments: Tournament[] = [];
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from("tournaments")
        .select(`*,
          matches:tournament_matches(*),
          participants:tournament_participants(${PUBLIC_TOURNAMENT_PARTICIPANT_SELECT})`)
        .order("created_at", { ascending: false });
      if (error) throw error;
      databaseTournaments = (data || []).map(formatTournament);
    } catch (err) {
      console.warn("Supabase tournaments query notice:", err);
    }

    let sharedTournaments: Tournament[] = [];
    try {
      sharedTournaments = (await listSharedTournamentStates()).map(formatTournament);
    } catch (err) {
      console.warn("Shared tournament fallback query notice:", err);
    }

    // Prefer the newest shared snapshot for a record when a prior fallback write
    // could not reach the normalized tables; include fallback-only records too.
    const byId = new Map<string, Tournament>();
    for (const tournament of databaseTournaments) byId.set(tournament.id, tournament);
    for (const tournament of sharedTournaments) {
      byId.set(
        tournament.id,
        preferNewerTournament(byId.get(tournament.id) || null, tournament) || tournament
      );
    }

    return Array.from(byId.values()).sort(
      (a, b) => Date.parse(b.created_at) - Date.parse(a.created_at)
    );
  }

  /**
   * Get tournament by ID from the normalized database, falling back to the
   * service-role-only shared runtime store rather than a process-local array.
   */
  static async getTournamentById(id: string): Promise<Tournament | null> {
    let databaseTournament: Tournament | null = null;
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from("tournaments")
        .select(`*,
          matches:tournament_matches(*),
          participants:tournament_participants(${PUBLIC_TOURNAMENT_PARTICIPANT_SELECT})`)
        .eq("id", id)
        .maybeSingle();

      if (error) throw error;
      if (data) databaseTournament = formatTournament(data);
    } catch (err) {
      console.warn("Supabase getTournamentById notice:", err);
    }

    try {
      const sharedTournament = await getSharedTournamentState(id);
      return preferNewerTournament(databaseTournament, sharedTournament ? formatTournament(sharedTournament) : null);
    } catch (err) {
      console.warn("Shared getTournamentById fallback notice:", err);
      return databaseTournament;
    }
  }

  /**
   * Create / Host a new tournament directly on the website
   */
  static async createTournament(params: {
    title: string;
    subtitle?: string;
    description?: string;
    platform: "all" | "android" | "ios" | "crossplay" | "console_pc";
    tournament_type?: "1v1" | "tournament";
    payout_split?: "winner_takes_all" | "80_20" | "70_30";
    entry_fee_kes: number;
    format: string;
    max_players: number;
    start_date: string;
    created_by?: string;
  }): Promise<Tournament> {
    const tournamentType = params.tournament_type || (params.max_players === 2 ? "1v1" : "tournament");
    const maxPlayers = Number(params.max_players);
    const allowedMaxPlayers = tournamentType === "1v1" ? [2] : [4, 8, 16];
    if (!allowedMaxPlayers.includes(maxPlayers)) {
      throw new Error("Tournament size is not supported.");
    }
    if (
      !Number.isSafeInteger(params.entry_fee_kes) ||
      params.entry_fee_kes < 0 ||
      !Number.isSafeInteger(params.entry_fee_kes * maxPlayers)
    ) {
      throw new Error("Entry fee must be a non-negative whole KES amount.");
    }

    const payoutSplit: "winner_takes_all" | "80_20" | "70_30" =
      tournamentType === "1v1" ? "winner_takes_all" : params.payout_split || "winner_takes_all";
    if (!["winner_takes_all", "80_20", "70_30"].includes(payoutSplit)) {
      throw new Error("Tournament payout split is not supported.");
    }
    const prizeBreakdown = calculateNetPrizePool(
      params.entry_fee_kes * maxPlayers,
      maxPlayers,
      payoutSplit
    );

    const newId = randomUUID();
    const now = new Date().toISOString();

    const tourneyPayload: Tournament = {
      id: newId,
      title: params.title.trim(),
      subtitle: params.subtitle?.trim() || `${maxPlayers}-Player Knockout Tournament | Published prizes are arranged manually by the tournament desk`,
      description: params.description?.trim() || "",
      platform: params.platform,
      tournament_type: tournamentType,
      admin_fee_kes: prizeBreakdown.adminFee,
      payout_split: payoutSplit,
      prize_pool_kes: prizeBreakdown.netPrizePool,
      first_place_kes: prizeBreakdown.firstPlace,
      second_place_kes: prizeBreakdown.secondPlace,
      entry_fee_kes: params.entry_fee_kes,
      format: params.format.trim() || "Single Knockout 1v1 (12-Minute Game + Extra Time & PKs)",
      max_players: maxPlayers,
      registered_count: 0,
      start_date: params.start_date.trim(),
      status: "registration_open",
      created_by: params.created_by,
      created_at: now,
      updated_at: now,
      matches: [],
      participants: [],
    };

    let databaseInsertSucceeded = false;
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from("tournaments")
        .insert({
          id: tourneyPayload.id,
          title: tourneyPayload.title,
          subtitle: tourneyPayload.subtitle,
          description: tourneyPayload.description,
          platform: tourneyPayload.platform,
          tournament_type: tourneyPayload.tournament_type,
          admin_fee_kes: tourneyPayload.admin_fee_kes,
          payout_split: tourneyPayload.payout_split,
          prize_pool_kes: tourneyPayload.prize_pool_kes,
          first_place_kes: tourneyPayload.first_place_kes,
          second_place_kes: tourneyPayload.second_place_kes,
          entry_fee_kes: tourneyPayload.entry_fee_kes,
          format: tourneyPayload.format,
          max_players: tourneyPayload.max_players,
          registered_count: 0,
          start_date: tourneyPayload.start_date,
          status: "registration_open",
          created_by: tourneyPayload.created_by,
        })
        .select()
        .single();

      if (error || !data) throw error || new Error("Tournament insert returned no row.");
      databaseInsertSucceeded = true;
      tourneyPayload.id = data.id;
    } catch (err) {
      console.warn("Supabase insert tournament notice:", err);
    }

    try {
      // Keep a durable shared snapshot so a later Vercel instance can recover
      // if the normalized tournament tables become unavailable.
      await insertSharedTournamentState(tourneyPayload);
    } catch (err) {
      if (!databaseInsertSucceeded) {
        console.error("Could not persist tournament in shared fallback state.");
        throw new Error("Tournament could not be persisted. Please try again later.");
      }
      console.warn("Shared tournament snapshot notice:", err);
    }

    return tourneyPayload;
  }

  /**
   * Register a free or wallet-paid participant through one locked database
   * transaction. A wallet debit is never attempted with a direct profile update.
   */
  static async registerParticipant(params: {
    tournament_id: string;
    gamer_tag: string;
    friend_id: string;
    phone_number: string;
    user_id?: string;
    payment_method?: "wallet" | "mpesa_till" | "free";
  }): Promise<{ success: boolean; participant?: TournamentParticipant; error?: string; remainingBalance?: number }> {
    const { tournament_id, gamer_tag, friend_id, phone_number, user_id, payment_method = "mpesa_till" } = params;

    if (!user_id || !user_id.trim()) {
      return {
        success: false,
        error: "Community Membership Required: Only registered members of our community can join tournaments. Please register or log in.",
      };
    }

    const cleanGamerTag = String(gamer_tag || "").trim().slice(0, 60);
    const cleanFriendId = String(friend_id || "").trim().slice(0, 40);
    const cleanPhoneNumber = String(phone_number || "").trim();
    if (!cleanGamerTag || !cleanFriendId || !cleanPhoneNumber) {
      return { success: false, error: "Gamer tag, eFootball Friend ID, and phone number are required." };
    }

    const tourney = await this.getTournamentById(tournament_id);
    if (!tourney) {
      return { success: false, error: "Tournament not found." };
    }

    const isFree = Number(tourney.entry_fee_kes) === 0;
    const registrationMethod = isFree ? "free" : payment_method;
    if (!isFree && registrationMethod !== "wallet") {
      return {
        success: false,
        error: "Payment required: For M-Pesa entry, initiate an STK Push. Wallet registrations require an available balance.",
      };
    }

    if (!hasServiceRoleKey()) {
      return {
        success: false,
        error: "Secure tournament registration is temporarily unavailable. No wallet debit or participant entry was attempted.",
      };
    }

    let registration: {
      participant?: TournamentParticipant;
      available_balance_after?: number | string;
      idempotent?: boolean;
    } | null;
    try {
      const adminSupabase = createAdminClient();
      const { data, error } = await adminSupabase.rpc("register_tournament_participant_atomic", {
        p_tournament_id: tournament_id,
        p_user_id: user_id,
        p_gamer_tag: cleanGamerTag,
        p_friend_id: cleanFriendId,
        p_phone_number: cleanPhoneNumber,
        p_payment_method: registrationMethod,
      });

      if (error) {
        if (error.code === "P0001") {
          return { success: false, error: error.message };
        }
        if (error.code === "23505") {
          return { success: false, error: "This member or eFootball Friend ID is already registered for the tournament." };
        }
        console.error("Atomic tournament registration RPC failed; no direct balance fallback was attempted.");
        return {
          success: false,
          error: "Secure tournament registration could not be confirmed. Check the tournament entry before retrying.",
        };
      }
      registration = data as typeof registration;
    } catch {
      console.error("Atomic tournament registration RPC could not be reached; no direct balance fallback was attempted.");
      return {
        success: false,
        error: "Secure tournament registration could not be confirmed. Check the tournament entry before retrying.",
      };
    }

    const participant = registration?.participant;
    if (!participant?.id) {
      console.error("Atomic tournament registration returned no verifiable participant record.");
      return {
        success: false,
        error: "Tournament registration status could not be verified. Check the tournament entry before retrying.",
      };
    }

    try {
      await updateSharedTournamentState(tournament_id, tourney, (current) => {
        const currentParticipants = current.participants || [];
        const alreadyPresent = currentParticipants.some(
          (entry) =>
            entry.id === participant.id ||
            entry.user_id === participant.user_id ||
            entry.friend_id.trim().toLowerCase() === participant.friend_id.trim().toLowerCase()
        );
        if (alreadyPresent) return current;
        const nextParticipants = [...currentParticipants, participant];
        return {
          ...current,
          participants: nextParticipants,
          registered_count: nextParticipants.length,
          updated_at: new Date().toISOString(),
        };
      });
    } catch (err) {
      // The normalized registration and wallet transaction have committed;
      // shared runtime state is only a best-effort read fallback.
      console.warn("Shared participant snapshot notice:", err);
    }

    const balanceAfter = Number(registration?.available_balance_after);
    return {
      success: true,
      participant,
      remainingBalance: Number.isFinite(balanceAfter) ? balanceAfter : undefined,
    };
  }

  /**
   * Create a pending tournament payment entry before STK Push is sent.
   */
  static async createTournamentPayment(params: {
    tournament_id: string;
    user_id?: string;
    gamer_tag: string;
    friend_id: string;
    phone_number: string;
    amount: number;
    checkout_request_id: string;
    merchant_request_id?: string;
  }): Promise<TournamentPayment> {
    let newPayment: TournamentPayment = {
      id: randomUUID(),
      tournament_id: params.tournament_id,
      user_id: params.user_id,
      gamer_tag: params.gamer_tag.trim(),
      friend_id: params.friend_id.trim(),
      phone_number: params.phone_number.trim(),
      amount: params.amount,
      checkout_request_id: params.checkout_request_id,
      merchant_request_id: params.merchant_request_id,
      status: "pending",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    let databaseInsertSucceeded = false;
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from("tournament_payments")
        .insert({
          tournament_id: newPayment.tournament_id,
          user_id: newPayment.user_id,
          gamer_tag: newPayment.gamer_tag,
          friend_id: newPayment.friend_id,
          phone_number: newPayment.phone_number,
          amount: newPayment.amount,
          checkout_request_id: newPayment.checkout_request_id,
          merchant_request_id: newPayment.merchant_request_id,
          status: "pending",
        })
        .select()
        .single();

      if (error || !data) throw error || new Error("Tournament payment insert returned no row.");
      databaseInsertSucceeded = true;
      newPayment = data as TournamentPayment;
    } catch (err) {
      console.warn("Supabase insert tournament_payments notice:", err);
    }

    try {
      await insertSharedTournamentPayment(newPayment);
    } catch (err) {
      if (!databaseInsertSucceeded) {
        console.error("Could not persist tournament payment reservation in shared fallback state.");
        throw new Error("The payment request was not sent because it could not be safely recorded. Contact support before retrying.");
      }
      console.warn("Shared tournament payment snapshot notice:", err);
    }

    return newPayment;
  }

  /**
   * Attach provider-issued request IDs after a durable payment reservation exists.
   */
  static async attachTournamentPaymentRequestIds(
    payment: TournamentPayment,
    checkoutRequestId: string,
    merchantRequestId?: string
  ): Promise<TournamentPayment> {
    const safeCheckoutId = String(checkoutRequestId || "").trim().slice(0, 80);
    if (!payment.id || !safeCheckoutId) {
      throw new TypeError("A payment reservation and provider checkout ID are required.");
    }

    const now = new Date().toISOString();
    let updatedPayment: TournamentPayment = {
      ...payment,
      checkout_request_id: safeCheckoutId,
      merchant_request_id: merchantRequestId || null,
      updated_at: now,
    };
    let databaseUpdated = false;

    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from("tournament_payments")
        .update({
          checkout_request_id: safeCheckoutId,
          merchant_request_id: merchantRequestId || null,
          updated_at: now,
        })
        .eq("id", payment.id)
        .eq("status", "pending")
        .select("*")
        .maybeSingle();
      if (error || !data) throw error || new Error("Tournament payment reservation was not updated.");
      updatedPayment = data as TournamentPayment;
      databaseUpdated = true;
    } catch (err) {
      console.warn("Supabase tournament payment ID update notice:", err);
    }

    try {
      updatedPayment = await updateSharedTournamentPayment(payment, (current) => ({
        ...current,
        checkout_request_id: safeCheckoutId,
        merchant_request_id: merchantRequestId || null,
        updated_at: now,
      }));
      return updatedPayment;
    } catch (err) {
      if (databaseUpdated) {
        console.warn("Shared tournament payment ID update notice:", err);
        return updatedPayment;
      }
      throw new Error("The payment prompt may have been sent, but its provider reference could not be saved. Contact support before retrying.");
    }
  }

  /**
   * Retrieve a tournament payment by checkoutRequestId or merchantRequestId
   */
  static async getTournamentPayment(checkoutRequestId: string): Promise<TournamentPayment | null> {
    const safeCheckoutId = String(checkoutRequestId || "")
      .replace(/[^a-zA-Z0-9_-]/g, "")
      .slice(0, 80);
    if (!safeCheckoutId) return null;

    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from("tournament_payments")
        .select("*")
        .or(`checkout_request_id.eq.${safeCheckoutId},merchant_request_id.eq.${safeCheckoutId}`)
        .order("created_at", { ascending: false })
        .maybeSingle();

      if (!error && data) {
        return data as TournamentPayment;
      }
    } catch (err) {
      console.warn("Supabase getTournamentPayment notice:", err);
    }

    try {
      return await getSharedTournamentPayment(checkoutRequestId);
    } catch (err) {
      console.warn("Shared tournament payment fallback lookup notice:", err);
      return null;
    }
  }

  /**
   * Retrieve the latest tournament payment for a user or phone number
   */
  static async getLatestPaymentForUser(
    tournamentId: string,
    userId?: string,
    phoneNumber?: string
  ): Promise<TournamentPayment | null> {
    try {
      const supabase = getSupabase();
      let query = supabase
        .from("tournament_payments")
        .select("*")
        .eq("tournament_id", tournamentId)
        .order("created_at", { ascending: false });

      const safeUserId = userId ? userId.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 64) : "";
      const safePhone = phoneNumber ? phoneNumber.replace(/[^0-9+]/g, "").slice(0, 20) : "";

      if (safeUserId && safePhone) {
        query = query.or(`user_id.eq.${safeUserId},phone_number.eq.${safePhone}`);
      } else if (safeUserId) {
        query = query.eq("user_id", safeUserId);
      } else if (safePhone) {
        query = query.eq("phone_number", safePhone);
      }

      const { data, error } = await query.limit(1).maybeSingle();
      if (!error && data) {
        return data as TournamentPayment;
      }
    } catch (err) {
      console.warn("Supabase getLatestPaymentForUser notice:", err);
    }

    try {
      return await getLatestSharedTournamentPayment(tournamentId, userId, phoneNumber);
    } catch (err) {
      console.warn("Shared latest tournament payment fallback lookup notice:", err);
      return null;
    }
  }

  /**
   * Confirms a provider-verified tournament settlement through a single
   * database transaction that claims the receipt and registers the participant.
   */
  static async confirmTournamentPayment(
    transactionId: string,
    settlement: VerifiedMpesaSettlement
  ): Promise<{
    success: boolean;
    alreadySettled?: boolean;
    participant?: TournamentParticipant;
    payment?: TournamentPayment;
    error?: string;
  }> {
    const payment = await this.getTournamentPayment(transactionId);
    if (!payment) {
      return { success: false, error: 'Payment record not found.' };
    }

    const strictId = (value?: string | null) => {
      const raw = String(value || '').trim();
      const safe = raw.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 80);
      return raw && raw === safe ? safe : '';
    };
    const safeTransaction = strictId(settlement?.transactionId);
    const safeCheckout = strictId(settlement?.checkoutRequestId);
    const safeMerchant = strictId(settlement?.merchantRequestId);
    const requestedTransaction = strictId(transactionId);
    const normalizedReceipt = normalizeMpesaReceiptNumber(settlement?.receiptNumber);
    const confirmedAmount = normalizePositiveAmount(settlement?.amount);
    const storedCheckout = String(payment.checkout_request_id || '');
    const storedMerchant = String(payment.merchant_request_id || '');
    const storedIds = [storedCheckout, storedMerchant].filter(Boolean);

    if (
      !safeTransaction ||
      safeTransaction !== requestedTransaction ||
      (!safeCheckout && !safeMerchant) ||
      !storedIds.includes(safeTransaction) ||
      (safeCheckout && storedCheckout !== safeCheckout) ||
      (safeMerchant && storedMerchant !== safeMerchant) ||
      !normalizedReceipt ||
      confirmedAmount === null ||
      !amountsMatch(confirmedAmount, payment.amount) ||
      !isValidSettlementEvidence(
        settlement?.provider,
        settlement?.verificationMethod
      ) ||
      settlement?.providerStatus !== 'completed' ||
      !Number.isFinite(Date.parse(settlement?.verifiedAt || ''))
    ) {
      return { success: false, error: 'Provider-confirmed settlement does not match the tournament payment.' };
    }

    // The shared fallback can help locate a pending record, but it is never
    // allowed to settle money. Settlement must go through the atomic database RPC.
    if (!hasServiceRoleKey()) {
      return { success: false, error: 'Secure tournament settlement is not configured.' };
    }

    let settlementResult: any;
    try {
      const supabase = createAdminClient();
      const { data, error } = await supabase.rpc('settle_mpesa_tournament_payment', {
        p_tournament_payment_id: payment.id,
        p_receipt_number: normalizedReceipt,
        p_amount: confirmedAmount,
        p_provider: settlement.provider,
        p_verification_method: settlement.verificationMethod,
        p_transaction_id: safeTransaction,
        p_verified_at: settlement.verifiedAt,
      });
      if (error || data?.success !== true) {
        return { success: false, error: 'Could not atomically apply tournament payment.' };
      }
      settlementResult = data;
    } catch {
      return { success: false, error: 'Secure tournament settlement could not be completed.' };
    }

    const updatedPayment: TournamentPayment = {
      ...payment,
      status: 'completed',
      mpesa_receipt_number: normalizedReceipt,
      result_code: 0,
      result_desc: 'Provider-confirmed payment completed successfully',
      updated_at: new Date().toISOString(),
    };
    const participant = settlementResult.participant as TournamentParticipant | undefined;

    try {
      await updateSharedTournamentPayment(updatedPayment, (current) => ({
        ...current,
        ...updatedPayment,
      }));
    } catch (err) {
      console.warn("Shared tournament payment settlement snapshot notice:", err);
    }

    if (participant) {
      try {
        const currentTournament = await this.getTournamentById(payment.tournament_id);
        if (currentTournament) {
          await updateSharedTournamentState(payment.tournament_id, currentTournament, (current) => {
            const currentParticipants = current.participants || [];
            const existingIndex = currentParticipants.findIndex(
              (entry) =>
                entry.id === participant.id ||
                entry.friend_id.trim().toLowerCase() === participant.friend_id.trim().toLowerCase()
            );
            const nextParticipants = [...currentParticipants];
            if (existingIndex === -1) nextParticipants.push(participant);
            else nextParticipants[existingIndex] = participant;
            return {
              ...current,
              participants: nextParticipants,
              registered_count: nextParticipants.length,
              updated_at: new Date().toISOString(),
            };
          });
        }
      } catch (err) {
        console.warn("Shared tournament settlement snapshot notice:", err);
      }
    }

    return {
      success: true,
      alreadySettled: settlementResult.already_settled === true,
      participant,
      payment: updatedPayment,
    };
  }

  /**
   * Mark a tournament payment as failed/cancelled without adding participant.
   */
  static async failTournamentPayment(
    checkoutRequestId: string,
    reason?: string
  ): Promise<{ success: boolean }> {
    const payment = await this.getTournamentPayment(checkoutRequestId);
    if (!payment) return { success: false };

    if (payment.status !== "pending") return { success: false };

    const now = new Date().toISOString();
    const safeReason = String(reason || "Payment cancelled or timed out").slice(0, 300);
    let databaseUpdated = false;
    try {
      const supabase = getSupabase();
      const { data: updatedPayment, error } = await supabase
        .from("tournament_payments")
        .update({
          status: "failed",
          result_desc: safeReason,
          updated_at: now,
        })
        .eq("id", payment.id)
        .eq("status", "pending")
        .select("id")
        .maybeSingle();
      if (error || !updatedPayment) throw error || new Error("Payment row was not updated.");
      databaseUpdated = true;
    } catch (err) {
      console.warn("Supabase fail tournament_payments notice:", err);
    }

    try {
      const updated = await updateSharedTournamentPayment(payment, (current) => {
        if (current.status !== "pending") return current;
        return {
          ...current,
          status: "failed",
          result_desc: safeReason,
          updated_at: now,
        };
      });
      payment.status = updated.status;
      payment.result_desc = updated.result_desc;
      payment.updated_at = updated.updated_at;
      return { success: updated.status === "failed" };
    } catch (err) {
      if (databaseUpdated) {
        payment.status = "failed";
        payment.result_desc = safeReason;
        payment.updated_at = now;
        console.warn("Shared failed-payment snapshot notice:", err);
        return { success: true };
      }
      return { success: false };
    }
  }

  /**
   * Form / Generate Tournament Knockout Brackets
   * Builds single elimination brackets (1v1 Final -> Semi-Finals -> Grand Final)
   * Connects winners automatically to the next match.
   */
  static async generateBrackets(
    tournament_id: string,
    options: { shuffle?: boolean } = {}
  ): Promise<{ success: boolean; matches: TournamentMatch[]; error?: string }> {
    const tourney = await this.getTournamentById(tournament_id);
    if (!tourney) {
      return { success: false, matches: [], error: "Tournament not found." };
    }
    if (tourney.status !== "registration_open") {
      return { success: false, matches: [], error: "Brackets can only be formed while registration is open." };
    }
    if ((tourney.matches || []).length > 0) {
      return { success: false, matches: [], error: "Brackets have already been formed for this tournament." };
    }

    const maxPlayers = Number(tourney.max_players);
    if (![2, 4, 8, 16].includes(maxPlayers)) {
      return { success: false, matches: [], error: "This tournament has an unsupported bracket size." };
    }

    const sortParticipants = (participants: TournamentParticipant[]) =>
      [...participants].sort((a, b) => {
        const seedA = Number.isInteger(a.seed) ? Number(a.seed) : Number.MAX_SAFE_INTEGER;
        const seedB = Number.isInteger(b.seed) ? Number(b.seed) : Number.MAX_SAFE_INTEGER;
        if (seedA !== seedB) return seedA - seedB;
        return Date.parse(a.created_at || "") - Date.parse(b.created_at || "");
      });

    const validateParticipants = (participants: TournamentParticipant[]): string | null => {
      if (participants.length !== maxPlayers) {
        return `All ${maxPlayers} slots must be filled before brackets can be formed.`;
      }
      const friendIds = participants.map((participant) => participant.friend_id.trim().toLowerCase());
      if (friendIds.some((friendId) => !friendId) || new Set(friendIds).size !== maxPlayers) {
        return "Every slot must have a unique eFootball Friend ID.";
      }
      const userIds = participants.map((participant) => participant.user_id).filter(Boolean);
      if (new Set(userIds).size !== maxPlayers) {
        return "Every slot must belong to a different registered community account.";
      }

      if (tourney.entry_fee_kes === 0) {
        if (participants.some((participant) => participant.payment_status !== "exempt")) {
          return "Free-entry registrations must be confirmed before brackets can be formed.";
        }
      } else if (participants.some(
        (participant) =>
          participant.payment_status !== "paid" ||
          !amountsMatch(participant.amount_paid, tourney.entry_fee_kes)
      )) {
        return "Every paid entry must be confirmed before brackets can be formed.";
      }
      return null;
    };

    const shuffleParticipants = (participants: TournamentParticipant[]) => {
      for (let index = participants.length - 1; index > 0; index -= 1) {
        const swapIndex = Math.floor(Math.random() * (index + 1));
        [participants[index], participants[swapIndex]] = [participants[swapIndex], participants[index]];
      }
      return participants;
    };

    let players = sortParticipants(tourney.participants || []);
    const initialValidationError = validateParticipants(players);
    if (initialValidationError) {
      return { success: false, matches: [], error: initialValidationError };
    }
    if (options.shuffle) players = shuffleParticipants(players);

    let matchesToCreate = buildTournamentBracket(tournament_id, maxPlayers, players);
    let sharedTournament: Tournament | null = null;
    let sharedStateSaved = false;

    // Claim the registration_open -> in_progress transition in the shared store
    // first. Its version check serializes bracket creation across Vercel instances.
    try {
      sharedTournament = await updateSharedTournamentState(tournament_id, tourney, (current) => {
        if (current.status !== "registration_open" || (current.matches || []).length > 0) {
          throw new BracketStateConflictError("Brackets have already been formed or registration is closed.");
        }
        const currentPlayers = sortParticipants(current.participants || []);
        const validationError = validateParticipants(currentPlayers);
        if (validationError) throw new BracketStateConflictError(validationError);
        const bracketPlayers = options.shuffle ? shuffleParticipants(currentPlayers) : currentPlayers;
        matchesToCreate = buildTournamentBracket(tournament_id, maxPlayers, bracketPlayers);
        return {
          ...current,
          matches: matchesToCreate,
          status: "in_progress",
          updated_at: new Date().toISOString(),
        };
      });
      sharedStateSaved = true;
      matchesToCreate = sharedTournament.matches || matchesToCreate;
    } catch (err) {
      if (err instanceof BracketStateConflictError) {
        return { success: false, matches: [], error: err.message };
      }
      // If the shared runtime table is not available yet, use a conditional
      // status transition in the normalized table as the single-writer fallback.
      console.warn("Shared bracket-state claim notice:", err);
    }

    if (sharedStateSaved) {
      // The durable shared snapshot is authoritative if normalized-table writes
      // are unavailable. Mirror the bracket when possible without deleting rows.
      try {
        const supabase = getSupabase();
        const { error: insertError } = await supabase.from("tournament_matches").insert(
          matchesToCreate.map((match) => ({
            id: match.id,
            tournament_id: match.tournament_id,
            round: match.round,
            match_number: match.match_number,
            player1_name: match.player1_name,
            player2_name: match.player2_name,
            player1_friend_id: match.player1_friend_id,
            player2_friend_id: match.player2_friend_id,
            is_completed: false,
            next_match_id: match.next_match_id,
            next_match_slot: match.next_match_slot,
          }))
        );
        if (insertError) throw insertError;

        const { error: statusError } = await supabase
          .from("tournaments")
          .update({ status: "in_progress", updated_at: new Date().toISOString() })
          .eq("id", tournament_id)
          .eq("status", "registration_open");
        if (statusError) throw statusError;
      } catch (err) {
        console.warn("Supabase bracket mirror notice:", err);
      }
      return { success: true, matches: matchesToCreate };
    }

    // Database-only fallback: claim the status transition before inserting rows,
    // so concurrent requests cannot both replace or duplicate a bracket.
    try {
      const supabase = getSupabase();
      const { data: started, error: statusError } = await supabase
        .from("tournaments")
        .update({ status: "in_progress", updated_at: new Date().toISOString() })
        .eq("id", tournament_id)
        .eq("status", "registration_open")
        .select("id")
        .maybeSingle();
      if (statusError) throw statusError;
      if (!started) {
        return { success: false, matches: [], error: "Registration has closed or brackets were already formed. Refresh and try again." };
      }

      const { error: insertError } = await supabase.from("tournament_matches").insert(
        matchesToCreate.map((match) => ({
          id: match.id,
          tournament_id: match.tournament_id,
          round: match.round,
          match_number: match.match_number,
          player1_name: match.player1_name,
          player2_name: match.player2_name,
          player1_friend_id: match.player1_friend_id,
          player2_friend_id: match.player2_friend_id,
          is_completed: false,
          next_match_id: match.next_match_id,
          next_match_slot: match.next_match_slot,
        }))
      );
      if (insertError) {
        await supabase
          .from("tournaments")
          .update({ status: "registration_open", updated_at: new Date().toISOString() })
          .eq("id", tournament_id)
          .eq("status", "in_progress");
        throw insertError;
      }
      return { success: true, matches: matchesToCreate };
    } catch (err) {
      console.warn("Tournament bracket persistence failed:", err);
      return { success: false, matches: [], error: "Could not save tournament brackets. Please try again later." };
    }
  }

  /**
   * Post / Submit Match Result & Advance Winner into the next round
   * If Grand Final is won, crowns the Champion and completes the tournament!
   */
  static async submitMatchResult(params: {
    tournament_id: string;
    match_id: string;
    score1: number;
    score2: number;
    winner_name: string;
    match_code?: string;
  }): Promise<{
    success: boolean;
    isChampionCrowned?: boolean;
    winnerName?: string;
    championName?: string;
    championFriendId?: string | null;
    runnerUpName?: string;
    runnerUpFriendId?: string | null;
    tournament?: Tournament;
    error?: string;
  }> {
    const { tournament_id, match_id, score1, score2, winner_name, match_code } = params;

    if (
      !Number.isSafeInteger(score1) ||
      score1 < 0 ||
      !Number.isSafeInteger(score2) ||
      score2 < 0 ||
      score1 === score2
    ) {
      return { success: false, error: "Enter non-negative whole-number scores with a winner." };
    }

    const tourney = await this.getTournamentById(tournament_id);
    if (!tourney) {
      return { success: false, error: "Tournament not found." };
    }
    if (tourney.status !== "in_progress") {
      return { success: false, error: "Match results can only be recorded for an in-progress tournament." };
    }

    const matches = tourney.matches || [];
    const originalMatch = matches.find((match) => match.id === match_id);
    if (!originalMatch) {
      return { success: false, error: "Match not found in tournament bracket." };
    }
    if (originalMatch.is_completed) {
      return { success: false, error: "A result has already been recorded for this match." };
    }

    const unresolvedName = (name: string) => /^(?:TBD|Slot\s+\d+|Winner\b|Finalist\b)/i.test(name.trim());
    if (
      !originalMatch.player1_name?.trim() ||
      !originalMatch.player2_name?.trim() ||
      unresolvedName(originalMatch.player1_name) ||
      unresolvedName(originalMatch.player2_name)
    ) {
      return { success: false, error: "Both players must be confirmed in the bracket before recording a result." };
    }

    const playerOneWon = score1 > score2;
    const finalWinner = (playerOneWon ? originalMatch.player1_name : originalMatch.player2_name).trim();
    const runnerUpName = (playerOneWon ? originalMatch.player2_name : originalMatch.player1_name).trim();
    if (winner_name.trim() !== finalWinner) {
      return { success: false, error: "The recorded winner must match the higher score." };
    }

    const winnerParticipant = (tourney.participants || []).find(
      (participant) =>
        participant.friend_id === (playerOneWon ? originalMatch.player1_friend_id : originalMatch.player2_friend_id) ||
        participant.gamer_tag.trim().toLowerCase() === finalWinner.toLowerCase()
    );
    const runnerUpParticipant = (tourney.participants || []).find(
      (participant) =>
        participant.friend_id === (playerOneWon ? originalMatch.player2_friend_id : originalMatch.player1_friend_id) ||
        participant.gamer_tag.trim().toLowerCase() === runnerUpName.toLowerCase()
    );
    const winnerFriendId = (playerOneWon ? originalMatch.player1_friend_id : originalMatch.player2_friend_id) ||
      winnerParticipant?.friend_id || null;
    const runnerUpFriendId = (playerOneWon ? originalMatch.player2_friend_id : originalMatch.player1_friend_id) ||
      runnerUpParticipant?.friend_id || null;
    const winnerUserId = (playerOneWon ? originalMatch.player1_user_id : originalMatch.player2_user_id) ||
      winnerParticipant?.user_id || null;
    const isFinalMatch =
      (originalMatch.round === "Grand Final" || originalMatch.round === "1v1 Duel Championship") &&
      !originalMatch.next_match_id;
    if (!isFinalMatch && !originalMatch.next_match_id) {
      return { success: false, error: "This bracket match is missing its next-round link." };
    }
    if (isFinalMatch && originalMatch.next_match_id) {
      return { success: false, error: "The final match cannot advance to another round." };
    }

    let databaseSaved = false;
    try {
      const supabase = getSupabase();
      const now = new Date().toISOString();
      const { data: savedMatch, error: matchError } = await supabase
        .from("tournament_matches")
        .update({
          score1,
          score2,
          winner_name: finalWinner,
          is_completed: true,
          match_code: match_code || originalMatch.match_code || null,
          updated_at: now,
        })
        .eq("id", match_id)
        .eq("tournament_id", tournament_id)
        .eq("is_completed", false)
        .select("id")
        .maybeSingle();
      if (matchError || !savedMatch) throw matchError || new Error("Match row was not updated.");

      if (originalMatch.next_match_id) {
        const nextMatch = matches.find((match) => match.id === originalMatch.next_match_id);
        const updatePayload: Record<string, string | null> = {};
        if (nextMatch && originalMatch.next_match_slot === 1) {
          updatePayload.player1_name = finalWinner;
          updatePayload.player1_friend_id = winnerFriendId;
        }
        if (nextMatch && originalMatch.next_match_slot === 2) {
          updatePayload.player2_name = finalWinner;
          updatePayload.player2_friend_id = winnerFriendId;
        }
        if (Object.keys(updatePayload).length > 0) {
          const { error: nextMatchError } = await supabase
            .from("tournament_matches")
            .update({ ...updatePayload, updated_at: now })
            .eq("id", originalMatch.next_match_id)
            .eq("tournament_id", tournament_id);
          if (nextMatchError) throw nextMatchError;
        }
      }

      if (isFinalMatch) {
        const { error: tournamentError } = await supabase
          .from("tournaments")
          .update({ status: "completed", winner_name: finalWinner, updated_at: now })
          .eq("id", tournament_id);
        if (tournamentError) throw tournamentError;
      }
      databaseSaved = true;
    } catch (err) {
      console.warn("Supabase update match result notice:", err);
    }

    let sharedTournament: Tournament | null = null;
    try {
      sharedTournament = await updateSharedTournamentState(tournament_id, tourney, (current) => {
        if (current.status !== "in_progress") {
          throw new Error("Match results can only be recorded for an in-progress tournament.");
        }
        const nextMatches = [...(current.matches || [])];
        const currentMatch = nextMatches.find((match) => match.id === match_id);
        if (!currentMatch) throw new Error("Match not found in tournament bracket.");
        if (currentMatch.is_completed) {
          throw new Error("A result has already been recorded for this match.");
        }

        currentMatch.score1 = score1;
        currentMatch.score2 = score2;
        currentMatch.winner_name = finalWinner;
        currentMatch.winner_user_id = winnerUserId;
        currentMatch.is_completed = true;
        if (match_code) currentMatch.match_code = match_code;

        if (currentMatch.next_match_id) {
          const nextMatch = nextMatches.find((match) => match.id === currentMatch.next_match_id);
          if (nextMatch && currentMatch.next_match_slot === 1) {
            nextMatch.player1_name = finalWinner;
            nextMatch.player1_friend_id = winnerFriendId;
            nextMatch.player1_user_id = winnerUserId;
          }
          if (nextMatch && currentMatch.next_match_slot === 2) {
            nextMatch.player2_name = finalWinner;
            nextMatch.player2_friend_id = winnerFriendId;
            nextMatch.player2_user_id = winnerUserId;
          }
        }

        return {
          ...current,
          matches: nextMatches,
          status: isFinalMatch ? "completed" : current.status,
          winner_name: isFinalMatch ? finalWinner : current.winner_name,
          winner_user_id: isFinalMatch ? winnerUserId : current.winner_user_id,
          updated_at: new Date().toISOString(),
        };
      });
    } catch (err) {
      if (databaseSaved) {
        console.warn("Shared match-result snapshot notice:", err);
      } else {
        const message = err instanceof Error && err.message === "Match not found in tournament bracket."
          ? err.message
          : err instanceof Error && err.message === "A result has already been recorded for this match."
            ? err.message
            : "Could not save the match result. Please try again later.";
        return { success: false, error: message };
      }
    }

    const updatedTourney = sharedTournament || await this.getTournamentById(tournament_id) || tourney;
    const isChampionCrowned = isFinalMatch && updatedTourney.status === "completed";

    return {
      success: true,
      isChampionCrowned,
      winnerName: finalWinner,
      championName: isChampionCrowned ? finalWinner : undefined,
      championFriendId: isChampionCrowned ? winnerFriendId : undefined,
      runnerUpName: isChampionCrowned && updatedTourney.second_place_kes > 0 ? runnerUpName : undefined,
      runnerUpFriendId: isChampionCrowned && updatedTourney.second_place_kes > 0 ? runnerUpFriendId : undefined,
      tournament: updatedTourney,
    };
  }

  /**
   * Delete a tournament
   */
  static async deleteTournament(
    id: string
  ): Promise<"deleted" | "blocked" | "unavailable"> {
    if (!id) return "blocked";
    if (!hasServiceRoleKey()) return "unavailable";

    try {
      const deleted = await deleteTournamentIfNoPaymentActivity(id);
      return deleted ? "deleted" : "blocked";
    } catch (err) {
      console.warn("Atomic tournament deletion could not be completed:", err);
      return "unavailable";
    }
  }
}
