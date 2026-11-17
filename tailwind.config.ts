import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: [
    "variant",
    [
      "@media (prefers-color-scheme: dark) { &:not([data-theme='light'] *) }",
      "&:is([data-theme='dark'] *)",
    ],
  ],
  theme: {
    extend: {
      colors: {
        sx: {
          canvas: "var(--sx-canvas)",
          stone: "var(--sx-stone)",
          subtle: "var(--sx-subtle)",
          elevated: "var(--sx-elevated)",
          border: "var(--sx-border)",
          "border-strong": "var(--sx-border-strong)",
          ink: "var(--sx-ink)",
          "ink-soft": "var(--sx-ink-soft)",
          muted: "var(--sx-muted)",
          faint: "var(--sx-faint)",
          green: "var(--sx-green)",
          "green-hover": "var(--sx-green-hover)",
          "green-text": "var(--sx-green-text)",
          "green-tint": "var(--sx-green-tint)",
          "green-border": "var(--sx-green-border)",
          "amber-text": "var(--sx-amber-text)",
          "amber-tint": "var(--sx-amber-tint)",
          "amber-border": "var(--sx-amber-border)",
          red: "var(--sx-red)",
          "red-text": "var(--sx-red-text)",
          "red-tint": "var(--sx-red-tint)",
          "red-border": "var(--sx-red-border)",
          "info-text": "var(--sx-info-text)",
          "info-tint": "var(--sx-info-tint)",
          "info-border": "var(--sx-info-border)",
          contrast: "var(--sx-contrast-bg)",
          "contrast-hover": "var(--sx-contrast-hover)",
          "contrast-fg": "var(--sx-contrast-fg)",
        },
        brand: {
          50: "#ebf5f0",
          100: "#d1eadc",
          200: "#a7d5bd",
          300: "#74ba97",
          400: "#3d996d",
          500: "#006340",
          600: "#005537",
          700: "#00472e",
          800: "#003925",
          900: "#002b1c",
          950: "#001c12",
        },
        pitch: {
          DEFAULT: "var(--sx-canvas)",
          dark: "var(--sx-canvas)",
          surface: "var(--sx-subtle)",
          card: "var(--sx-stone)",
          elevated: "var(--sx-elevated)",
          border: "var(--sx-border)",
          accent: "var(--sx-green)",
          gold: "var(--sx-amber-text)",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "-apple-system", "sans-serif"],
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      boxShadow: {
        panel: "0 1px 2px rgba(15, 15, 15, 0.04)",
        card: "0 2px 8px rgba(15, 15, 15, 0.06)",
        // Layered elevation. A single soft shadow reads flat at these radii;
        // stacking a tight contact shadow under a wide ambient one is what
        // separates a premium surface from a plain bordered box.
        raised:
          "0 1px 2px rgba(9, 13, 20, 0.05), 0 4px 10px -4px rgba(9, 13, 20, 0.10)",
        floating:
          "0 1px 2px rgba(9, 13, 20, 0.06), 0 8px 20px -8px rgba(9, 13, 20, 0.16), 0 2px 6px -2px rgba(9, 13, 20, 0.08)",
        overlay:
          "0 2px 4px rgba(9, 13, 20, 0.06), 0 24px 48px -12px rgba(9, 13, 20, 0.28)",
      },
      transitionTimingFunction: {
        // Slightly overshooting ease-out; motion settles instead of stopping dead.
        premium: "cubic-bezier(0.16, 1, 0.3, 1)",
      },
      keyframes: {
        "fade-rise": {
          from: { opacity: "0", transform: "translateY(6px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
      },
      animation: {
        "fade-rise": "fade-rise 320ms cubic-bezier(0.16, 1, 0.3, 1) both",
        shimmer: "shimmer 1.6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
