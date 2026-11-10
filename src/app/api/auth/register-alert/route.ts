import { NextRequest, NextResponse } from "next/server";
import { dispatchAdminWhatsAppAlert } from "@/lib/notifications/adminAlert";
import { checkRateLimit } from "@/lib/security/rateLimiter";
import { getClientIp } from "@/lib/security/guards";
import { z } from "zod";

export const dynamic = "force-dynamic";

const registerAlertSchema = z.object({
  username: z.string().trim().min(2).max(50).optional(),
  email: z.string().email().max(120),
  phoneNumber: z.string().trim().max(20).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const rate = checkRateLimit(`reg_alert:${ip}`, 3, 600000);
    if (!rate.success) {
      return NextResponse.json({ success: false, error: "Rate limited" }, { status: 429 });
    }

    const json = await req.json();
    const parsed = registerAlertSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: "Invalid payload" }, { status: 400 });
    }

    await dispatchAdminWhatsAppAlert({
      eventType: "NEW_USER_REGISTERED",
      username: parsed.data.username || "New Gamer",
      userEmail: parsed.data.email,
      buyerPhone: parsed.data.phoneNumber || "",
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.warn("Register WhatsApp alert non-blocking error:", err.message);
    return NextResponse.json({ success: false }, { status: 200 });
  }
}
