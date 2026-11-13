import { Metadata } from "next";

export const metadata: Metadata = {
  title: "eFootball 1v1 Matches & Paid Clan Tournaments Kenya",
  description:
    "Enter competitive eFootball 1v1 fixtures or host 4–16 player knockout cups in Kenya with automated brackets and M-Pesa Till 1572931 prize pool custody.",
  alternates: {
    canonical: "https://www.efootballmarket.co.ke/tournaments",
  },
  openGraph: {
    title: "eFootball 1v1 Matches & Paid Clan Tournaments | eFootballMarket Kenya",
    description:
      "Join verified eFootball knockout brackets or host paid clan tournaments with automated M-Pesa Till 1572931 prize pool custody.",
    url: "https://www.efootballmarket.co.ke/tournaments",
    type: "website",
  },
};

export default function TournamentsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
