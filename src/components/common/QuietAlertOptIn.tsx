"use client";

import React, { useState } from "react";
import { Bell, CheckCircle2, MessageCircle } from "lucide-react";
import { normalizePhoneNumber } from "@/lib/utils/phone";

interface QuietAlertOptInProps {
  topic: "tournament" | "buyer_requests" | "new_squads";
  compact?: boolean;
}

export function QuietAlertOptIn({ topic, compact = false }: QuietAlertOptInProps) {
  const [phone, setPhone] = useState("");
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const labels = {
    tournament: {
      placeholder: "Your 07... / 01... WhatsApp number",
      button: "Notify Me",
      waMessage:
        "Hello eFootballMarket, please notify me on WhatsApp when the next 1v1 or Knockout Cup opens for registration.",
      confirmed: "Saved! You can also tap below to ping our WhatsApp alert list.",
    },
    buyer_requests: {
      placeholder: "Your 07... / 01... seller number",
      button: "Alert Me",
      waMessage:
        "Hello eFootballMarket, please notify me on WhatsApp when new Buyer Squad Requests are posted.",
      confirmed: "Saved! Tap below if you also want instant WhatsApp alerts.",
    },
    new_squads: {
      placeholder: "Your 07... / 01... buyer number",
      button: "Alert Me",
      waMessage:
        "Hello eFootballMarket, please notify me when new verified Clean Konami ID squads are listed.",
      confirmed: "Saved! Tap below to confirm on WhatsApp.",
    },
  }[topic];

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const norm = normalizePhoneNumber(phone);
    if (!norm.isValid) {
      setError("Enter a valid Kenyan 07... or 01... phone number.");
      return;
    }
    try {
      const existing = JSON.parse(localStorage.getItem("efm_alert_subs") || "[]");
      existing.push({ topic, phone: norm.international, at: new Date().toISOString() });
      localStorage.setItem("efm_alert_subs", JSON.stringify(existing.slice(-10)));
    } catch {
      // ignore storage restrictions
    }
    setSaved(true);
  };

  const whatsappHref = `https://wa.me/254794400365?text=${encodeURIComponent(
    phone.trim() ? `${labels.waMessage} (My number: ${phone.trim()})` : labels.waMessage
  )}`;

  if (saved) {
    return (
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="inline-flex items-center gap-1.5 text-sx-green-text font-semibold">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{labels.confirmed}</span>
        </span>
        <a
          href={whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sx-green hover:bg-sx-green-hover text-white font-bold text-xs transition-colors"
        >
          <MessageCircle className="w-3.5 h-3.5" />
          <span>Confirm on WhatsApp</span>
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <form
        onSubmit={handleSave}
        className={`flex ${compact ? "flex-row" : "flex-col sm:flex-row"} items-stretch sm:items-center gap-2`}
      >
        <input
          type="tel"
          inputMode="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder={labels.placeholder}
          className="flex-1 min-w-0 h-10 px-3 rounded-lg bg-sx-canvas border border-sx-border-strong text-xs text-sx-ink placeholder:text-sx-muted focus:outline-none focus:border-sx-green"
        />
        <button
          type="submit"
          className="h-10 px-3.5 rounded-lg bg-sx-green hover:bg-sx-green-hover text-white text-xs font-bold inline-flex items-center justify-center gap-1.5 shrink-0 cursor-pointer transition-colors"
        >
          <Bell className="w-3.5 h-3.5" />
          <span>{labels.button}</span>
        </button>
      </form>
      {error && <p className="text-[11px] text-sx-red-text">{error}</p>}
    </div>
  );
}
