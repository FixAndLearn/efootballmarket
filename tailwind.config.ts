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
        sx: {
          bg: "#FFFFFF",
          stone: "#F4F3F1",
          subtle: "#F9F9F8",
          border: "#E2E2E0",
          borderStrong: "#C8C8C4",
          ink: "#0F0F0F",
          muted: "#5F5F5F",
          green: "#006340",
          greenHover: "#004D32",
          greenTint: "#EBF5F0",
          greenBorder: "#BFE0CE",
          red: "#C92A2A",
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
          dark: "#FFFFFF",
          surface: "#FFFFFF",
          card: "#F4F3F1",
          elevated: "#F9F9F8",
          border: "#E2E2E0",
          accent: "#006340",
          gold: "#92400E",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "-apple-system", "sans-serif"],
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      boxShadow: {
        panel: "0 1px 2px rgba(15, 15, 15, 0.04)",
        card: "0 2px 8px rgba(15, 15, 15, 0.05)",
      },
    },
  },
  plugins: [],
};

export default config;
