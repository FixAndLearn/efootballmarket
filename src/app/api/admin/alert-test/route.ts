import { NextRequest, NextResponse } from "next/server";
import { dispatchAdminAlert } from "@/lib/notifications/adminAlert";
import { sendTransactionalEmail } from "@/lib/resend";

export const dynamic = "force-dynamic";

/**
 * Admin alert self-test: `GET /api/admin/alert-test`
 *
 * Protected by `Authorization: Bearer <CRON_SECRET>`, same as the cron routes.
 *
 * Why this exists: the alert chain has four optional channels and silently
 * skips any whose credentials are absent. That means a misconfigured deploy
 * looks identical to a quiet one -- an operator finds out something was broken
 * only when a real order goes unanswered. This endpoint fires one synthetic
 * dispatch and reports per-channel configuration, so "are my alerts working?"
 * has a yes/no answer in ten seconds.
 *
 * It also reports whether RESEND_API_KEY is present but never returns its
 * value. Add ?probe=1 to send a raw provider email and surface the exact
 * Resend error string, which distinguishes "key wrong" from "domain
 * unverified" from "key missing".
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET?.trim();

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const adminEmail = (process.env.ADMIN_EMAIL || "").trim();

  const config = {
    adminEmail: adminEmail || "(unset)",
    resendKeyPresent: Boolean(process.env.RESEND_API_KEY?.trim()),
    resendFrom: process.env.RESEND_FROM_EMAIL || "notifications@efootballmarket.co.ke",
    metaWhatsApp: Boolean(
      (process.env.WHATSAPP_CLOUD_API_TOKEN || process.env.META_WHATSAPP_TOKEN) &&
        process.env.WHATSAPP_PHONE_NUMBER_ID
    ),
    callMeBot: Boolean(
      process.env.CALLMEBOT_API_KEY || process.env.WHATSAPP_BOT_API_KEY
    ),
    webhook: Boolean(
      process.env.ADMIN_ALERT_WEBHOOK_URL || process.env.WHATSAPP_WEBHOOK_URL
    ),
    sms: Boolean(
      process.env.AT_API_KEY ||
        process.env.AFRICASTALKING_API_KEY ||
        process.env.ADVANTA_API_KEY
    ),
  };

  const wantsProbe = req.nextUrl.searchParams.get("probe") === "1";
  let probe: unknown = undefined;

  if (wantsProbe) {
    probe = await sendTransactionalEmail({
      to: adminEmail || "brianokibo@gmail.com",
      subject: "eFootballMarket raw provider probe",
      html: "<p>Raw Resend probe. If this arrives, the key and domain are both good.</p>",
      text: "Raw Resend probe. If this arrives, the key and domain are both good.",
    });
  }

  // Fire a synthetic alert through the real chain -- not a simulation.
  const before = Date.now();
  let dispatchError: string | null = null;
  try {
    await dispatchAdminAlert({
      eventType: "NEW_ORDER_CREATED",
      orderNumber: "TEST-0000",
      listingTitle: "Alert self-test (ignore this message)",
      amount: 1,
      details: "Triggered from /api/admin/alert-test.",
    });
  } catch (err) {
    dispatchError = err instanceof Error ? err.message : String(err);
  }

  return NextResponse.json({
    ok: true,
    message:
      "Synthetic alert dispatched. If nothing arrives, check the config block below and Resend's domain status.",
    tookMs: Date.now() - before,
    dispatchError,
    config,
    probe,
  });
}
