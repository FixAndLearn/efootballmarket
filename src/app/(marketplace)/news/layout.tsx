import { Metadata } from "next";

export const metadata: Metadata = {
  title: "eFootball Intelligence, Guides & Scammer Alerts",
  description:
    "Official eFootball news, scammer alerts, squad valuation guides, and market updates from eFootballMarket platform administration.",
};

export default function NewsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
