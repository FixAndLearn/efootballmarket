import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { normalizePhoneNumber } from "@/lib/utils/phone";
import { dispatchAdminWhatsAppAlert } from "@/lib/notifications/adminAlert";
import { checkRateLimit } from "@/lib/security/rateLimiter";
import {
  getClientIp,
  maskPhoneNumber,
  sanitizeTransactionId,
  verifyAdminOrSecret,
} from "@/lib/security/guards";

export const dynamic = "force-dynamic";

export interface MiddlemanDeal {
  id: string;
  deal_code: string;
  buyer_name: string;
  buyer_phone: string;
  seller_name: string;
  seller_phone: string;
  deal_title: string;
  deal_description: string;
  item_amount_kes: number;
  escrow_fee_kes: number;
  total_amount_kes: number;
  status: "awaiting_payment" | "escrow_locked" | "seller_delivering" | "buyer_verifying" | "completed" | "disputed";
  till_number: string;
  mpesa_receipt?: string;
  created_at: string;
}

// In-memory runtime persistence
const MEMORY_DEALS: MiddlemanDeal[] = [];

export async function GET(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const rate = checkRateLimit(`middleman_get:${ip}`, 30, 60000);
    if (!rate.success) {
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
    }

    const { searchParams } = new URL(req.url);
    const rawCode = searchParams.get("code");
    const rawPhone = searchParams.get("phone");

    const code = sanitizeTransactionId(rawCode).toUpperCase();
    const normPhone = rawPhone ? normalizePhoneNumber(rawPhone) : null;
    const cleanPhone = normPhone?.isValid ? normPhone.international : "";

    if (rawPhone && !cleanPhone) {
      return NextResponse.json(
        { deals: [], message: "Enter a full 10-digit Kenyan phone number or EFM contract code." },
        { status: 200 }
      );
    }

    // Prevent unauthenticated bulk enumeration: require exact deal code unless caller is Admin
    if (!code && !cleanPhone) {
      const adminAuth = await verifyAdminOrSecret(req);
      if (!adminAuth.authorized) {
        return NextResponse.json(
          { deals: [], message: "Provide your EFM contract code to look up a deal." },
          { status: 200 }
        );
      }
    }

    const redactDeal = (d: any) => ({
      ...d,
      buyer_phone: maskPhoneNumber(d.buyer_phone),
      seller_phone: maskPhoneNumber(d.seller_phone),
    });

    // Check Supabase if table exists
    try {
      const supabase = createAdminClient();
      if (code) {
        const { data, error } = await supabase
          .from("middleman_deals")
          .select("*")
          .eq("deal_code", code);
        if (!error && data && data.length > 0) {
          return NextResponse.json({ deals: data.map(redactDeal) });
        }
      } else if (cleanPhone) {
        const [{ data: asBuyer }, { data: asSeller }] = await Promise.all([
          supabase.from("middleman_deals").select("*").eq("buyer_phone", cleanPhone),
          supabase.from("middleman_deals").select("*").eq("seller_phone", cleanPhone),
        ]);
        const merged = [...(asBuyer || []), ...(asSeller || [])];
        if (merged.length > 0) {
          return NextResponse.json({ deals: merged.map(redactDeal) });
        }
      } else {
        const { data, error } = await supabase
          .from("middleman_deals")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(50);
        if (!error && data) {
          return NextResponse.json({ deals: data });
        }
      }
    } catch {
      // fallback
    }

    let results = [...MEMORY_DEALS];
    if (code) {
      results = results.filter((d) => d.deal_code.toUpperCase() === code);
    } else if (cleanPhone) {
      results = results.filter(
        (d) => d.buyer_phone === cleanPhone || d.seller_phone === cleanPhone
      );
    }

    return NextResponse.json({ deals: results.map(redactDeal) });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to query deals" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const rate = checkRateLimit(`middleman_post:${ip}`, 5, 60000);
    if (!rate.success) {
      return NextResponse.json(
        { error: "Too many middleman contracts created. Please wait 1 minute." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const {
      buyer_name,
      buyer_phone,
      seller_name,
      seller_phone,
      deal_title,
      deal_description,
      item_amount_kes,
    } = body;

    if (!buyer_name || !buyer_phone || !seller_phone || !deal_title || !item_amount_kes) {
      return NextResponse.json(
        { error: "Please fill in buyer phone, seller phone, deal title, and agreed amount." },
        { status: 400 }
      );
    }

    const amount = Number(item_amount_kes);
    if (isNaN(amount) || amount < 100) {
      return NextResponse.json({ error: "Agreed deal amount must be at least KES 100." }, { status: 400 });
    }

    // 5% Seller Escrow service fee (minimum 50 KES, maximum 500 KES) deducted from seller payout; buyer pays KES 0 extra
    const rawFee = Math.round(amount * 0.05);
    const fee = Math.max(50, Math.min(500, rawFee));
    const total = amount;

    const randomSuffix = crypto.randomBytes(4).toString("hex").toUpperCase();
    const dealCode = `EFM-${randomSuffix}`;

    const normBuyer = normalizePhoneNumber(buyer_phone);
    const normSeller = normalizePhoneNumber(seller_phone);
    const internationalBuyerPhone = normBuyer.isValid ? normBuyer.international : buyer_phone.trim();
    const internationalSellerPhone = normSeller.isValid ? normSeller.international : seller_phone.trim();

    const newDeal: MiddlemanDeal = {
      id: `mdm_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      deal_code: dealCode,
      buyer_name: buyer_name.trim(),
      buyer_phone: internationalBuyerPhone,
      seller_name: seller_name?.trim() || "Trader",
      seller_phone: internationalSellerPhone,
      deal_title: deal_title.trim(),
      deal_description: deal_description?.trim() || "Private trade secured via eFootballMarket Escrow.",
      item_amount_kes: amount,
      escrow_fee_kes: fee,
      total_amount_kes: total,
      status: "awaiting_payment",
      till_number: "1572931",
      created_at: new Date().toISOString(),
    };

    // Try saving to Supabase
    try {
      const supabase = createAdminClient();
      await supabase.from("middleman_deals").insert(newDeal);
    } catch {
      // In-memory fallback
    }

    MEMORY_DEALS.unshift(newDeal);

    // Automated WhatsApp alert to Escrow Desk (+254794400365)
    dispatchAdminWhatsAppAlert({
      eventType: "MIDDLEMAN_DEAL_CREATED",
      orderNumber: dealCode,
      listingTitle: deal_title,
      amount: total,
      buyerPhone: internationalBuyerPhone,
      sellerPhone: internationalSellerPhone,
    }).catch(() => {});

    return NextResponse.json({ success: true, deal: newDeal }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to create escrow contract" }, { status: 500 });
  }
}
