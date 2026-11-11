"use client";

import React, { useState } from "react";
import { ChevronDown } from "lucide-react";

interface FaqItem {
  question: string;
  answer: string;
}

const FAQS: FaqItem[] = [
  {
    question: "How does payment protection work?",
    answer:
      "You pay the squad price into Safaricom M-Pesa Buy Goods Till 1572931 — not to the seller's personal phone number. Buyers pay KES 0 extra fee. eFootballMarket holds the money while the seller delivers login details (within 12 hours) and while you check the squad in-game (for 24 hours).",
  },
  {
    question: "What should I check during my 24-hour inspection?",
    answer:
      "Import the account from the eFootball Title Screen (Data Transfer) and check that permanent OVR, Epic/Big Time players, and Coins match the screenshots. Open Extras -> Support -> Link Data and confirm Google Play and Apple ID both say 'Not Linked'. Then sign in to my.konami.net and change the email, password, and 2-Step Verification to your own.",
  },
  {
    question: "What if the login fails or the squad doesn't match the listing?",
    answer:
      "Tap 'Open Dispute' on your Order Page before the 24-hour timer ends and share a screen recording or uncropped screenshot. Opening a dispute pauses the seller payout while our team reviews the order logs and screenshots within 24 to 48 hours. If the seller missed the 12-hour delivery window, left Google/Apple linked, or misstated permanent cards, your M-Pesa payment is refunded in full.",
  },
  {
    question: "When and how is the seller paid?",
    answer:
      "As soon as the buyer taps 'Confirm & Release' — or automatically 24 hours after valid login delivery if no dispute is opened. We deduct a 5% seller service fee (minimum KES 50, capped at KES 500) and credit the balance for M-Pesa payout.",
  },
  {
    question: "Can I use escrow for a squad I found on WhatsApp or TikTok?",
    answer:
      "Yes. Open the Middleman page, enter the agreed KES price and both phone numbers, and share the deal code with the other person. The same M-Pesa Till 1572931 hold, 12-hour delivery rule, and 24-hour inspection window apply.",
  },
];

export function HomeFaqAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="divide-y divide-sx-border border-t border-b border-sx-border bg-sx-canvas">
      {FAQS.map((faq, idx) => {
        const isOpen = openIndex === idx;
        return (
          <div key={idx}>
            <button
              type="button"
              onClick={() => setOpenIndex(isOpen ? null : idx)}
              className="w-full text-left py-4 min-h-[48px] flex items-center justify-between gap-4 hover:text-sx-green-text transition-colors focus:outline-none cursor-pointer"
              aria-expanded={isOpen}
            >
              <span className="text-sm sm:text-[15px] font-semibold text-sx-ink">
                {faq.question}
              </span>
              <ChevronDown
                className={`w-4 h-4 text-sx-muted shrink-0 transition-transform duration-150 ${
                  isOpen ? "rotate-180 text-sx-green-text" : ""
                }`}
              />
            </button>

            {isOpen && (
              <div className="pb-4 text-xs sm:text-sm text-sx-muted leading-relaxed">
                {faq.answer}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
