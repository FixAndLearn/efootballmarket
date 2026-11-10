"use client";

import React, { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import {
  MessageCircle,
  X,
  ShieldCheck,
  RotateCcw,
  Send,
  HelpCircle,
  ChevronRight,
  ShieldAlert,
  KeyRound,
  PhoneCall,
  Coins,
  ArrowRight,
} from "lucide-react";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

interface QuickCard {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  query: string;
}

const QUICK_CARDS: QuickCard[] = [
  {
    id: "escrow",
    title: "How M-Pesa Payment Hold Works",
    description: "Till 1572931 deposit, 24h inspection, and seller payout.",
    icon: <ShieldCheck className="w-4 h-4 text-[#006340]" />,
    query: "How does the Safaricom M-Pesa Till 1572931 escrow process work from start to finish?",
  },
  {
    id: "antigoogle",
    title: "Check Google Play / Apple Link",
    description: "Where to verify that only Konami ID is linked.",
    icon: <ShieldAlert className="w-4 h-4 text-[#B45309]" />,
    query: "Why is an account with Google Play linked prohibited, and how do I verify it in-game?",
  },
  {
    id: "konami",
    title: "Change Konami Email & 2FA",
    description: "Steps to move the Konami ID to your own email.",
    icon: <KeyRound className="w-4 h-4 text-[#3D3D3D]" />,
    query: "How do I change the registered email and password on my.konami.net?",
  },
  {
    id: "otp",
    title: "Seller Slow to Send OTP",
    description: "What to do if the seller hasn't sent the email code.",
    icon: <HelpCircle className="w-4 h-4 text-[#3D3D3D]" />,
    query: "What should I do if the seller delivered credentials but is not sending the 2-step OTP verification code in chat?",
  },
  {
    id: "dispute",
    title: "Opening an Order Dispute",
    description: "How payout freezes while support checks evidence.",
    icon: <ShieldAlert className="w-4 h-4 text-[#C92A2A]" />,
    query: "How does raising a dispute work and how do refunds get processed?",
  },
  {
    id: "bargain",
    title: "Making a Price Offer",
    description: "How to negotiate with a seller before paying.",
    icon: <Coins className="w-4 h-4 text-[#3D3D3D]" />,
    query: "How do I bargain a price and make an offer to the seller?",
  },
];

const WHATSAPP_TOPICS = [
  {
    label: "M-Pesa Payment / STK Push Check",
    query: "Hello eFootballMarket Support, I need help checking an M-Pesa payment to Till 1572931.",
  },
  {
    label: "Konami ID Handover Assistance",
    query: "Hello eFootballMarket Support, I need help completing a Konami ID email transfer.",
  },
  {
    label: "Order Dispute or Seller Report",
    query: "Hello Support, I need assistance reviewing an active order dispute on eFootballMarket.",
  },
  {
    label: "General Marketplace Inquiry",
    query: "Hello eFootballMarket Support, I have a question about using the marketplace.",
  },
];

export function SupportHubWidget() {
  const pathname = usePathname() || "/";
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"help" | "whatsapp">("help");
  const [inputMessage, setInputMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const [selectedWhatsAppTopic, setSelectedWhatsAppTopic] = useState(WHATSAPP_TOPICS[0].label);
  const [customWhatsAppText, setCustomWhatsAppText] = useState("");

  const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "254794400365";

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "initial-help",
      role: "assistant",
      content:
        "Hi — need help with an M-Pesa order, checking Link Data, or changing a Konami ID email? Pick a common question below or type yours.",
      timestamp: "Support",
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && activeTab === "help") {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen, activeTab]);

  const isAuthRoute =
    pathname === "/login" ||
    pathname === "/register" ||
    pathname.startsWith("/forgot-password") ||
    pathname.startsWith("/reset-password") ||
    pathname.startsWith("/invite") ||
    pathname.startsWith("/auth");

  const isHighIntentRoute =
    pathname.startsWith("/orders/") ||
    pathname.startsWith("/pay/") ||
    pathname === "/seller/verification" ||
    pathname === "/seller/create-listing";

  if (isAuthRoute || isHighIntentRoute) {
    return null;
  }

  const isListingDetailPage = Boolean(pathname?.startsWith("/listings/") && pathname !== "/listings");

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || loading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage("");
    setLoading(true);

    try {
      const payloadMessages = [...messages, userMsg].map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: payloadMessages }),
      });

      if (!res.ok) {
        throw new Error("Failed to receive response");
      }

      const data = await res.json();
      const assistantMsg: ChatMessage = {
        id: `reply-${Date.now()}`,
        role: "assistant",
        content: data.reply || "Please select a topic or switch to the WhatsApp tab to message our support desk.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: "assistant",
        content:
          "Automated help is temporarily unavailable. Switch to the WhatsApp tab above to message support directly (+254 794 400 365).",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleResetChat = () => {
    setMessages([
      {
        id: "reset-help",
        role: "assistant",
        content:
          "Select a question below or type your message regarding M-Pesa orders, Konami ID transfers, or seller rules.",
        timestamp: "Support",
      },
    ]);
  };

  const handleLaunchWhatsApp = () => {
    const topicObj = WHATSAPP_TOPICS.find((t) => t.label === selectedWhatsAppTopic);
    const textToSend = customWhatsAppText.trim() || topicObj?.query || "Hello eFootballMarket Support!";
    const encoded = encodeURIComponent(textToSend);
    const url = `https://wa.me/${whatsappNumber}?text=${encoded}`;
    window.open(url, "_blank", "noopener,noreferrer");
    setIsOpen(false);
  };

  return (
    <>
      <div
        className={`fixed ${
          isListingDetailPage ? "bottom-[4.5rem]" : "bottom-20"
        } md:bottom-5 right-3 sm:right-5 z-40 select-none font-sans`}
      >
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          aria-label="Help and Support"
          className="flex items-center justify-center w-10 h-10 sm:w-auto sm:px-3.5 sm:py-2 rounded-lg bg-white hover:bg-[#F4F3F1] text-[#1F1F1F] font-medium text-xs shadow-xl border border-[#C8C8C4] transition-colors"
        >
          <HelpCircle className="w-4 h-4 text-[#006340]" />
          <span className="hidden sm:inline ml-2">Help &amp; Support</span>
        </button>
      </div>

      {isOpen && (
        <div
          className="fixed inset-0 bg-black/65 backdrop-blur-sm z-40 sm:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {isOpen && (
        <div
          className={`fixed inset-x-3 ${
            isListingDetailPage ? "bottom-[4.5rem]" : "bottom-20"
          } sm:inset-auto sm:bottom-16 sm:right-5 sm:w-[420px] h-[540px] max-h-[80vh] z-50 flex flex-col rounded-xl bg-white border border-[#E2E2E0] shadow-2xl overflow-hidden font-sans`}
        >
          <div className="p-3 bg-white border-b border-[#E2E2E0] flex items-center justify-between shrink-0">
            <div className="flex items-center gap-1 p-0.5 rounded-lg bg-[#F4F3F1] border border-[#E2E2E0]">
              <button
                type="button"
                onClick={() => setActiveTab("help")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  activeTab === "help"
                    ? "bg-[#EAE9E6] text-[#0F0F0F]"
                    : "text-[#5F5F5F] hover:text-[#1F1F1F]"
                }`}
              >
                <HelpCircle className="w-3.5 h-3.5 text-[#3D3D3D]" />
                <span>Quick Help</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("whatsapp")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  activeTab === "whatsapp"
                    ? "bg-[#EAE9E6] text-[#0F0F0F]"
                    : "text-[#5F5F5F] hover:text-[#1F1F1F]"
                }`}
              >
                <MessageCircle className="w-3.5 h-3.5 text-[#006340]" />
                <span>WhatsApp</span>
              </button>
            </div>

            <div className="flex items-center gap-1">
              {activeTab === "help" && (
                <button
                  type="button"
                  onClick={handleResetChat}
                  title="Reset chat"
                  className="p-1.5 rounded-lg text-[#5F5F5F] hover:text-[#0F0F0F] hover:bg-[#F4F3F1] transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                title="Close"
                className="p-1.5 rounded-lg text-[#5F5F5F] hover:text-[#0F0F0F] hover:bg-[#F4F3F1] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {activeTab === "help" ? (
            <div className="flex-1 flex flex-col min-h-0 bg-white">
              <div className="flex-1 overflow-y-auto p-3.5 space-y-3 text-xs">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-xl p-3 ${
                        msg.role === "user"
                          ? "bg-[#006340] hover:bg-[#004D32] text-[#0F0F0F] font-medium"
                          : "bg-[#F4F3F1] border border-[#E2E2E0] text-[#1F1F1F]"
                      }`}
                    >
                      <p className="whitespace-pre-wrap leading-relaxed text-xs">
                        {msg.content}
                      </p>
                      <p
                        className={`text-[10px] text-right mt-1 ${
                          msg.role === "user" ? "text-zinc-800" : "text-[#767676]"
                        }`}
                      >
                        {msg.timestamp}
                      </p>
                    </div>
                  </div>
                ))}

                {messages.length <= 2 && (
                  <div className="pt-1 space-y-2">
                    <span className="text-[11px] font-medium text-[#5F5F5F] px-0.5 block">
                      Common questions
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {QUICK_CARDS.map((card) => (
                        <button
                          key={card.id}
                          type="button"
                          onClick={() => handleSendMessage(card.query)}
                          disabled={loading}
                          className="flex items-start gap-2.5 p-2.5 rounded-lg bg-white hover:bg-[#F4F3F1] border border-[#E2E2E0] text-left transition-colors"
                        >
                          <div className="mt-0.5 shrink-0">{card.icon}</div>
                          <div className="min-w-0">
                            <h4 className="text-[11px] font-semibold text-[#0F0F0F] leading-tight">
                              {card.title}
                            </h4>
                            <p className="text-[10px] text-[#5F5F5F] leading-snug line-clamp-2 mt-0.5">
                              {card.description}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {loading && (
                  <div className="text-[#5F5F5F] text-xs px-1">Checking...</div>
                )}

                <div ref={messagesEndRef} />
              </div>

              <div className="p-3 bg-white border-t border-[#E2E2E0] shrink-0">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage();
                  }}
                  className="flex items-center gap-2"
                >
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder="Ask a question..."
                    disabled={loading}
                    className="flex-1 bg-[#F4F3F1] border border-[#C8C8C4] rounded-lg px-3 py-2 text-xs text-[#0F0F0F] placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    type="submit"
                    disabled={!inputMessage.trim() || loading}
                    className="p-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-zinc-950 font-semibold transition-colors shrink-0"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs bg-white">
              <div className="p-3.5 rounded-xl bg-white border border-[#E2E2E0] flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-[#F4F3F1] border border-[#C8C8C4] flex items-center justify-center text-[#006340] shrink-0">
                  <PhoneCall className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-[#0F0F0F]">Support Desk (Brian Okibo)</h3>
                  <p className="text-[11px] text-[#5F5F5F] mt-0.5">
                    WhatsApp &amp; Phone: +254 794 400 365
                  </p>
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="text-[11px] font-medium text-[#5F5F5F] block">Topic</span>
                <div className="space-y-1.5">
                  {WHATSAPP_TOPICS.map((topic) => {
                    const isSelected = selectedWhatsAppTopic === topic.label;
                    return (
                      <button
                        key={topic.label}
                        type="button"
                        onClick={() => {
                          setSelectedWhatsAppTopic(topic.label);
                          setCustomWhatsAppText(topic.query);
                        }}
                        className={`w-full p-2.5 rounded-lg border text-left transition-colors flex items-center justify-between ${
                          isSelected
                            ? "bg-[#F4F3F1] border-[#BFE0CE] text-[#0F0F0F]"
                            : "bg-white border-[#E2E2E0] text-[#3D3D3D] hover:bg-[#F4F3F1]"
                        }`}
                      >
                        <span className="font-medium text-xs">{topic.label}</span>
                        <ChevronRight className="w-3.5 h-3.5 text-[#767676] shrink-0" />
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="text-[11px] font-medium text-[#5F5F5F] block">
                  Note (include Order ID if applicable)
                </span>
                <textarea
                  rows={3}
                  value={customWhatsAppText}
                  onChange={(e) => setCustomWhatsAppText(e.target.value)}
                  placeholder="Write a brief message..."
                  className="w-full bg-white border border-[#E2E2E0] rounded-lg p-2.5 text-xs text-[#0F0F0F] placeholder-slate-500 focus:outline-none focus:border-emerald-500 resize-none"
                />
              </div>

              <button
                type="button"
                onClick={handleLaunchWhatsApp}
                className="w-full py-2.5 px-4 rounded-lg bg-[#006340] hover:bg-[#004D32] text-[#0F0F0F] font-semibold text-xs transition-colors flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Open WhatsApp</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
}
