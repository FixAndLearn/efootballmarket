import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, hasServiceRoleKey } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/security/rateLimiter";
import { getClientIp, maskPhoneNumber } from "@/lib/security/guards";
import { isUserAdmin } from "@/lib/security/adminAuth";
import { normalizePhoneNumber } from "@/lib/utils/phone";
import { sendSmsAlert } from "@/lib/notifications/smsAlert";
import { dispatchAdminWhatsAppAlert } from "@/lib/notifications/adminAlert";
import { sendTransactionalEmail } from "@/lib/resend";

export const dynamic = "force-dynamic";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function getClient() {
  return hasServiceRoleKey() ? createAdminClient() : createServerSupabaseClient();
}

/**
 * Direct Seller Phone Availability Ping API (`/api/listings/availability`)
 * - Buyer taps 1 button under any listed squad -> Seller immediately gets phone notifications
 *   (SMS + Native Phone Browser Push + Realtime In-App Toast + Mobile Email) to confirm availability.
 * - Admin sees all pings in `/admin` with 1-click direct WhatsApp links to BOTH Seller and Buyer.
 * - Seller taps "Yes, Available" or "Sold / Unavailable" in `/dashboard/seller` -> Buyer immediately
 *   gets phone/browser/SMS notification back with direct `/pay/[id]` checkout link.
 */
