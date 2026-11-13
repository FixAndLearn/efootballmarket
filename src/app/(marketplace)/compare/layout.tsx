import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Compare eFootball Squads Side-by-Side Kenya",
  description:
    "Compare up to 4 verified eFootball squads side-by-side across KES price, Collective OVR, Epics, Big Time cards, Coins, Playstyle, and Clean Konami ID status.",
  alternates: {
    canonical: "https://www.efootballmarket.co.ke/compare",
  },
  openGraph: {
    title: "Side-by-Side eFootball Squad Comparator | eFootballMarket Kenya",
    description:
      "Compare verified Kenyan eFootball squads side-by-side with automatic winner highlights across OVR, Epics, Coins, and KES value.",
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
