import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "eFootballMarket Kenya — Verified eFootball Squads & M-Pesa Escrow";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "70px 80px",
          backgroundColor: "#F4F3F1",
          color: "#0F0F0F",
          fontFamily: "system-ui, sans-serif",
          border: "16px solid #FFFFFF",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
          <div
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "999px",
              backgroundColor: "#006340",
              color: "#FFFFFF",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "28px",
              fontWeight: 900,
            }}
          >
            X
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                fontSize: "38px",
                fontWeight: 900,
                letterSpacing: "-1.5px",
                display: "flex",
              }}
            >
              <span>eFootball</span>
              <span style={{ color: "#006340" }}>X</span>
              <span style={{ color: "#5F5F5F", marginLeft: "10px", fontWeight: 700 }}>
                Market
              </span>
            </div>
            <div
              style={{
                fontSize: "13px",
                fontWeight: 700,
                color: "#006340",
                letterSpacing: "2px",
                marginTop: "2px",
              }}
            >
              VERIFIED MARKETPLACE KENYA
            </div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div
            style={{
              fontSize: "56px",
              fontWeight: 900,
              lineHeight: 1.1,
              letterSpacing: "-2px",
              maxWidth: "980px",
            }}
          >
            Buy & Sell Verified eFootball Squads in Kenya.
          </div>
          <div
            style={{
              fontSize: "24px",
              fontWeight: 500,
              color: "#4A4A4A",
              maxWidth: "900px",
              marginTop: "6px",
            }}
          >
            Clean Konami ID ownership checks, tactical meta guides, and Safaricom M-Pesa Till 1572931 escrow custody.
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          {[
            "Clean Konami ID Required",
            "M-Pesa Till 1572931 Custody",
            "24-Hour Buyer Inspection",
          ].map((pill) => (
            <div
              key={pill}
              style={{
                display: "flex",
                alignItems: "center",
                backgroundColor: "#FFFFFF",
                border: "2px solid #E2E2E0",
                borderRadius: "999px",
                padding: "12px 24px",
                fontSize: "16px",
                fontWeight: 700,
                color: "#0F0F0F",
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
