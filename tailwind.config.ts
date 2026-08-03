import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        primary: "#0D8F83",
        ink: "#002756",
        muted: "#5F7386",
        line: "#CBD8E4",
        success: "#087A6F",
        warning: "#9A6700",
        danger: "#B42318",
        surface: "#FFFFFF",
        canvas: "#EEF4F7",
        paper: "#F5FAF9",
        navy: "#002756",
        signal: "#22C7AE",
      },
      fontFamily: {
        sans: ["Kanit", "Noto Sans Thai", "Leelawadee UI", "Segoe UI", "Tahoma", "sans-serif"],
        mono: ["IBM Plex Mono", "Cascadia Code", "ui-monospace", "monospace"],
      },
      borderRadius: {
        sm: "4px",
        md: "8px",
        lg: "12px",
      },
      boxShadow: {
        card: "0 1px 2px rgba(0, 39, 86, 0.05), 0 8px 24px rgba(0, 39, 86, 0.04)",
        subtle: "0 1px 2px rgba(0, 39, 86, 0.08), 0 4px 12px rgba(0, 39, 86, 0.05)",
        soft: "0 8px 24px rgba(0, 39, 86, 0.12)",
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "200% 0" },
          "100%": { backgroundPosition: "-200% 0" },
        },
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        shimmer: "shimmer 1.8s ease-in-out infinite",
        "fade-up": "fadeUp 260ms ease-out both",
      },
    },
  },
  plugins: [],
};

export default config;