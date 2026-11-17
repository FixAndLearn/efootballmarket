const REGISTRATION_DRAFT_KEY = "efootballmarket:tournament-stk-registration-draft:v1";
const REGISTRATION_DRAFT_TTL_MS = 30 * 60 * 1000;

export interface TournamentRegistrationDraft {
  tournament_id: string;
  gamer_tag: string;
  friend_id: string;
  phone_number: string;
}

interface StoredTournamentRegistrationDraft extends TournamentRegistrationDraft {
  saved_at: number;
}

/**
 * Keep the modal-to-STK form handoff in this tab only. Do not put contact details
 * in the URL, and expire the draft quickly if the user abandons registration.
 */
export function saveTournamentRegistrationDraft(
  draft: TournamentRegistrationDraft
): boolean {
  if (typeof window === "undefined") return false;

  try {
    const stored: StoredTournamentRegistrationDraft = {
      tournament_id: draft.tournament_id.trim(),
      gamer_tag: draft.gamer_tag.trim(),
      friend_id: draft.friend_id.trim(),
      phone_number: draft.phone_number.trim(),
      saved_at: Date.now(),
    };

    if (
      !stored.tournament_id ||
      !stored.gamer_tag ||
      !stored.friend_id ||
      !stored.phone_number
    ) {
      return false;
    }

    window.sessionStorage.setItem(REGISTRATION_DRAFT_KEY, JSON.stringify(stored));
    return true;
  } catch {
    return false;
  }
}

/** Read and consume a matching, unexpired registration draft from this tab. */
export function consumeTournamentRegistrationDraft(
  tournamentId: string
): TournamentRegistrationDraft | null {
  if (typeof window === "undefined" || !tournamentId) return null;

  try {
    const raw = window.sessionStorage.getItem(REGISTRATION_DRAFT_KEY);
    if (!raw) return null;

    // Consume even stale or mismatched drafts so they cannot leak into another
    // tournament registration later in this tab.
    window.sessionStorage.removeItem(REGISTRATION_DRAFT_KEY);
    const parsed = JSON.parse(raw) as Partial<StoredTournamentRegistrationDraft>;
    const savedAt = Number(parsed.saved_at);
    const age = Date.now() - savedAt;

    if (
      parsed.tournament_id !== tournamentId ||
      !Number.isFinite(savedAt) ||
      age < 0 ||
      age > REGISTRATION_DRAFT_TTL_MS ||
      typeof parsed.gamer_tag !== "string" ||
      typeof parsed.friend_id !== "string" ||
      typeof parsed.phone_number !== "string" ||
      !parsed.gamer_tag.trim() ||
      !parsed.friend_id.trim() ||
      !parsed.phone_number.trim()
    ) {
      return null;
    }

    return {
      tournament_id: tournamentId,
      gamer_tag: parsed.gamer_tag,
      friend_id: parsed.friend_id,
      phone_number: parsed.phone_number,
    };
  } catch {
    try {
      window.sessionStorage.removeItem(REGISTRATION_DRAFT_KEY);
    } catch {
      // Storage may be disabled; form entry remains available.
    }
    return null;
  }
}
