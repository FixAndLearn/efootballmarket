import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { z } from "zod";
import { sendUserInvitationEmail } from "@/lib/notifications/emailAlert";
import { checkRateLimit } from "@/lib/security/rateLimiter";
import { getClientIp } from "@/lib/security/guards";

export const dynamic = "force-dynamic";

const inviteSchema = z.object({
  toEmail: z.string().trim().email().max(120),
  personalMessage: z.string().trim().max(240).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet: Array<{ name: string; value: string; options: any }>) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          },
        },
      }
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Please sign in to send an invitation." },
        { status: 401 }
      );
    }

    const ip = getClientIp(request);
    const rate = checkRateLimit(`invite_email:${user.id}:${ip}`, 5, 600000);
    if (!rate.success) {
      return NextResponse.json(
        { error: "Invitation limit reached. Please wait a few minutes before sending more." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const parsed = inviteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Please provide a valid email address." },
        { status: 400 }
      );
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("first_name, last_name, username, is_suspended")
      .eq("id", user.id)
      .maybeSingle();

    if (profile?.is_suspended) {
      return NextResponse.json(
        { error: "Suspended accounts cannot send invitations." },
        { status: 403 }
      );
    }

    const inviterName = profile?.first_name
      ? `${profile.first_name} ${profile.last_name || ""}`.trim()
      : profile?.username || "eFootball Trader";
    const inviteCode = profile?.username || user.id.slice(0, 8);

    // Strip HTML tags and external links from optional personal note to prevent phishing abuse
    const safeMessage = parsed.data.personalMessage
      ? parsed.data.personalMessage
          .replace(/<[^>]*>/g, "")
          .replace(/https?:\/\/\S+/gi, "")
          .trim()
      : undefined;

    const canonicalAppUrl =
      process.env.NEXT_PUBLIC_APP_URL || "https://www.efootballmarket.co.ke";
    const inviteUrl = `${canonicalAppUrl}/invite?ref=${encodeURIComponent(inviteCode)}`;

    const result = await sendUserInvitationEmail({
      toEmail: parsed.data.toEmail,
      inviterName,
      inviteCode,
      inviteUrl,
      personalMessage: safeMessage || undefined,
    });

    if (result.error) {
      return NextResponse.json(
        { error: result.error || "Failed to deliver invitation email." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Invitation successfully sent to ${parsed.data.toEmail}!`,
      inviteUrl,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
