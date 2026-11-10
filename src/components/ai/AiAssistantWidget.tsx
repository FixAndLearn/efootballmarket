"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Bot,
  Send,
  X,
  Sparkles,
  ShieldCheck,
  RotateCcw,
  ExternalLink,
  MessageCircle,
  HelpCircle,
  ChevronRight,
  ShieldAlert,
  Smartphone,
  KeyRound,
  Maximize2,
  Minimize2,
} from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

const QUICK_TOPICS = [
  { label: "M-Pesa Escrow (Till 1572931)", query: "How does the Safaricom M-Pesa Till 1572931 escrow process work from start to finish?" },
  { label: "Anti-Googling Rule", query: "Why is an account with Google Play linked prohibited, and how do I verify it in-game?" },
  { label: "Change Konami Email", query: "How do I change the registered email and password on my.konami.net?" },
  { label: "Seller Not Sending 2FA Codes", query: "What should I do if the seller delivered credentials but is not sending the 2-step OTP verification code in chat?" },
  { label: "Post-Release Dispute", query: "How does raising a dispute after funds are released work, and how does the seller payout freeze?" },
  { label: "Bargaining & Make Offer", query: "How do I bargain a price and make an offer to the seller?" },
  { label: "Contact Support", query: "How do I contact support for urgent order assistance?" },
];

export function AiAssistantWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [inputMessage, setInputMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Hello! How can we help with your eFootball trade?\n\n1. Safaricom M-Pesa (Till 1572931) payment hold.\n2. Checking Google Play / Game Center Link Data.\n3. Changing Konami ID email and 2FA.\n4. Making offers or opening a dispute.\n\nChoose a topic or type your question below.",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || loading) return;

    const userMsg: Message = {
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

      const data = await res.json();
      const replyText =
        data?.reply ||
        "I am ready to help you with eFootball escrow, M-Pesa payments, Anti-Googling rules, or Konami ID transfers. How can I assist you right now?";

      const aiMsg: Message = {
        id: `ai-${Date.now()}`,
        role: "assistant",
        content: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      const errorMsg: Message = {
        id: `err-${Date.now()}`,
        role: "assistant",
        content:
          "Connection interrupted. You can message support directly on WhatsApp at +254 794 400 365.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setMessages([
      {
        id: "welcome-reset",
        role: "assistant",
        content:
          "Chat history reset! Ask me anything about eFootball trading, M-Pesa Till 1572931 escrow, Konami ID transfers, or bargaining.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
  };

  return (
    <div className="fixed bottom-20 md:bottom-5 left-4 sm:left-6 z-40 select-none font-sans">
      {/* Floating Chat Modal */}
      {isOpen && (
        <div
          className={`absolute bottom-16 left-0 rounded-3xl bg-pitch-surface/95 border border-pitch-border shadow-2xl backdrop-blur-xl overflow-hidden animate-in fade-in slide-in-from-bottom-3 flex flex-col transition-all duration-300 ${
            isExpanded
              ? "w-[92vw] sm:w-[500px] h-[85vh] max-h-[750px]"
              : "w-[90vw] sm:w-[380px] h-[75vh] max-h-[580px]"
          }`}
        >
          {/* Header */}
          <div className="p-4 bg-gradient-to-r from-slate-900 via-pitch-card to-amber-950/60 border-b border-pitch-border/60 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500/20 to-emerald-500/20 border border-[#FDE68A] flex items-center justify-center text-[#B45309] shadow-inner">
                <Bot className="w-5 h-5 text-[#92400E]" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <p className="text-xs font-bold text-[#0F0F0F] leading-tight">Support Assistant</p>
                  <span className="px-1.5 py-0.5 rounded-full bg-[#EBF5F0] border border-[#BFE0CE] text-[9px] font-bold text-[#006340]">
                    Online
                  </span>
                </div>
                <p className="text-[10px] text-[#5F5F5F] mt-0.5">Order & Handover Help</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleReset}
                title="Reset conversation"
                className="p-1.5 rounded-lg text-[#5F5F5F] hover:text-[#0F0F0F] hover:bg-[#F4F3F1] transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                title={isExpanded ? "Collapse" : "Expand"}
                className="p-1.5 rounded-lg text-[#5F5F5F] hover:text-[#0F0F0F] hover:bg-[#F4F3F1] transition-colors hidden sm:block"
              >
                {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              </button>
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



          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.role === "assistant" && (
                  <div className="w-7 h-7 rounded-lg bg-[#FEF3C7] border border-[#FDE68A] flex items-center justify-center text-[#B45309] shrink-0 mt-0.5">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-2xl p-3 shadow-sm ${
                    msg.role === "user"
                      ? "bg-brand-600 text-white rounded-tr-none"
                      : "bg-pitch-card border border-pitch-border text-[#1F1F1F] rounded-tl-none space-y-1.5"
                  }`}
                >
                  <p className="whitespace-pre-wrap leading-relaxed text-[11px] sm:text-xs">
                    {msg.content}
                  </p>
                  <span
                    className={`block text-[9px] ${
                      msg.role === "user" ? "text-emerald-200/70 text-right" : "text-[#767676]"
                    }`}
                  >
                    {msg.timestamp}
                  </span>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex gap-2.5 items-center text-[#5F5F5F] text-xs">
                <div className="w-7 h-7 rounded-lg bg-[#FEF3C7] border border-[#FDE68A] flex items-center justify-center text-[#B45309] shrink-0">
                  <Sparkles className="w-3.5 h-3.5 animate-spin" />
                </div>
                <div className="p-2.5 rounded-2xl bg-pitch-card border border-pitch-border flex items-center gap-1.5 text-[11px] text-[#5F5F5F]">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse delay-150" />
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse delay-300" />
                  <span className="ml-1">Typing...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input & Escalation Footer */}
          <div className="p-3 bg-[#F9F9F8] border-t border-pitch-border/60 space-y-2">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                placeholder="Ask about M-Pesa, Link Data, Konami ID..."
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                disabled={loading}
                className="flex-1 bg-pitch-card border border-pitch-border rounded-xl px-3 py-2 text-xs text-[#0F0F0F] placeholder:text-[#767676] focus:outline-none focus:border-emerald-500"
              />
              <button
                type="submit"
                disabled={!inputMessage.trim() || loading}
                className="p-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-slate-950 font-bold transition-all shrink-0 cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>

            <div className="flex items-center justify-between text-[10px] text-[#5F5F5F] pt-0.5">
              <span>Safaricom Till 1572931</span>
              <a
                href="https://wa.me/254794400365"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#006340] hover:text-[#006340] font-semibold inline-flex items-center gap-1"
              >
                <MessageCircle className="w-3 h-3" />
                <span>WhatsApp Support</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Floating Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white hover:bg-[#F4F3F1] text-[#0F0F0F] font-semibold text-xs border border-[#C8C8C4] shadow-lg transition-colors cursor-pointer"
      >
        <HelpCircle className="w-4 h-4 text-[#006340]" />
        <span className="text-xs">Support Chat</span>
      </button>
    </div>
  );
}
