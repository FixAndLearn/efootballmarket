import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt =
  "eFootballMarket Kenya — Verified eFootball Squads & M-Pesa Till 1572931 Escrow";
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
              KENYA · TILL 1572931 ESCROW PROTECTED
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
            Buy &amp; Sell Verified eFootball Squads in Kenya.
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
            KES 0 extra buyer fee · 24-hour Clean Konami ID login inspection · Safaricom M-Pesa Till 1572931 custody.
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          {[
            "Clean Konami ID Verified",
            "M-Pesa Till 1572931 Escrow",
            "24-Hour Login Check",
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
