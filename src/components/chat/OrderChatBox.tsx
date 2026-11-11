"use client";

import { MpesaPaymentModal } from "@/components/payments/MpesaPaymentModal";
import { Button } from "@/components/ui/Button";
import { detectProhibitedOffPlatformContent } from "@/lib/security/chatFilter";
import { formatCurrency } from "@/lib/utils";
import { Message, OrderStatus } from "@/types/database";
import { KonamiTransferChecklistModal } from "@/components/escrow/KonamiTransferChecklistModal";
import {
  AlertTriangle,
  Check,
  Copy,
  Lock,
  Send,
  Shield,
  ShieldCheck,
  Smartphone,
  X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useState, useEffect, useRef, useCallback } from "react";

export interface OrderChatBoxProps {
  conversationId: string;
  currentUserId: string;
  initialMessages: Message[];
  orderId?: string;
  orderNumber?: string;
  orderStatus?: OrderStatus | string;
  isBuyer?: boolean;
  counterpartyName?: string;
  totalAmount?: number;
  currency?: string;
  fullPage?: boolean;
  onPaymentSuccess?: () => void;
}

function extractVerificationCode(text: string): string | null {
  const match = text.match(/\b(\d{6})\b/);
  return match ? match[1] : null;
}

export function OrderChatBox({
  conversationId,
  currentUserId,
  initialMessages,
  orderId,
  orderNumber,
  orderStatus,
  isBuyer = false,
  counterpartyName,
  totalAmount,
  currency = "KES",
  fullPage = false,
  onPaymentSuccess,
}: OrderChatBoxProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [inputContent, setInputContent] = useState("");
  const [sending, setSending] = useState(false);
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);
  const [securityAlert, setSecurityAlert] = useState<{
    message: string;
    category?: string;
  } | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isPendingPayment = orderStatus === "payment_pending";

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Real-time synchronization: poll messages every 3500ms
  const pollMessages = useCallback(async () => {
    try {
      const res = await fetch(`/api/messages?conversationId=${conversationId}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.messages)) {
          setMessages((prev) => {
            if (
              data.messages.length !== prev.length ||
              (data.messages.length > 0 &&
                data.messages[data.messages.length - 1]?.id !==
                  prev[prev.length - 1]?.id)
            ) {
              return data.messages;
            }
            return prev;
          });
        }
      }
    } catch {
      // Non-blocking background sync
    }
  }, [conversationId]);

  // Instant Supabase Realtime subscription for sub-second chat updates
  useEffect(() => {
    let supabase: any = null;
    let channel: any = null;

    try {
      supabase = createClient();
      channel = supabase
        .channel(`chat-live-${conversationId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "messages",
            filter: `conversation_id=eq.${conversationId}`,
          },
          (payload: any) => {
            if (payload.new) {
              setMessages((prev) => {
                if (prev.some((m) => m.id === payload.new.id)) return prev;
                return [...prev, payload.new as Message];
              });
            }
          }
        )
        .subscribe();
    } catch (e) {
      console.warn("Realtime chat subscription note:", e);
    }

    return () => {
      if (channel && supabase) {
        supabase.removeChannel(channel).catch(() => {});
      }
    };
  }, [conversationId]);

  useEffect(() => {
    const interval = setInterval(pollMessages, 3500);
    return () => clearInterval(interval);
  }, [pollMessages]);

  const handleCopyOtp = (msgId: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCodeId(msgId);
    setTimeout(() => setCopiedCodeId(null), 2000);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputContent.trim() || sending) return;

    if (isPendingPayment) {
      setSecurityAlert({
        message: isBuyer
          ? "Escrow Payment Gate: Complete the Lipa Na M-Pesa deposit first to unlock seller messaging."
          : "Communication Locked: Waiting for buyer to fund escrow before messaging unlocks.",
      });
      return;
    }

    const content = inputContent.trim();

    const filterCheck = detectProhibitedOffPlatformContent(content);
    if (filterCheck.isBlocked) {
      setInputContent("");
      setSecurityAlert({
        message:
          filterCheck.userWarningMessage ||
          "Prohibited: Sharing off-platform contacts or external links inside order chat is blocked for escrow protection.",
        category: filterCheck.matchedCategory,
      });
      return;
    }

    setSending(true);
    setSecurityAlert(null);
    setInputContent("");

    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId,
          content,
          messageType: "text",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setSecurityAlert({
          message:
            data.userWarningMessage ||
            data.error ||
            "Message was blocked by security audit.",
          category: data.category,
        });
        return;
      }

      if (data.success && data.message) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === data.message.id)) return prev;
          return [...prev, data.message];
        });
      }
    } catch (err) {
      console.error("Failed to send message:", err);
    } finally {
      setSending(false);
    }
  };

  const quickChips = isBuyer
    ? [
        {
          label: "Request Login Code",
          text: "Please send the Konami login verification code",
          tone: "default",
        },
        {
          label: "Request Email Change Code",
          text: "I requested email change on my.konami.net, please send the 6-digit confirmation code",
          tone: "default",
        },
        {
          label: "Updated Email & 2FA!",
          text: "I have updated both password, email, and 2FA to my own!",
          tone: "default",
        },
        {
          label: "Confirm No Google/Apple Link",
          text: "Please confirm Google Play and Apple Game Center are NOT linked to this squad",
          tone: "alert",
        },
      ]
    : [
        {
          label: "Checking Email for OTP...",
          text: "Checking my email for the Konami 6-digit code right now...",
          tone: "default",
        },
        {
          label: "Send OTP Code",
          text: "Your Konami 6-digit verification code is: ",
          tone: "default",
        },
        {
          label: "Prompt Buyer Email Change",
          text: "Please update the registered email & 2FA at my.konami.net and let me know if another code arrives",
          tone: "default",
        },
        {
          label: "Confirm Clean Konami ID",
          text: "Confirmed: this squad is Clean Konami ID only (Google Play & Game Center are Not Linked)",
          tone: "safe",
        },
      ];

  return (
    <div
      className={`rounded-2xl bg-sx-subtle border border-sx-border flex flex-col overflow-hidden shadow-sm ${
        fullPage
          ? "h-[calc(100dvh-185px)] min-h-[520px] max-h-[820px]"
          : "h-[540px]"
      }`}
    >
      {/* Chat Header */}
      <div className="px-4 sm:px-6 py-3.5 border-b border-sx-border bg-sx-canvas flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div
            className={`w-2.5 h-2.5 rounded-full shrink-0 ${
              isPendingPayment ? "bg-amber-500" : "bg-emerald-500 animate-pulse"
            }`}
          />
          <div>
            <h2 className="text-xs sm:text-sm font-bold text-sx-ink font-display">
              {isPendingPayment
                ? "Order Chat (Locked Until Escrow Funded)"
                : counterpartyName
                ? `Encrypted Order Chat with @${counterpartyName}`
                : "Encrypted Order Handover Chat"}
            </h2>
            <p className="text-[11px] text-sx-muted hidden sm:block">
              All messages &amp; 6-digit Konami OTPs are logged for Safaricom Till 1572931 escrow protection.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsGuideOpen(true)}
            className="text-xs text-sx-green-text flex items-center gap-1.5 font-semibold bg-sx-green-tint hover:bg-sx-green-tint/80 border border-sx-green-border px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
          >
            <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
            <span>Handover Guide</span>
          </button>
          <span className="text-[11px] text-sx-muted hidden md:inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sx-stone border border-sx-border">
            <Shield className="w-3.5 h-3.5 text-sx-green-text" />
            <span>Audited</span>
          </span>
        </div>
      </div>

      {/* Slim Anti-Googling Safety Reminder */}
      <div className="px-4 sm:px-6 py-2 bg-sx-red-tint border-b border-sx-red-border flex items-center gap-2 text-xs text-sx-red-text">
        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
        <span>
          <strong>Safety Rule:</strong> Always check{" "}
          <em>Extras &rarr; Support &rarr; Link Data</em> to confirm Google Play &amp; Game Center say{" "}
          <strong>Not Linked</strong> before releasing funds.
        </span>
      </div>

      {/* Spacious Message Stream */}
      <div className="flex-1 px-4 sm:px-6 py-5 overflow-y-auto space-y-4 bg-sx-canvas/50">
        {messages.map((msg) => {
          const isMe = msg.sender_id === currentUserId;
          const isSystem = msg.message_type === "system";
          const otpCode = !isSystem ? extractVerificationCode(msg.content) : null;

          if (isSystem) {
            return (
              <div key={msg.id} className="text-center my-3">
                <span className="inline-block text-xs text-sx-muted bg-sx-stone border border-sx-border px-4 py-1.5 rounded-full leading-relaxed max-w-lg">
                  {msg.content}
                </span>
              </div>
            );
          }

          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
            >
              <div
                className={`max-w-[85%] sm:max-w-[70%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
                  isMe
                    ? "bg-sx-green text-white rounded-br-sm"
                    : "bg-sx-stone border border-sx-border text-sx-ink rounded-bl-sm"
                }`}
              >
                <p className="whitespace-pre-line leading-relaxed break-words">
                  {msg.content}
                </p>

                {otpCode && (
                  <button
                    type="button"
                    onClick={() => handleCopyOtp(msg.id, otpCode)}
                    className={`mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono font-bold transition-colors cursor-pointer ${
                      isMe
                        ? "bg-black/20 hover:bg-black/30 text-white"
                        : "bg-sx-canvas hover:bg-sx-elevated border border-sx-border text-sx-green-text"
                    }`}
                  >
                    {copiedCodeId === msg.id ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Copied {otpCode}</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy OTP: {otpCode}</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              <span className="text-[11px] text-sx-muted mt-1 px-1">
                {isMe ? "You" : counterpartyName ? `@${counterpartyName}` : "Partner"} ·{" "}
                {new Date(msg.created_at).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Security Warning Banner */}
      {securityAlert && (
        <div className="mx-4 sm:mx-6 my-2 p-3 rounded-xl bg-sx-red-tint border border-sx-red-border text-sx-red-text text-xs flex items-start justify-between gap-2">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Security Notice</p>
              <p className="text-[11px] leading-relaxed mt-0.5">
                {securityAlert.message}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSecurityAlert(null)}
            className="p-1 rounded-lg hover:bg-black/10 shrink-0 cursor-pointer"
            aria-label="Dismiss warning"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Composer or Payment Gate */}
      {isPendingPayment ? (
        <div className="p-4 sm:p-5 border-t border-sx-border bg-sx-canvas space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-sx-amber-tint border border-sx-amber-border flex items-center justify-center text-sx-amber-text shrink-0">
              <Lock className="w-4 h-4" />
            </div>
            <div className="space-y-0.5">
              <p className="text-xs sm:text-sm font-bold text-sx-amber-text">
                {isBuyer
                  ? "Fund Escrow to Unlock Order Chat"
                  : "Waiting for Buyer Escrow Deposit"}
              </p>
              <p className="text-xs text-sx-muted leading-relaxed">
                {isBuyer
                  ? "Complete the M-Pesa deposit (Till 1572931) so we can lock your funds in escrow and open direct handover chat."
                  : "Chat unlocks automatically as soon as the buyer's M-Pesa deposit is confirmed in escrow."}
              </p>
            </div>
          </div>

          {isBuyer && orderId && totalAmount && (
            <Button
              type="button"
              variant="primary"
              size="md"
              onClick={() => setIsPaymentModalOpen(true)}
              className="w-full font-bold"
            >
              <Smartphone className="w-4 h-4" />
              <span>
                Pay {formatCurrency(totalAmount, currency)} via M-Pesa Escrow
              </span>
            </Button>
          )}
        </div>
      ) : (
        <div className="border-t border-sx-border bg-sx-canvas p-3 sm:p-4 space-y-3">
          {/* Clean Wrapping Quick-Action Pills (Never cut off!) */}
          <div className="flex flex-wrap items-center gap-1.5">
            {quickChips.map((chip) => (
              <button
                key={chip.label}
                type="button"
                onClick={() => setInputContent(chip.text)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                  chip.tone === "alert"
                    ? "bg-sx-red-tint border-sx-red-border text-sx-red-text hover:opacity-90"
                    : chip.tone === "safe"
                    ? "bg-sx-green-tint border-sx-green-border text-sx-green-text hover:opacity-90"
                    : "bg-sx-stone hover:bg-sx-elevated border-sx-border text-sx-ink"
                }`}
              >
                {chip.label}
              </button>
            ))}
          </div>

          <form
            onSubmit={handleSendMessage}
            className="flex items-center gap-2.5"
          >
            <input
              type="text"
              value={inputContent}
              onChange={(e) => {
                setInputContent(e.target.value);
                if (securityAlert) setSecurityAlert(null);
              }}
              placeholder="Type a message or paste 6-digit Konami OTP code..."
              className="flex-1 h-11 rounded-xl bg-sx-subtle border border-sx-border px-4 text-sm text-sx-ink placeholder:text-sx-muted focus:outline-none focus:border-sx-green"
            />
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={sending}
              disabled={!inputContent.trim()}
              className="h-11 px-5 shrink-0 font-bold"
            >
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">Send</span>
            </Button>
          </form>
        </div>
      )}

      {/* Payment Modal */}
      {orderId && (
        <MpesaPaymentModal
          orderId={orderId}
          orderNumber={orderNumber || ""}
          amount={totalAmount || 0}
          currency={currency}
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          onSuccess={() => {
            setIsPaymentModalOpen(false);
            if (onPaymentSuccess) {
              onPaymentSuccess();
            } else {
              window.location.reload();
            }
          }}
        />
      )}

      {/* Escrow Handover Guide Modal */}
      <KonamiTransferChecklistModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
      />
    </div>
  );
}
