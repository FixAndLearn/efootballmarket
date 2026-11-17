import crypto from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatWhatsAppPhone } from "@/lib/utils/phone";
import { sendWhatsAppMessage } from "@/lib/whatsapp/cloudApi";
import { dispatchAdminWhatsAppAlert } from "@/lib/notifications/adminAlert";
import { checkRateLimit } from "@/lib/security/rateLimiter";
import { maskPhone } from "@/lib/security/publicSanitizer";
import { getClientIp, timingSafeCompare } from "@/lib/security/guards";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * 1. Webhook Verification (GET) - Required by Meta WhatsApp Cloud API
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  const expectedToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN?.trim();

  if (expectedToken && mode === "subscribe" && timingSafeCompare(token, expectedToken)) {
    console.log("[WhatsApp:Webhook] Meta Webhook verified successfully!");
    return new NextResponse(challenge, { status: 200 });
  }

  return new NextResponse("Forbidden: Verification Token Mismatch", { status: 403 });
}

/**
 * 2. Inbound Message & Notification Event Handler (POST)
 */
export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const rate = await checkRateLimit(`wa_webhook:${ip}`, 120, 60000);
    if (!rate.success) {
      return NextResponse.json({ status: "rate_limited" }, { status: 429 });
    }

    const rawText = await req.text();

    // Verify Meta X-Hub-Signature-256 HMAC when WHATSAPP_APP_SECRET is configured
    const appSecret = process.env.WHATSAPP_APP_SECRET?.trim();
    if (appSecret) {
      const sigHeader = req.headers.get("x-hub-signature-256");
      const expectedSig =
        "sha256=" +
        crypto.createHmac("sha256", appSecret).update(rawText, "utf8").digest("hex");
      if (!timingSafeCompare(sigHeader, expectedSig)) {
        console.warn(`[Security] Rejected forged WhatsApp webhook signature from IP ${ip}`);
        return NextResponse.json({ error: "Invalid webhook signature" }, { status: 401 });
      }
    }

    const body = JSON.parse(rawText || "{}");

    // Handle Meta Cloud API payload structure
    const entry = body?.entry?.[0];
    const change = entry?.changes?.[0]?.value;
    const messageData = change?.messages?.[0];

    // Handle generic gateway structure (UltraMsg, Wassenger)
    const sender =
      messageData?.from ||
      body?.data?.from ||
      body?.from ||
      body?.phone ||
      "";
    const text =
      messageData?.text?.body ||
      messageData?.interactive?.button_reply?.title ||
      body?.data?.body ||
      body?.message ||
      body?.body ||
      "";

    if (!sender || !text) {
      // Could be a status update (delivered, read) - acknowledge with 200
      return NextResponse.json({ status: "acknowledged" });
    }

    const cleanSender = formatWhatsAppPhone(sender);
    const trimmedText = text.trim().toUpperCase();

    // Log shape, not content: this handler ingests customer support
    // conversations and the platform retains logs for 30 days.
    console.log(
      `[WhatsApp:Inbound] ${maskPhone(cleanSender)} len=${text.length} cmd=${text.trim().toUpperCase().slice(0, 24)}`
    );

    // Automated 24/7 Bot Assistant responses
    if (trimmedText === "HI" || trimmedText === "HELLO" || trimmedText === "MENU" || trimmedText === "HELP" || trimmedText === "START") {
      const menu =
        `*Welcome to eFootballMarket Kenya!*\n\n` +
        `Marketplace listings for Konami IDs, Coins & Squads. Buyer protection applies only to orders from published listings paid through checkout.\n\n` +
        `*Quick Commands (Reply with a number):*\n` +
        `*1* Verify M-Pesa Till 1572931\n` +
        `*2* Marketplace Buyer Protection\n` +
        `*3* Check Order Status\n` +
        `*4* Speak with Support Desk\n\n` +
        `*Browse Squads:* https://www.efootballmarket.co.ke/browse`;

      await sendWhatsAppMessage({ toPhone: cleanSender, message: menu });
      return NextResponse.json({ status: "replied_menu" });
    }

    if (trimmedText === "1" || trimmedText.includes("TILL")) {
      const tillInfo =
        `*OFFICIAL SAFARICOM M-PESA PAYMENT DETAILS*\n\n` +
        `*Store Name:* EFootballMarket\n` +
        `*Buy Goods Till Number:* *1572931*\n` +
        `*Support:* +254 794 400 365\n\n` +
        `*Safety Warning:* Pay only through checkout for an active eFootballMarket listing. The checkout page will show the official Till or STK prompt. Payments for external Facebook / WhatsApp deals or to personal numbers are not covered.`;

      await sendWhatsAppMessage({ toPhone: cleanSender, message: tillInfo });
      return NextResponse.json({ status: "replied_till" });
    }

    if (trimmedText === "2" || trimmedText.includes("ESCROW")) {
      const escrowInfo =
        `*MARKETPLACE BUYER PROTECTION*\n\n` +
        `Protection applies only to an order created from a published listing and paid through eFootballMarket checkout.\n\n` +
        `1⃣ Pay using the Till or STK prompt shown in checkout.\n` +
        `2⃣ The order locks while the seller delivers login details in your private Order Room.\n` +
        `3⃣ Inspect the squad in-game and verify its account links during the 24-hour check.\n` +
        `4⃣ Confirm release or open a dispute from the order page.\n\n` +
        `Deals arranged and paid directly on WhatsApp, Facebook, or another external service are not covered.\n` +
        `Browse listings: https://www.efootballmarket.co.ke/browse`;

      await sendWhatsAppMessage({ toPhone: cleanSender, message: escrowInfo });
      return NextResponse.json({ status: "replied_escrow" });
    }

    if (trimmedText === "3" || trimmedText.startsWith("STATUS") || trimmedText.startsWith("EFM-") || trimmedText.startsWith("ORD-")) {
      const orderRef = text
        .trim()
        .replace(/^STATUS\s*/i, "")
        .replace(/[^a-zA-Z0-9_-]/g, "")
        .toUpperCase()
        .slice(0, 40);
      if (!orderRef || orderRef.length < 8) {
        return NextResponse.json({ status: "ignored_short_ref" });
      }
      const supabase = createAdminClient();

      // Require exact order_number match so partial substrings cannot enumerate orders
      const { data: order } = await supabase
        .from("orders")
        .select("order_number, status")
        .eq("order_number", orderRef)
        .maybeSingle();

      if (order) {
        const orderReply =
          `*ORDER #${order.order_number} STATUS*\n\n` +
          `*Status:* *${order.status.toUpperCase().replace(/_/g, " ")}*\n\n` +
          `*Sign in to view full details:* https://www.efootballmarket.co.ke/orders/${order.order_number}`;

        await sendWhatsAppMessage({ toPhone: cleanSender, message: orderReply });
      } else {
        const notFoundReply =
          `Order *"${orderRef}"* not found.\n\n` +
          `Please provide your full order number (e.g. *EFM-XXXX-123*). You can find this on your email receipt or order page.`;

        await sendWhatsAppMessage({ toPhone: cleanSender, message: notFoundReply });
      }
      return NextResponse.json({ status: "replied_order" });
    }

    if (trimmedText.includes("MIDDLEMAN")) {
      const retiredServiceInfo =
        `The off-platform contract service for deals arranged on Facebook / WhatsApp is no longer offered.\n\n` +
        `For buyer protection, choose a published listing and complete checkout on eFootballMarket: https://www.efootballmarket.co.ke/browse\n\n` +
        `External deals or payments made outside a marketplace order are not covered.`;

      await sendWhatsAppMessage({ toPhone: cleanSender, message: retiredServiceInfo });
      return NextResponse.json({ status: "replied_marketplace_policy" });
    }

    if (trimmedText === "4" || trimmedText === "5" || trimmedText.includes("AGENT") || trimmedText.includes("BRIAN")) {
      const agentReply =
        `*CONNECTING TO SUPPORT DESK*\n\n` +
        `Your message has been escalated to Brian Okibo (+254 794 400 365).\n` +
        `You can also reach him directly on WhatsApp: https://wa.me/254794400365\n\n` +
        `An officer will get back to you shortly. Thank you!`;

      await sendWhatsAppMessage({ toPhone: cleanSender, message: agentReply });

      // Notify Brian Okibo of customer escalation
      dispatchAdminWhatsAppAlert({
        eventType: "NEW_ORDER_CREATED", // reuse payload
        listingTitle: "Customer requested live WhatsApp support",
        buyerPhone: cleanSender,
        details: `Message: "${text}"`,
      }).catch(() => {});

      return NextResponse.json({ status: "escalated_agent" });
    }

    // Default friendly fallback
    const fallback =
      `Thank you for contacting *eFootballMarket*!\n\n` +
      `We received your message: _"${text}"_\n\n` +
      `Reply with *MENU* to see options or *4* to message Support (+254 794 400 365).\n\n` +
      `Official Website: https://www.efootballmarket.co.ke`;

    await sendWhatsAppMessage({ toPhone: cleanSender, message: fallback });
    return NextResponse.json({ status: "replied_default" });
  } catch (error: any) {
    console.error("[WhatsApp:Webhook] Inbound error:", error);
    return NextResponse.json({ error: error.message }, { status: 200 }); // Always 200 for Meta
  }
}
