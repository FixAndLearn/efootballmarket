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
      "For an order created from a published marketplace listing and paid through checkout, you pay via the Safaricom Till or STK prompt shown on the checkout page—not to the seller's personal phone number. Buyers pay KES 0 extra fee. eFootballMarket holds the full payment while the seller delivers login details (within 12 hours) and while you inspect the squad in-game (for 24 hours). After you confirm, 20% of the seller's payout stays held for 7 more days and releases automatically unless you report that the account was recovered. Direct social-media deals and swaps are not covered.",
  },
  {
    question: "What should I check during my 24-hour inspection plus a 7-day recovery window?",
    answer:
      "Import the account from the eFootball Title Screen (Data Transfer) and check that permanent OVR, Epic/Big Time players, and Coins match the screenshots. Open Extras → Support → Link Data and confirm Google Play and Apple ID both say 'Not Linked'. Then sign in to my.konami.net and change the email, password, and 2-Step Verification to your own.",
  },
  {
    question: "What if the login fails or the squad doesn't match the listing?",
    answer:
      "Tap 'Open Dispute' on your Order Page before the 24-hour timer ends and share a screen recording or uncropped screenshot. Opening a dispute pauses release while our team reviews the order logs and evidence; review time varies. If the seller missed the 12-hour delivery window, left Google/Apple linked, or misstated permanent cards, a full refund may be approved after evidence review. Approved refunds are arranged manually; transfer timing varies, and the order page does not confirm that funds were sent.",
  },
  {
    question: "When and how is the seller paid?",
    answer:
      "Sellers are paid in two parts. When the buyer confirms the logins work — or when the inspection window runs out with no dispute — we deduct the 5% seller service fee (minimum KES 50, capped at KES 500) and credit 80% of the seller's share to their available balance. The other 20% stays held for 7 days. If the buyer reports inside those 7 days that the account was recovered, that held amount freezes for review and the order is no longer paid out. If nothing is reported, it releases automatically on day 7. The seller must submit a separate M-Pesa withdrawal request either way. Requests are reviewed and processed manually; timing varies, and sellers can track the status in Seller Earnings or contact support.",
  },
  {
    question: "Is a WhatsApp or Facebook deal covered by eFootballMarket buyer protection?",
    answer:
      "No. Buyer protection applies only to an order created from a published eFootballMarket listing and paid through the marketplace checkout. We no longer provide an off-platform contract or deal-code service. Browse current squads and use the listing checkout to place a protected order.",
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
