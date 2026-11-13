import { Metadata } from "next";

export const metadata: Metadata = {
  title: "WhatsApp & Facebook eFootball Middleman Escrow Desk Kenya",
  description:
    "Found an eFootball squad or swap deal on WhatsApp, Telegram, or Facebook? Lock funds on M-Pesa Buy Goods Till 1572931 with a 24-hour login inspection before seller payout.",
  alternates: {
    canonical: "https://www.efootballmarket.co.ke/middleman",
  },
  openGraph: {
    title: "WhatsApp & Facebook Middleman Escrow | eFootballMarket Kenya",
    description:
      "Protect off-platform WhatsApp, Telegram, and Facebook eFootball deals via M-Pesa Till 1572931 with 24-hour buyer login verification.",
    url: "https://www.efootballmarket.co.ke/middleman",
    type: "website",
  },
};

export default function MiddlemanLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
