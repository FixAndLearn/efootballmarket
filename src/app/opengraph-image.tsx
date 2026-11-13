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
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "68px 80px",
          background: "linear-gradient(135deg, #061A14 0%, #080E16 58%, #04090F 100%)",
          color: "#F8FAFC",
          fontFamily: "system-ui, sans-serif",
          border: "8px solid #1E293B",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <div
            style={{
              width: "72px",
              height: "72px",
              borderRadius: "18px",
              backgroundColor: "#06281E",
              border: "3px solid #FBBF24",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width="52" height="52" viewBox="0 0 512 512" fill="none">
              <path
                d="M256 38L430 100V237C430 349 354 437 256 473C158 437 82 349 82 237V100L256 38Z"
                fill="#FBBF24"
              />
              <path
                d="M256 64L406 117V236C406 334 340 412 256 445C172 412 106 334 106 236V117L256 64Z"
                fill="#059669"
              />
              <path
                d="M256 88L265 110L287 119L265 128L256 150L247 128L225 119L247 110Z"
                fill="#FEF08A"
              />
              <circle cx="256" cy="272" r="96" fill="#FFFFFF" stroke="#FBBF24" strokeWidth="10" />
              <polygon points="256,222 304,257 285,313 227,313 208,257" fill="#042F22" />
              <circle cx="332" cy="348" r="34" fill="#FBBF24" stroke="#03261B" strokeWidth="8" />
              <path
                d="M316 348L327 359L350 336"
                stroke="#03261B"
                strokeWidth="10"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                fontSize: "42px",
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
