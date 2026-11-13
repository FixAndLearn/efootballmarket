import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "eFootball Market",
    short_name: "eFootball Market",
    description:
      "Official eFootball Market app — verified squad marketplace, instant phone availability alerts, 1v1 tournaments, and Safaricom M-Pesa Till 1572931 escrow protection.",
    start_url: "/?source=app",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0B1120",
    theme_color: "#006340",
    categories: ["games", "shopping", "sports"],
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/favicon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
    shortcuts: [
      {
        name: "Browse Verified Squads",
        short_name: "Browse",
        description: "Explore live Epic & Big Time squads ready for M-Pesa escrow",
        url: "/browse",
        icons: [{ src: "/icon-192.png", sizes: "192x192", type: "image/png" }],
      },
      {
        name: "My Escrow Orders",
        short_name: "Orders",
        description: "Open your private Konami ID Order Room & 24h inspection timer",
        url: "/dashboard/buyer",
        icons: [{ src: "/icon-192.png", sizes: "192x192", type: "image/png" }],
      },
      {
        name: "Sell a Squad",
        short_name: "Sell",
        description: "List your squad for instant M-Pesa payouts",
        url: "/seller/create-listing",
        icons: [{ src: "/icon-192.png", sizes: "192x192", type: "image/png" }],
      },
      {
        name: "1v1 Tournaments",
        short_name: "Tournaments",
        description: "Join verified Kenyan cash-prize eFootball tournaments",
        url: "/tournaments",
        icons: [{ src: "/icon-192.png", sizes: "192x192", type: "image/png" }],
      },
    ],
  };
}
