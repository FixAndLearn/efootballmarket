import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Buyer Squad Requests & Custom eFootball Sourcing Kenya",
  description:
    "Looking for a specific 3150+ OVR eFootball squad, Double-Booster Epic card, or manager in Kenya? Post your KES budget on the Wanted Board and let verified sellers pitch.",
  alternates: {
    canonical: "https://www.efootballmarket.co.ke/wanted",
  },
  openGraph: {
    title: "Buyer Squad Requests & Custom Sourcing | eFootballMarket Kenya",
    description:
      "Post your target eFootball OVR, Epic cards, and KES budget — verified sellers pitch squads protected by M-Pesa Till 1572931.",
    url: "https://www.efootballmarket.co.ke/wanted",
    type: "website",
  },
};

export default function WantedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
