import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, hasServiceRoleKey } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { WantedRequest } from "@/types/database";
import { normalizePhoneNumber } from "@/lib/utils/phone";
import { dispatchAdminWhatsAppAlert } from "@/lib/notifications/adminAlert";
import { checkRateLimit } from "@/lib/security/rateLimiter";
import { getClientIp } from "@/lib/security/guards";

export const dynamic = "force-dynamic";

// Persistent in-memory storage for requests submitted in runtime
let memoryRequests: WantedRequest[] = [];

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const platform = searchParams.get("platform");
    const minOvr = searchParams.get("minOvr");
    const maxBudget = searchParams.get("maxBudget");

    // Try Supabase first if table exists
    const supabase = createAdminClient();
    try {
      let query = supabase.from("wanted_requests").select("*").eq("status", "active");

      if (platform && platform !== "all") {
        query = query.eq("preferred_platform", platform);
      }
      if (minOvr) {
        query = query.gte("min_overall_rating", parseInt(minOvr, 10));
      }
      if (maxBudget) {
        query = query.lte("budget_kes", parseInt(maxBudget, 10));
      }

      const { data, error } = await query.order("created_at", { ascending: false });
      if (!error && data && data.length > 0) {
        return NextResponse.json({ requests: data });
      }
    } catch {
      // fallback to memory
    }

    // Filter memory requests
    let filtered = [...memoryRequests];
    if (platform && platform !== "all") {
      filtered = filtered.filter((r) => r.preferred_platform === platform);
    }
    if (minOvr) {
      filtered = filtered.filter((r) => r.min_overall_rating >= parseInt(minOvr, 10));
    }
    if (maxBudget) {
      filtered = filtered.filter((r) => r.budget_kes <= parseInt(maxBudget, 10));
    }

    return NextResponse.json({ requests: filtered });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to load requests" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const rate = checkRateLimit(`wanted_post:${ip}`, 5, 60000);
    if (!rate.success) {
      return NextResponse.json(
        { error: "Too many squad requests submitted. Please wait 1 minute." },
        { status: 429 }
      );
    }

    const body = await req.json();

    const {
      buyer_name,
      buyer_phone,
      title,
      description,
      min_overall_rating,
      target_playstyle,
      preferred_platform,
      budget_kes,
      key_players_wanted,
    } = body;

    if (!title || !budget_kes || !preferred_platform || !buyer_phone) {
      return NextResponse.json(
        { error: "Title, Budget (KES), Platform, and WhatsApp phone number are required." },
        { status: 400 }
      );
    }

    const norm = normalizePhoneNumber(String(buyer_phone));
    if (!norm.isValid) {
      return NextResponse.json(
        { error: "Enter a valid Kenyan phone number (e.g. 07XX XXX XXX)." },
        { status: 400 }
      );
    }
    const internationalPhone = norm.international;

    const newRequest: WantedRequest = {
      id: `req_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      buyer_name: buyer_name?.trim() || "Verified Buyer",
      buyer_phone: internationalPhone,
      title: title.trim(),
      description: description?.trim() || "Ready to purchase through eFootballMarket escrow immediately.",
      min_overall_rating: Number(min_overall_rating) || 3000,
      target_playstyle: target_playstyle || "quick_counter",
      preferred_platform: preferred_platform || "android",
      budget_kes: Number(budget_kes),
      key_players_wanted: Array.isArray(key_players_wanted)
        ? key_players_wanted
        : typeof key_players_wanted === "string"
        ? key_players_wanted.split(",").map((s) => s.trim()).filter(Boolean)
        : [],
      status: "active",
      created_at: new Date().toISOString(),
    };

    // Try saving to Supabase
    try {
      const supabase = createAdminClient();
      await supabase.from("wanted_requests").insert(newRequest);
    } catch {
      // In-memory fallback
    }

    memoryRequests.unshift(newRequest);

    // Automated WhatsApp alert to Brian Okibo (+254794400365)
    dispatchAdminWhatsAppAlert({
      eventType: "WANTED_REQUEST_POSTED",
      listingTitle: title.trim(),
      amount: Number(budget_kes),
      buyerPhone: internationalPhone,
    }).catch(() => {});

    return NextResponse.json({ success: true, request: newRequest }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to create request" }, { status: 500 });
  }
}
