import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "eFootballMarket — Verified eFootball Marketplace Kenya",
    short_name: "eFootballMarket",
    description:
      "Verified eFootball account marketplace, Konami ID transfer guides, and M-Pesa Till 1572931 escrow protection in Kenya.",
    start_url: "/",
    display: "browser",
    background_color: "#FFFFFF",
    theme_color: "#006340",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/favicon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}
