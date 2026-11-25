import { decryptCredential, encryptCredential } from "@/lib/encryption/crypto";
import { dispatchAdminWhatsAppAlert } from "@/lib/notifications/adminAlert";
import { sendBuyerCredentialsDeliveredWhatsApp, sendSellerFundsReleasedWhatsApp } from "@/lib/whatsapp/notifications";
import { AccountDelivery, EscrowAccount, EscrowState } from "@/types/database";
import { SupabaseClient } from "@supabase/supabase-js";

export class SecureEscrowReleaseUnavailableError extends Error {
  constructor() {
    super("Secure escrow release is temporarily unavailable. No ledger fallback was attempted; contact support.");
    this.name = "SecureEscrowReleaseUnavailableError";
  }
}

export class SecureEscrowDisputeUnavailableError extends Error {
  constructor() {
    super("Secure dispute handling is temporarily unavailable. No balance update was attempted; contact support.");
    this.name = "SecureEscrowDisputeUnavailableError";
  }
}

export interface OpenEscrowDisputeResult {
  disputeId: string;
  orderId: string;
  buyerId: string;
  sellerId: string;
  orderNumber: string;
  wasCompleted: boolean;
  description: string;
  listingTitle: string | null;
  idempotent: boolean;
}

export interface DeliverySubmissionPayload {
  orderId: string;
  sellerId: string;
  konamiEmail: string;
  konamiPassword: string;
  backupCodes?: string;
  transferInstructions?: string;
  sellerIp?: string;
}

export interface DecryptedCredentials {
  konamiEmail: string;
  konamiPassword: string;
  backupCodes: string | null;
  transferInstructions: string | null;
  deliveredAt: string;
}

/** Share of the seller's net amount paid at confirmation. */
export const RECALL_INITIAL_RELEASE_PCT = 0.8;

/**
 * Days the remainder stays held after confirmation. PlayerSells allows 30,
 * G2G 14, Eldorado 5-14, PlayerAuctions 7/14/30. Seven is the shortest window
 * that still covers the "sold it, waited a week, recovered it" pattern.
 */
export const RECALL_WINDOW_DAYS = 7;