export async function GET(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const rate = checkRateLimit(`avail_get:${ip}`, 60, 60000);
    if (!rate.success) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const { searchParams } = new URL(req.url);
    const pingId = searchParams.get("pingId");
    const sellerId = searchParams.get("sellerId");
    const listingId = searchParams.get("listingId");
    const adminMode = searchParams.get("admin") === "1";

    const userSupabase = createServerSupabaseClient();
    const {
      data: { user: viewer },
    } = await userSupabase.auth.getUser();
    const supabase = getClient();

    // 1. Single Ping Status Check (used by buyer's live phone/browser notification watcher)
    if (pingId) {
      if (!UUID_REGEX.test(pingId)) {
        return NextResponse.json({ ping: null });
      }
      const { data: ping } = await supabase
        .from("availability_pings")
        .select("id, listing_id, status, seller_note, responded_at, created_at")
        .eq("id", pingId)
        .maybeSingle();

      return NextResponse.json({ ping: ping || null });
    }

    // 2. Public quick check: was this listing confirmed available by the seller within the last 6 hours?
    if (listingId && !sellerId && !adminMode) {
      if (!UUID_REGEX.test(listingId)) {
        return NextResponse.json({ recentAvailableAt: null });
      }
      const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();
      const { data: recentConfirmed } = await supabase
        .from("availability_pings")
        .select("responded_at")
        .eq("listing_id", listingId)
        .eq("status", "available")
        .gte("responded_at", sixHoursAgo)
        .order("responded_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      return NextResponse.json({
        recentAvailableAt: recentConfirmed?.responded_at || null,
      });
    }

    if (!viewer) {
      return NextResponse.json({ pings: [] }, { status: 401 });
    }

    let viewerIsAdmin = isUserAdmin(viewer.email);
    if (!viewerIsAdmin) {
      const { data: prof } = await supabase
        .from("profiles")
        .select("role, is_suspended")
        .eq("id", viewer.id)
        .maybeSingle();
      viewerIsAdmin = isUserAdmin(viewer.email, prof?.role, prof?.is_suspended);
    }

    // 3. Admin View: full unredacted Seller & Buyer phones for direct WhatsApp outreach
    if (adminMode) {
      if (!viewerIsAdmin) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      const { data: allPings } = await supabase
        .from("availability_pings")
        .select(
          "*, listing:listings(id, title, price, currency, status, platform, overall_team_strength), seller:profiles!seller_id(id, username, phone_number, email), buyer:profiles!buyer_id(id, username, phone_number, email)"
        )
        .order("created_at", { ascending: false })
        .limit(40);

      return NextResponse.json({ pings: allPings || [] });
    }

    // 4. Seller View: incoming availability checks for this seller (phone masked so deals stay on escrow)
    const targetSellerId = sellerId && viewerIsAdmin ? sellerId : viewer.id;
    const { data: sellerPings } = await supabase
      .from("availability_pings")
      .select(
        "id, listing_id, seller_id, buyer_name, buyer_phone, status, seller_note, responded_at, created_at, listing:listings(id, title, price, currency, status, platform, overall_team_strength)"
      )
      .eq("seller_id", targetSellerId)
      .order("created_at", { ascending: false })
      .limit(25);

    const sanitized = (sellerPings || []).map((p: any) => ({
      ...p,
      buyer_name: p.buyer_name || "Interested Buyer",
      buyer_phone: p.buyer_phone ? maskPhoneNumber(p.buyer_phone) : null,
    }));

    return NextResponse.json({ pings: sanitized });
  } catch (err: any) {
    return NextResponse.json({ error: err.message, pings: [] }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const rate = checkRateLimit(`avail_ping:${ip}`, 8, 60000);
    if (!rate.success) {
      return NextResponse.json(
        { error: "Please wait a moment before sending another availability check." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { listingId, buyerPhone, buyerName } = body;

    if (!listingId || !UUID_REGEX.test(String(listingId))) {
      return NextResponse.json({ error: "Valid squad listing ID required." }, { status: 400 });
    }

    const userSupabase = createServerSupabaseClient();
    const {
      data: { user },
    } = await userSupabase.auth.getUser();

    const adminSupabase = getClient();

    // Fetch listing + seller contact info
    const { data: listing, error: listingErr } = await adminSupabase
      .from("listings")
      .select(
        "id, title, price, currency, status, seller_id, overall_team_strength, seller:profiles!seller_id(id, username, phone_number, email)"
      )
      .eq("id", listingId)
      .is("deleted_at", null)
      .single();

    if (listingErr || !listing) {
      return NextResponse.json({ error: "Listing not found." }, { status: 404 });
    }

    if (listing.status !== "published") {
      return NextResponse.json(
        { error: "This squad is already locked in escrow or sold." },
        { status: 400 }
      );
    }

    if (user && user.id === listing.seller_id) {
      return NextResponse.json(
        { error: "This is your own squad listing." },
        { status: 400 }
      );
    }

    // Resolve buyer profile phone/name if logged in
    let resolvedBuyerPhone = "";
    let resolvedBuyerName = String(buyerName || "").trim();

    if (buyerPhone && String(buyerPhone).trim().length >= 9) {
      const norm = normalizePhoneNumber(String(buyerPhone));
      if (norm.isValid) {
        resolvedBuyerPhone = norm.international;
      }
    }

    if (user) {
      const { data: buyerProf } = await adminSupabase
        .from("profiles")
        .select("username, first_name, phone_number")
        .eq("id", user.id)
        .maybeSingle();

      if (!resolvedBuyerPhone && buyerProf?.phone_number) {
        const norm = normalizePhoneNumber(buyerProf.phone_number);
        resolvedBuyerPhone = norm.isValid ? norm.international : buyerProf.phone_number;
      }
      if (!resolvedBuyerName) {
        resolvedBuyerName =
          buyerProf?.username ||
          buyerProf?.first_name ||
          user.email?.split("@")[0] ||
          "Verified Buyer";
      }
    }

    if (!resolvedBuyerName) {
      resolvedBuyerName = "Interested Buyer";
    }

    // Anti-spam: reuse a pending ping from the same buyer/phone on the same listing within 15 minutes
    const fifteenMinAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
    let existingQuery = adminSupabase
      .from("availability_pings")
      .select("id, listing_id, status, created_at")
      .eq("listing_id", listing.id)
      .eq("status", "pending")
      .gte("created_at", fifteenMinAgo)
      .limit(1);

    if (user?.id) {
      existingQuery = existingQuery.eq("buyer_id", user.id);
    } else if (resolvedBuyerPhone) {
      existingQuery = existingQuery.eq("buyer_phone", resolvedBuyerPhone);
    } else {
      existingQuery = null as any;
    }

    if (existingQuery) {
      const { data: dupPing } = await existingQuery.maybeSingle();
      if (dupPing) {
        return NextResponse.json({
          success: true,
          alreadyNotified: true,
          ping: dupPing,
          message:
            "Seller has already been notified on their phone! We will alert you the moment they confirm.",
        });
      }
    }

    // Insert new availability ping
    const { data: createdPing, error: insertErr } = await adminSupabase
      .from("availability_pings")
      .insert({
        listing_id: listing.id,
        seller_id: listing.seller_id,
        buyer_id: user?.id || null,
        buyer_name: resolvedBuyerName.slice(0, 80),
        buyer_phone: resolvedBuyerPhone || null,
        status: "pending",
      })
      .select("id, listing_id, status, created_at")
      .single();

    if (insertErr || !createdPing) {
      console.error("Availability ping insert error:", insertErr?.message);
      return NextResponse.json(
        { error: "Could not send notification right now. Please try again." },
        { status: 500 }
      );
    }

    const sellerObj: any = Array.isArray(listing.seller) ? listing.seller[0] : listing.seller;
    const priceLabel = `KES ${Number(listing.price).toLocaleString()}`;
    const sellerHubUrl = "https://www.efootballmarket.co.ke/dashboard/seller";

    // 1. Direct In-App + Native Phone Browser Push Notification to Seller
    try {
      await adminSupabase.from("notifications").insert({
        recipient_id: listing.seller_id,
        type: "availability_check",
        title: `Buyer Asking: Is "${listing.title}" Available?`,
        message: `${resolvedBuyerName} is ready to buy (${priceLabel} via Escrow) and tapped to check if this squad is still available. Tap to confirm Yes or Sold!`,
        action_url: "/dashboard/seller",
        is_read: false,
      });
    } catch (e) {
      console.warn("Seller availability in-app notification note:", e);
    }

    // 2. Direct Phone SMS Notification to Seller
    if (sellerObj?.phone_number) {
      sendSmsAlert({
        toPhone: sellerObj.phone_number,
        message: `[eFootballMarket] A buyer is ready to pay ${priceLabel} via Escrow for "${listing.title.slice(
          0,
          45
        )}". Is it still available? Tap YES or Sold: ${sellerHubUrl}`,
      }).catch((err) => console.warn("Seller availability SMS note:", err));
    }

    // 3. Direct Mobile Email Notification to Seller via Resend
    if (sellerObj?.email) {
      sendTransactionalEmail({
        to: sellerObj.email,
        subject: `Buyer Ready (${priceLabel}): Is "${listing.title}" still available?`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px; background: #0b1120; color: #f8fafc; border-radius: 16px;">
            <h2 style="margin: 0 0 12px; color: #10b981; font-size: 18px;">Buyer Checking Squad Availability</h2>
            <p style="font-size: 14px; line-height: 1.6; color: #cbd5e1; margin: 0 0 16px;">
              <strong>${resolvedBuyerName}</strong> wants to purchase <strong>${listing.title}</strong> for <strong>${priceLabel}</strong> via Safaricom M-Pesa Escrow (Till 1572931) and tapped to check if the account is ready for handover.
            </p>
            <a href="${sellerHubUrl}" style="display: inline-block; background: #059669; color: #ffffff; text-decoration: none; font-weight: 700; font-size: 14px; padding: 12px 22px; border-radius: 10px;">
              Tap to Confirm Available or Mark Sold &rarr;
            </a>
          </div>
        `,
        text: `${resolvedBuyerName} wants to buy "${listing.title}" (${priceLabel}) and asked if it is still available. Confirm in Seller Hub: ${sellerHubUrl}`,
      }).catch(() => {});
    }

    // 4. Instant Admin Alert with Direct WhatsApp Links for BOTH Seller and Buyer + Admin In-App Notification
    dispatchAdminWhatsAppAlert({
      eventType: "AVAILABILITY_PING",
      listingTitle: listing.title,
      amount: Number(listing.price),
      currency: listing.currency || "KES",
      username: sellerObj?.username || "seller",
      sellerPhone: sellerObj?.phone_number || undefined,
      buyerPhone: resolvedBuyerPhone || undefined,
      details: `${resolvedBuyerName} tapped to confirm squad availability.`,
    }).catch(() => {});

    try {
      const { data: adminProfiles } = await adminSupabase
        .from("profiles")
        .select("id")
        .in("role", ["admin", "super_admin"])
        .limit(5);

      if (adminProfiles && adminProfiles.length > 0) {
        await adminSupabase.from("notifications").insert(
          adminProfiles
            .filter((a: any) => a.id !== listing.seller_id)
            .map((a: any) => ({
              recipient_id: a.id,
              type: "admin_availability_ping",
              title: `Availability Ping: ${listing.title}`,
              message: `${resolvedBuyerName} pinged @${sellerObj?.username || "seller"} (${priceLabel}). Open Admin -> Listings to reach either party on WhatsApp directly.`,
              action_url: "/admin?tab=listings",
              is_read: false,
            }))
        );
      }
    } catch {
      // non-blocking
    }

    return NextResponse.json({
      success: true,
      ping: createdPing,
      message:
        "Seller notified directly on their phone! You'll get an instant alert the moment they confirm availability.",
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Could not notify seller." },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const userSupabase = createServerSupabaseClient();
    const {
      data: { user },
    } = await userSupabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { pingId, status, sellerNote } = body;

    if (!pingId || !UUID_REGEX.test(String(pingId)) || !["available", "unavailable"].includes(status)) {
      return NextResponse.json({ error: "Invalid availability update." }, { status: 400 });
    }

    const adminSupabase = getClient();
    const { data: callerProf } = await adminSupabase
      .from("profiles")
      .select("role, is_suspended")
      .eq("id", user.id)
      .maybeSingle();

    const callerIsAdmin = isUserAdmin(user.email, callerProf?.role, callerProf?.is_suspended);

    const { data: existingPing } = await adminSupabase
      .from("availability_pings")
      .select(
        "*, listing:listings(id, title, price, currency, status), buyer:profiles!buyer_id(id, email, phone_number)"
      )
      .eq("id", pingId)
      .single();

    if (!existingPing) {
      return NextResponse.json({ error: "Availability request not found." }, { status: 404 });
    }

    if (existingPing.seller_id !== user.id && !callerIsAdmin) {
      return NextResponse.json(
        { error: "Only the squad seller or an administrator can respond." },
        { status: 403 }
      );
    }

    const nowIso = new Date().toISOString();
    const cleanNote = sellerNote ? String(sellerNote).trim().slice(0, 200) : null;

    // Update all pending pings on this listing so every waiting buyer gets the answer immediately!
    const { data: updatedPings, error: updErr } = await adminSupabase
      .from("availability_pings")
      .update({
        status,
        seller_note: cleanNote,
        responded_at: nowIso,
        updated_at: nowIso,
      })
      .eq("listing_id", existingPing.listing_id)
      .eq("status", "pending")
      .select("id, buyer_id, buyer_phone, buyer_name");

    if (updErr) {
      return NextResponse.json({ error: updErr.message }, { status: 500 });
    }

    // If seller says unavailable, archive the listing so nobody pays for an unavailable account
    if (status === "unavailable" && existingPing.listing?.status === "published") {
      await adminSupabase
        .from("listings")
        .update({ status: "archived", updated_at: nowIso })
        .eq("id", existingPing.listing_id);
    } else if (status === "available") {
      await adminSupabase
        .from("listings")
        .update({ updated_at: nowIso })
        .eq("id", existingPing.listing_id);
    }

    const listingTitle = existingPing.listing?.title || "eFootball Squad";
    const priceLabel = `KES ${Number(existingPing.listing?.price || 0).toLocaleString()}`;
    const payUrl = `https://www.efootballmarket.co.ke/pay/${existingPing.listing_id}`;

    const recipientsToNotify =
      updatedPings && updatedPings.length > 0 ? updatedPings : [existingPing];

    for (const target of recipientsToNotify) {
      // 1. In-App + Phone Browser Push to Buyer
      if (target.buyer_id) {
        try {
          await adminSupabase.from("notifications").insert({
            recipient_id: target.buyer_id,
            type: "availability_confirmed",
            title:
              status === "available"
                ? `Confirmed Available: "${listingTitle}"!`
                : `Squad Unavailable: "${listingTitle}"`,
            message:
              status === "available"
                ? `Seller confirmed this squad (${priceLabel}) is ready now! Tap to complete M-Pesa Till 1572931 Escrow checkout.`
                : `Seller marked this squad as no longer available. Tap to browse other active verified squads.`,
            action_url:
              status === "available" ? `/pay/${existingPing.listing_id}` : "/browse",
            is_read: false,
          });
        } catch {
          // non-blocking
        }
      }

      // 2. Direct Phone SMS to Buyer
      if (target.buyer_phone) {
        sendSmsAlert({
          toPhone: target.buyer_phone,
          message:
            status === "available"
              ? `[eFootballMarket] Good news! Seller confirmed "${listingTitle.slice(
                  0,
                  40
                )}" (${priceLabel}) IS AVAILABLE now! Pay safely via Till 1572931 Escrow: ${payUrl}`
              : `[eFootballMarket] Seller confirmed "${listingTitle.slice(
                  0,
                  40
                )}" is no longer available. Browse active squads: https://www.efootballmarket.co.ke/browse`,
        }).catch(() => {});
      }
    }

    return NextResponse.json({
      success: true,
      status,
      message:
        status === "available"
          ? "Buyer notified on their phone that your squad is available!"
          : "Buyer notified and listing archived from active browse.",
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
