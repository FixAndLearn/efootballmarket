import { randomUUID } from "crypto";
import { mpesaClient } from "@/lib/mpesa/client";
import { checkRateLimit } from "@/lib/security/rateLimiter";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { TournamentService } from "@/services/tournamentService";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  let providerRequestAttempted = false;
  try {
    const supabase = createServerSupabaseClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    const body = await req.json();
    const { tournament_id, gamer_tag, friend_id, phone_number } = body;

    const verifiedUserId = authUser?.id || null;

    if (!verifiedUserId) {
      return NextResponse.json(
        {
          error:
            "Community Membership Required: Only signed-in members can join tournaments. Please log in or register first.",
        },
        { status: 401 }
      );
    }

    const { data: callerProf } = await supabase
      .from("profiles")
      .select("is_suspended")
      .eq("id", verifiedUserId)
      .maybeSingle();

    if (callerProf?.is_suspended) {
      return NextResponse.json(
        { error: "Your account is suspended and cannot join tournaments." },
        { status: 403 }
      );
    }

    if (!tournament_id || !gamer_tag || !friend_id || !phone_number) {
      return NextResponse.json(
        { error: "Tournament ID, Gamer Tag, Friend ID, and Safaricom Phone Number are required." },
        { status: 400 }
      );
    }

    // Rate limit checks (e.g. max 5 STK pushes per minute)
    const forwarded = req.headers.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(",")[0].trim() : "127.0.0.1";
    const rateCheck = await checkRateLimit(`tourney_stk:${verifiedUserId}:${ip}`, 5, 60000);
    if (!rateCheck.success) {
      return NextResponse.json(
        { error: "Too many payment attempts. Please wait a minute before requesting another STK Push." },
        { status: 429 }
      );
    }

    const tourney = await TournamentService.getTournamentById(tournament_id);
    if (!tourney) {
      return NextResponse.json({ error: "Tournament not found." }, { status: 404 });
    }

    if (tourney.status !== "registration_open") {
      return NextResponse.json(
        { error: "Registration is closed for this tournament." },
        { status: 400 }
      );
    }

    if (tourney.entry_fee_kes <= 0) {
      return NextResponse.json(
        { error: "This is a free tournament! Register directly with zero payment." },
        { status: 400 }
      );
    }

    const participants = tourney.participants || [];
    if (participants.length >= tourney.max_players) {
      return NextResponse.json(
        { error: "This tournament is already full. No remaining slots." },
        { status: 400 }
      );
    }

    const cleanFriendId = friend_id.trim().toLowerCase();
    if (participants.some((p) => p.friend_id.trim().toLowerCase() === cleanFriendId)) {
      return NextResponse.json(
        { error: "A player with this eFootball Friend ID has already registered." },
        { status: 400 }
      );
    }

    if (participants.some((p) => p.user_id === verifiedUserId)) {
      return NextResponse.json(
        { error: "You have already joined this tournament with your account." },
        { status: 400 }
      );
    }

    const normalizedPhone = mpesaClient.normalizePhoneNumber(phone_number);
    if (normalizedPhone.length < 12) {
      return NextResponse.json(
        { error: "Please enter a valid Safaricom phone number (e.g. 0712345678 or 254712345678)." },
        { status: 400 }
      );
    }

    const existingPayment = await TournamentService.getLatestPaymentForUser(tourney.id, verifiedUserId);
    if (existingPayment?.status === "pending") {
      return NextResponse.json(
        { error: "A payment attempt is already pending for this tournament. Do not request another prompt; check its status or contact support." },
        { status: 409 }
      );
    }

    const orderRef = `TRN-${tourney.id.slice(0, 6)}-${Date.now().toString().slice(-4)}`;
    const reservationId = randomUUID();

    // Persist a pending payment reservation before contacting M-Pesa. This
    // prevents deletion or another payment attempt while the provider request is in flight.
    const paymentReservation = await TournamentService.createTournamentPayment({
      tournament_id: tourney.id,
      user_id: verifiedUserId,
      gamer_tag: gamer_tag.trim(),
      friend_id: friend_id.trim(),
      phone_number: normalizedPhone,
      amount: tourney.entry_fee_kes,
      checkout_request_id: reservationId,
    });

    providerRequestAttempted = true;
    const stkResponse = await mpesaClient.initiateStkPush({
      phoneNumber: normalizedPhone,
      amount: tourney.entry_fee_kes,
      orderNumber: orderRef,
      description: `Entry: ${tourney.title.slice(0, 20)}`,
    });

    const checkoutRequestId = stkResponse.CheckoutRequestID;
    if (!checkoutRequestId) {
      return NextResponse.json(
        { error: "The payment prompt could not be confirmed. A pending request was recorded; contact support before retrying." },
        { status: 503 }
      );
    }

    await TournamentService.attachTournamentPaymentRequestIds(
      paymentReservation,
      checkoutRequestId,
      stkResponse.MerchantRequestID
    );

    return NextResponse.json({
      success: true,
      checkoutRequestId,
      customerMessage:
        stkResponse.CustomerMessage ||
        `M-Pesa STK Push sent to ${normalizedPhone}. Please check your phone and enter your PIN.`,
    });
  } catch {
    // Provider errors can contain credential-bearing URLs; never log or echo them.
    console.error("Tournament STK Push initiation or reservation update failed.");
    return NextResponse.json(
      {
        error: providerRequestAttempted
          ? "The M-Pesa prompt may have been sent, but its status could not be confirmed. Do not retry yet; contact support to check the pending request."
          : "Could not safely record the tournament payment request. No M-Pesa prompt was sent; please try again later.",
      },
      { status: providerRequestAttempted ? 503 : 500 }
    );
  }
}