export class EscrowService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Helper to verify if a user has admin privileges via user_roles or profiles.
   */
  private async checkIsAdmin(userId: string): Promise<boolean> {
    try {
      const { data: userRoles } = await this.supabase
        .from("user_roles")
        .select("role_id")
        .eq("user_id", userId)
        .in("role_id", ["admin", "super_admin"])
        .limit(1);

      if (userRoles && userRoles.length > 0) {
        return true;
      }
    } catch {
      // Ignore error if user_roles table is being queried
    }

    try {
      const { data: profile } = await this.supabase
        .from("profiles")
        .select("role")
        .eq("id", userId)
        .single();

      if (profile && (profile.role === "admin" || profile.role === "super_admin")) {
        return true;
      }
    } catch {
      // Ignore if profiles doesn't have role column
    }

    return false;
  }

  /**
   * Seller submits account credentials. Sensitive payload is encrypted via AES-256-GCM.
   */
  async submitDelivery(payload: DeliverySubmissionPayload): Promise<void> {
    const { orderId, sellerId, konamiEmail, konamiPassword, backupCodes, transferInstructions, sellerIp } = payload;

    // Verify order exists
    const { data: order, error: orderError } = await this.supabase
      .from("orders")
      .select("id, seller_id, buyer_id, order_number, status, total_amount, listing:listings(title)")
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      throw new Error("Order not found.");
    }

    // Verify ownership: seller or admin
    if (order.seller_id !== sellerId) {
      const isAdmin = await this.checkIsAdmin(sellerId);
      if (!isAdmin) {
        throw new Error("Unauthorized. Only the assigned seller can deliver credentials.");
      }
    }

    // Only allow delivery when escrow is locked or previously delivered (updating credentials)
    if (order.status !== "escrow_locked" && order.status !== "seller_delivered") {
      throw new Error(`Cannot deliver credentials when order is in '${order.status}' status. Escrow must be locked.`);
    }

    // Encrypt credentials
    const encryptedEmail = encryptCredential(konamiEmail);
    const encryptedPassword = encryptCredential(konamiPassword);
    const encryptedBackup = backupCodes ? encryptCredential(backupCodes) : null;

    // Save or update delivery in vault
    const { error: deliveryError } = await this.supabase
      .from("account_deliveries")
      .upsert(
        {
          order_id: orderId,
          encrypted_konami_email: encryptedEmail,
          encrypted_konami_password: encryptedPassword,
          encrypted_backup_codes: encryptedBackup,
          transfer_instructions: transferInstructions || null,
          seller_ip: sellerIp || null,
          delivered_at: new Date().toISOString(),
        },
        { onConflict: "order_id" }
      );

    if (deliveryError) {
      console.error("Failed to save delivery credentials:", deliveryError.message);
      throw new Error("Failed to save delivery credentials securely. Please retry.");
    }

    // 24-hour inspection window deadline
    const inspectionDeadline = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    // Update escrow state
    const { error: escrowStateError } = await this.supabase
      .from("escrow_accounts")
      .update({
        escrow_state: "seller_delivered",
        inspection_deadline: inspectionDeadline,
        delivered_at: new Date().toISOString(),
      })
      .eq("order_id", orderId);

    if (escrowStateError) {
      console.error("Failed to advance escrow to seller_delivered:", escrowStateError.message);
      throw new Error("Credentials saved but the escrow ledger could not be advanced.");
    }

    // Update order status.
    //
    // CRITICAL FIX: this update previously also set `inspection_deadline_at`,
    // which does NOT exist on public.orders (the table has 12 columns; the
    // deadline lives on escrow_accounts.inspection_deadline). PostgREST
    // rejected the whole statement with 42703, and because the error was never
    // checked the order silently stayed in `escrow_locked` while escrow sat in
    // `seller_delivered`. That split brain meant release_escrow_funds() then
    // refused every release ("Order and escrow are not in a releasable state"),
    // so no seller could ever be paid automatically.
    const { error: orderUpdateError } = await this.supabase
      .from("orders")
      .update({
        status: "seller_delivered",
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId);

    if (orderUpdateError) {
      console.error("Failed to advance order to seller_delivered:", orderUpdateError.message);
      throw new Error("Credentials saved but the order could not be advanced. Please retry.");
    }

    // Notify buyer that credentials are ready for inspection
    if (order.buyer_id) {
      try {
        await this.supabase.from("notifications").insert({
          recipient_id: order.buyer_id,
          type: "order_update",
          title: "Account Credentials Delivered!",
          message: `Seller has securely delivered the Konami ID credentials for order #${order.order_number}. Please inspect the account and confirm receipt within 24 hours.`,
          action_url: `/orders/${orderId}`,
          is_read: false,
        });

        // Buyer credentials-delivered WhatsApp notice removed with the WhatsApp
        // transport. The profile lookup that fed it is gone too: a SELECT plus
        // an if-block whose only purpose was to call a function that cannot
        // send was pure latency on the escrow release path.
        //
        // The in-app insert above is now the buyer's only signal on this path.
        // There is no email here. If WhatsApp stays off, this is where a
        // resend notice belongs.
      } catch (notifErr) {
        console.warn("Failed to notify buyer:", notifErr);
      }
    }

    // Dispatch automated WhatsApp alert to admin support desk
    dispatchAdminWhatsAppAlert({
      eventType: "CREDENTIALS_DELIVERED",
      orderId,
      orderNumber: order.order_number,
      listingTitle: (order as any)?.listing?.title || "eFootball Squad",
      amount: Number(order.total_amount) || 0,
    }).catch((err) => console.error("Admin credentials delivered alert error:", err));
  }

  /**
   * Strictly decrypts credentials for authorized order parties or admin.
   * Enforces status checks, lockout rules, audit logging, and retention checks.
   */
  async revealCredentials(orderId: string, requesterId: string): Promise<DecryptedCredentials> {
    const { data: order } = await this.supabase
      .from("orders")
      .select("id, buyer_id, seller_id, order_number, status")
      .eq("id", orderId)
      .single();

    if (!order) {
      throw new Error("Order not found.");
    }

    const isBuyer = order.buyer_id === requesterId;
    const isSeller = order.seller_id === requesterId;
    let isAdmin = false;

    if (!isBuyer && !isSeller) {
      isAdmin = await this.checkIsAdmin(requesterId);
      if (!isAdmin) {
        throw new Error("Unauthorized access to account credentials.");
      }
    }

    // Access Control Defect Fix 1: Disallow revealing credentials for cancelled or refunded orders
    if (order.status === "cancelled" || order.status === "refunded") {
      throw new Error("Credentials cannot be accessed for cancelled or refunded orders.");
    }

    // Access Control Defect Fix 2: Disallow revealing credentials prior to seller delivery
    if (
      order.status === "payment_pending" ||
      (order.status as string) === "pending_payment" ||
      order.status === "escrow_locked"
    ) {
      throw new Error("Credentials have not been delivered for inspection yet.");
    }

    // Access Control Defect Fix 3: Lock out seller once order is completed
    if (isSeller && order.status === "completed") {
      throw new Error("Access expired. Order is completed and account ownership has transferred.");
    }

    // Access Control Defect Fix 4: Audit log for administrative decryption access (never logging credentials)
    if (isAdmin && !isBuyer && !isSeller) {
      try {
        await this.supabase.from("audit_logs").insert({
          actor_id: requesterId,
          action: "ADMIN_CREDENTIAL_REVEAL",
          resource_type: "account_deliveries",
          resource_id: orderId,
          changes: {
            order_id: orderId,
            order_number: order.order_number,
            order_status: order.status,
            accessed_at: new Date().toISOString(),
          },
        });
      } catch (auditErr) {
        console.error("Failed to write credential reveal audit log:", (auditErr as Error)?.message || "Unknown error");
      }
    }

    const { data: delivery, error } = await this.supabase
      .from("account_deliveries")
      .select("*")
      .eq("order_id", orderId)
      .single();

    if (error || !delivery) {
      throw new Error("Credentials have not been delivered by the seller yet.");
    }

    // Purged / Null Check: Handle cases where credentials have been purged under retention policy
    if (!delivery.encrypted_konami_email || !delivery.encrypted_konami_password) {
      throw new Error("Account credentials have expired and were purged from the vault.");
    }

    return {
      konamiEmail: decryptCredential(delivery.encrypted_konami_email),
      konamiPassword: decryptCredential(delivery.encrypted_konami_password),
      backupCodes: delivery.encrypted_backup_codes ? decryptCredential(delivery.encrypted_backup_codes) : null,
      transferInstructions: delivery.transfer_instructions,
      deliveredAt: delivery.delivered_at,
    };
  }

  /**
   * Buyer confirms receipt and releases funds to seller.
   */
  async confirmAndRelease(orderId: string, buyerId: string): Promise<void> {
    const { data: order } = await this.supabase
      .from("orders")
      .select("id, buyer_id, seller_id, order_number, listing_id, status, total_amount, seller_net_amount, listing:listings(title)")
      .eq("id", orderId)
      .single();

    if (!order) {
      throw new Error("Order not found.");
    }

    if (order.buyer_id !== buyerId) {
      const isAdmin = await this.checkIsAdmin(buyerId);
      if (!isAdmin) {
        throw new Error("Unauthorized. Only the buyer can confirm release.");
      }
    }

    const isCallerAdmin =
      order.buyer_id !== buyerId ? await this.checkIsAdmin(buyerId) : false;

    const releasableStatuses = isCallerAdmin
      ? ["seller_delivered", "buyer_reviewing", "escrow_locked"]
      : ["seller_delivered", "buyer_reviewing"];

    if (!releasableStatuses.includes(order.status)) {
      throw new Error(
        `Cannot release funds while order is in '${order.status}' status. Payment must be locked and credentials delivered first.`
      );
    }

    // Confirmation no longer pays the seller in full. It releases the initial
    // portion (80% by default) and opens a recall window; the remainder stays in
    // the seller's escrow balance until that window closes with no upheld claim.
    //
    // Rationale is in COMPETITOR-RESEARCH.md: seller recovers the Konami ID on
    // day 20 after being paid on day 2 was the single most common fraud in this
    // category, and every comparable marketplace holds a post-sale window.
    // release_escrow_funds is left in place and untouched for any admin path
    // that still needs a one-shot release on a legacy order.
    try {
      const { error: rpcError } = await this.supabase.rpc("confirm_and_open_recall_window", {
        p_order_id: orderId,
        p_performed_by: buyerId,
        p_initial_release_pct: RECALL_INITIAL_RELEASE_PCT,
        p_window_days: RECALL_WINDOW_DAYS,
      });

      if (rpcError) {
        console.error("Secure escrow release RPC failed; no direct ledger fallback was attempted.");
        throw new SecureEscrowReleaseUnavailableError();
      }
    } catch (error) {
      if (error instanceof SecureEscrowReleaseUnavailableError) throw error;
      console.error("Secure escrow release RPC could not be reached; no direct ledger fallback was attempted.");
      throw new SecureEscrowReleaseUnavailableError();
    }

    // Set buyer_confirmed_at on account_deliveries
    await this.supabase
      .from("account_deliveries")
      .update({ buyer_confirmed_at: new Date().toISOString() })
      .eq("order_id", orderId);

    // Dispatch external SMS & WhatsApp notification to seller
    try {
      const { data: sellerProf } = await this.supabase
        .from("profiles")
        .select("phone_number")
        .eq("id", order.seller_id)
        .single();

      if (sellerProf?.phone_number) {
        sendSellerFundsReleasedWhatsApp(
          sellerProf.phone_number,
          order.order_number,
          Number(order.seller_net_amount || order.total_amount || 0)
        ).catch((e) => console.warn("Seller funds released WhatsApp notice:", e));

      }
    } catch (e) {
      console.warn("Failed to send seller payout alert:", e);
    }

    // Dispatch automated WhatsApp alert to admin support desk
    dispatchAdminWhatsAppAlert({
      eventType: "ESCROW_RELEASED",
      orderId,
      orderNumber: order.order_number,
      listingTitle: (order as any)?.listing?.title || "eFootball Squad",
      amount: Number(order.seller_net_amount || order.total_amount || 0),
    }).catch((err) => console.error("Admin escrow released alert error:", err));
  }

  /**
   * Opens a dispute and pauses a pre-release order in one database transaction.
   * Post-release reports never move seller balances automatically.
   */
  async openDispute(
    orderId: string,
    openedBy: string,
    reason: string,
    description: string
  ): Promise<OpenEscrowDisputeResult> {
    const { data: order, error: orderError } = await this.supabase
      .from("orders")
      .select("id, buyer_id, seller_id")
      .eq("id", orderId)
      .maybeSingle();

    if (orderError || !order) {
      throw new Error("Order not found.");
    }

    if (order.buyer_id !== openedBy && order.seller_id !== openedBy) {
      const isAdmin = await this.checkIsAdmin(openedBy);
      if (!isAdmin) {
        throw new Error("Unauthorized to dispute this order.");
      }
    }

    const cleanDescription = description
      .replace(/^\[POST-RELEASE DISPUTE\]\s*/i, "")
      .trim();
    if (cleanDescription.length < 10) {
      throw new Error("Please provide a detailed description of the dispute.");
    }

    let rpcResult: any;
    try {
      const { data, error } = await this.supabase.rpc("open_escrow_dispute", {
        p_order_id: orderId,
        p_opened_by: openedBy,
        p_reason: reason,
        p_description: cleanDescription,
      });
      if (error) throw error;
      rpcResult = data;
    } catch (error: any) {
      if (error?.code === "P0001" && typeof error.message === "string") {
        throw new Error(error.message);
      }
      console.error("Atomic escrow dispute RPC failed; no direct balance update was attempted.");
      throw new SecureEscrowDisputeUnavailableError();
    }

    if (
      !rpcResult?.dispute_id ||
      !rpcResult?.order_id ||
      !rpcResult?.buyer_id ||
      !rpcResult?.seller_id ||
      !rpcResult?.order_number ||
      typeof rpcResult.description !== "string" ||
      typeof rpcResult.was_completed !== "boolean" ||
      typeof rpcResult.idempotent !== "boolean"
    ) {
      console.error("Atomic escrow dispute RPC returned an invalid result.");
      throw new SecureEscrowDisputeUnavailableError();
    }

    const result: OpenEscrowDisputeResult = {
      disputeId: rpcResult.dispute_id,
      orderId: rpcResult.order_id,
      buyerId: rpcResult.buyer_id,
      sellerId: rpcResult.seller_id,
      orderNumber: rpcResult.order_number,
      wasCompleted: rpcResult.was_completed,
      description: rpcResult.description,
      listingTitle: rpcResult.listing_title || null,
      idempotent: Boolean(rpcResult.idempotent),
    };

    if (!result.idempotent) {
      const otherPartyId = openedBy === result.buyerId ? result.sellerId : result.buyerId;
      if (otherPartyId) {
        try {
          const { error: notificationError } = await this.supabase.from("notifications").insert({
            recipient_id: otherPartyId,
            type: "order_update",
            title: result.wasCompleted ? "Post-Release Dispute Review Opened" : "Escrow Dispute Opened",
            message: result.wasCompleted
              ? `A post-release dispute was opened for order #${result.orderNumber}. Moderators will review the evidence. This does not automatically hold seller funds or reverse an M-Pesa transfer already sent; any reimbursement is a separate manual decision.`
              : `A dispute was opened for order #${result.orderNumber}. Seller-balance release is paused while a moderator reviews the case.`,
            action_url: `/orders/${orderId}`,
            is_read: false,
          });
          if (notificationError) console.warn("Failed to record dispute notification.");
        } catch {
          console.warn("Failed to send dispute notification.");
        }
      }

      dispatchAdminWhatsAppAlert({
        eventType: result.wasCompleted ? "POST_RELEASE_DISPUTE_OPENED" : "DISPUTE_OPENED",
        orderId,
        orderNumber: result.orderNumber,
        listingTitle: result.listingTitle || "eFootball Squad",
        details: `${reason}: ${result.description}`,
      }).catch(() => console.warn("Admin dispute alert dispatch failed."));
    }

    return result;
  }

  /**
   * Buyer reports that the account was taken back by the seller.
   *
   * This never moves money. It freezes the held portion and puts the order in
   * front of an admin, which is the whole point: the window exists so a report
   * arrives while funds are still recoverable.
   */
  async openRecallClaim(params: {
    orderId: string;
    claimantId: string;
    description: string;
    evidenceUrls?: string[];
    konamiNoticeReference?: string;
  }): Promise<string> {
    const { data, error } = await this.supabase.rpc("open_account_recall_claim", {
      p_order_id: params.orderId,
      p_claimant_id: params.claimantId,
      p_description: params.description,
      p_evidence_urls: params.evidenceUrls ?? [],
      p_konami_notice_reference: params.konamiNoticeReference ?? null,
    });

    if (error) {
      throw new Error(error.message || "Could not file the account-recovery report.");
    }
    return data as string;
  }

  /**
   * Releases the held remainder once the window has closed clean.
   * p_performed_by is null when the scheduled job is the caller; the RPC allows
   * that, and refuses a buyer trying to release their own held funds early.
   */
  async releaseRemainder(orderId: string, performedBy: string | null): Promise<void> {
    const { error } = await this.supabase.rpc("release_escrow_remainder", {
      p_order_id: orderId,
      p_performed_by: performedBy,
    });
    if (error) {
      throw new Error(error.message || "Could not release held funds.");
    }
  }
}
