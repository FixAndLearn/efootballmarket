"use client";

import React, { useState } from "react";
import { ChevronDown } from "lucide-react";

interface FaqItem {
  question: string;
  answer: string;
}

const FAQS: FaqItem[] = [
  {
    question: "How does M-Pesa Till 1572931 protect my payment?",
    answer:
      "When you buy a squad or start a Middleman contract, your payment goes into our Lipa Na M-Pesa Till 1572931 rather than directly to the seller. We hold the money while you receive the Konami ID login details, sign in on your phone, and verify the account during your 24-hour inspection period.",
  },
  {
    question: "What should I check during the 24-hour inspection window?",
    answer:
      "First, sign in from the eFootball title screen (Data Transfer) and check that the Starting XI, reserves, Collective Strength, and coin balance match the listing. Next, open Extras -> Support -> Link Data and verify that Google Play and Game Center both show 'Not Linked'. Finally, change the Konami ID email, password, and two-step verification at my.konami.net before clicking Release Funds.",
  },
  {
    question: "What if the login details don't work or Google Play is still linked?",
    answer:
      "Click 'Raise Dispute' inside your order page before the 24-hour timer ends and attach a screenshot or screen recording. Seller payout freezes immediately while support verifies your evidence and processes a full M-Pesa refund.",
  },
  {
    question: "Can I use eFootballMarket for a deal I found on WhatsApp or Facebook?",
    answer:
      "Yes. Open the Middleman page, enter the agreed KES amount along with both phone numbers, and share the contract code with the other trader. The same Till 1572931 payment hold and 24-hour inspection window apply.",
  },
  {
    question: "How fast do sellers get paid after a sale?",
    answer:
      "As soon as the buyer clicks Release Funds—or automatically once 24 hours pass after credential delivery with no dispute—the net payout is credited to the seller's account for M-Pesa withdrawal.",
  },
];

export function HomeFaqAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <div className="divide-y divide-[#242A36] rounded-xl border border-[#242A36] bg-[#11141B] overflow-hidden">
      {FAQS.map((faq, idx) => {
        const isOpen = openIndex === idx;
        return (
          <div key={idx}>
            <button
              type="button"
              onClick={() => toggle(idx)}
              className="w-full text-left px-5 py-4 flex items-center justify-between gap-4 hover:bg-[#141821] transition-colors focus:outline-none"
              aria-expanded={isOpen}
            >
              <span className="text-sm font-medium text-white">
                {faq.question}
              </span>
              <ChevronDown
                className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-150 ${
                  isOpen ? "rotate-180 text-white" : ""
                }`}
              />
            </button>

            {isOpen && (
              <div className="px-5 pb-4 text-xs sm:text-sm text-slate-400 leading-relaxed">
                {faq.answer}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
