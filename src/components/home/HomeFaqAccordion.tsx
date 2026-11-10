"use client";

import React, { useState } from "react";
import { ChevronDown } from "lucide-react";

interface FaqItem {
  question: string;
  answer: string;
}

const FAQS: FaqItem[] = [
  {
    question: "How does Safaricom Till 1572931 protect my payment?",
    answer:
      "When you buy a squad or open a Middleman contract, your payment goes into Lipa Na M-Pesa Till 1572931 rather than directly to the seller's personal number. Your money stays held on the platform while you receive the Konami ID login details, sign in on your phone, and inspect the squad for 24 hours.",
  },
  {
    question: "What must I check during the 24-hour inspection window?",
    answer:
      "Sign in from the eFootball Title Screen (Data Transfer) and check that Starting XI players, reserves, Collective Strength, and coin balances match the listing. Open Extras -> Support -> Link Data and verify Google Play and Game Center both display 'Not Linked'. Then update the Konami ID email, password, and 2FA at my.konami.net before clicking Release Funds.",
  },
  {
    question: "What happens if login details fail or Google Play is linked?",
    answer:
      "Click 'Raise Dispute' inside your order page before the 24-hour timer ends and attach a screenshot or screen recording. Seller payout freezes immediately while support verifies your evidence and issues a full M-Pesa refund.",
  },
  {
    question: "Can I secure a deal I found on WhatsApp or Facebook?",
    answer:
      "Yes. Open the Middleman page, enter the agreed KES price and both phone numbers, and share the contract code with the other party. The same Till 1572931 hold and 24-hour buyer check apply.",
  },
  {
    question: "When do sellers receive their M-Pesa payout?",
    answer:
      "Immediately when the buyer clicks Release Funds—or automatically 24 hours after credential delivery if no dispute is raised. Net proceeds are credited to your Seller Earnings balance for M-Pesa withdrawal.",
  },
];

export function HomeFaqAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="divide-y divide-[#1E2636] rounded-2xl store-panel overflow-hidden">
      {FAQS.map((faq, idx) => {
        const isOpen = openIndex === idx;
        return (
          <div key={idx}>
            <button
              type="button"
              onClick={() => setOpenIndex(isOpen ? null : idx)}
              className="w-full text-left px-5 sm:px-6 py-4 flex items-center justify-between gap-4 hover:bg-[#131923]/60 transition-colors focus:outline-none"
              aria-expanded={isOpen}
            >
              <span className="text-sm font-semibold text-white">
                {faq.question}
              </span>
              <ChevronDown
                className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-150 ${
                  isOpen ? "rotate-180 text-emerald-400" : ""
                }`}
              />
            </button>

            {isOpen && (
              <div className="px-5 sm:px-6 pb-4 text-xs sm:text-sm text-slate-400 leading-relaxed">
                {faq.answer}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
