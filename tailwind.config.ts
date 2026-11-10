import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#ecfdf5",
          100: "#d1fae5",
          200: "#a7f3d0",
          300: "#6ee7b7",
          400: "#34d399",
          500: "#10b981",
          600: "#059669",
          700: "#047857",
          800: "#065f46",
          900: "#064e3b",
          950: "#022c22",
        },
        pitch: {
          dark: "#07090D",
          surface: "#0D1117",
          card: "#131923",
          elevated: "#19212E",
          border: "#1E2636",
          accent: "#10B981",
          gold: "#F59E0B",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "-apple-system", "sans-serif"],
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      boxShadow: {
        panel: "inset 0 1px 0 0 rgba(255, 255, 255, 0.05), 0 12px 32px -12px rgba(0, 0, 0, 0.75)",
        card: "inset 0 1px 0 0 rgba(255, 255, 255, 0.04), 0 4px 16px -4px rgba(0, 0, 0, 0.55)",
      },
    },
  },
  plugins: [],
};

export default config;
