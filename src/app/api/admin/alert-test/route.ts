import { NextRequest, NextResponse } from "next/server";
import { dispatchAdminAlert } from "@/lib/notifications/adminAlert";
import { sendTransactionalEmail } from "@/lib/resend";

export const dynamic = "force-dynamic";

/**
 * Admin alert self-test: `GET /api/admin/alert-test`
 *
 * Protected by `Authorization: Bearer <CRON_SECRET>`, same as the cron routes.
 *
 * Why this exists: a misconfigured deploy used to look identical to a quiet
 * one -- an operator found out something was broken only when a real order
 * went unanswered. This endpoint fires one synthetic dispatch and reports the
 * configuration it used, so "are my alerts working?" has a yes/no answer in
 * ten seconds.
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
    // Email is the only delivery channel that exists in this build.
    email: Boolean(adminEmail),
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
