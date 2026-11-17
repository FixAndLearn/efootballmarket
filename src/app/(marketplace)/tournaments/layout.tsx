import { Metadata } from "next";

export const metadata: Metadata = {
  title: "eFootball 1v1 Matches & Paid Clan Tournaments Kenya",
  description:
    "Enter eFootball 1v1 fixtures or host 4–16 player knockout cups in Kenya. Paid entries are confirmed by M-Pesa STK Push or account balance; tournament prizes are arranged manually by the desk.",
  alternates: {
    canonical: "https://www.efootballmarket.co.ke/tournaments",
  },
  openGraph: {
    title: "eFootball 1v1 Matches & Paid Clan Tournaments | eFootballMarket Kenya",
    description:
      "Join registered-member eFootball knockout brackets or host paid clan tournaments. Entry is confirmed by M-Pesa STK Push or account balance; the tournament desk arranges any prize manually after the final result.",
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
