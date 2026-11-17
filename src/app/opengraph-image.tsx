import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt =
  "eFootballMarket Kenya — Seller-Listed eFootball Squads & Marketplace Checkout Protection";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image() {
  const logoUrl = "https://www.efootballmarket.co.ke/logo.png";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px 80px",
          background: "linear-gradient(135deg, #061A14 0%, #080E16 58%, #04090F 100%)",
          color: "#F8FAFC",
          fontFamily: "system-ui, sans-serif",
          border: "8px solid #1E293B",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "22px" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={logoUrl}
            alt="EFM Crest"
            width={92}
            height={92}
            style={{ objectFit: "contain" }}
          />

          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                fontSize: "44px",
                fontWeight: 900,
                letterSpacing: "-1.2px",
                display: "flex",
              }}
            >
              <span style={{ color: "#F8FAFC" }}>eFootball</span>
              <span style={{ color: "#FBBF24" }}>Market</span>
            </div>
            <div
              style={{
                fontSize: "14px",
                fontWeight: 800,
                color: "#34D399",
                letterSpacing: "3px",
                marginTop: "2px",
              }}
            >
              KENYA · MARKETPLACE CHECKOUT PROTECTION
            </div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <div
            style={{
              fontSize: "56px",
              fontWeight: 900,
              lineHeight: 1.12,
              letterSpacing: "-2px",
              maxWidth: "1000px",
              color: "#F8FAFC",
            }}
          >
            Browse Seller-Listed eFootball Squads in Kenya.
          </div>
          <div
            style={{
              fontSize: "25px",
              fontWeight: 600,
              color: "#CBD5E1",
              maxWidth: "940px",
              marginTop: "6px",
            }}
          >
            Published-listing orders paid through checkout · KES 0 buyer fee · 24-hour login inspection.
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          {[
            "Seller-Provided Listings",
            "Checkout Protection for Eligible Orders",
            "24-Hour Buyer Inspection",
          ].map((pill) => (
            <div
              key={pill}
              style={{
                display: "flex",
                alignItems: "center",
                backgroundColor: "#111824",
                border: "2px solid #34D399",
                borderRadius: "999px",
                padding: "12px 24px",
                fontSize: "17px",
                fontWeight: 700,
                color: "#F8FAFC",
              }}
            >
              {pill}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size }
  );
}
