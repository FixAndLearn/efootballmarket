import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Compare eFootball Squads Side-by-Side Kenya",
  description:
    "Compare up to 4 seller-listed eFootball squads side by side across KES price, Collective OVR, Epics, Big Time cards, Coins, Playstyle, and seller-reported Clean Konami ID status. Account details are not pre-audited.",
  alternates: {
    canonical: "https://www.efootballmarket.co.ke/compare",
  },
  openGraph: {
    title: "Side-by-Side eFootball Squad Comparator | eFootballMarket Kenya",
    description:
      "Compare seller-listed Kenyan eFootball squads side-by-side across seller-reported OVR, Epics, Coins, and KES value. Account details are not pre-audited.",
    url: "https://www.efootballmarket.co.ke/compare",
    type: "website",
  },
};

export default function CompareLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
