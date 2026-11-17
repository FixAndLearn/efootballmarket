import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "eFootballMarket — eFootball Squad Marketplace Kenya",
    short_name: "eFootballMarket",
    description:
      "Seller-listed eFootball accounts and Konami ID transfer guides in Kenya. Account contents are not pre-audited; checkout protection applies to eligible published-listing orders.",
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
