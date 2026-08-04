import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        primary: "#171717",
        ink: "#171717",
        muted: "#666666",
        line: "#EBEBEB",
        success: "#0070F3",
        warning: "#AB570A",
        danger: "#EE0000",
        surface: "#FFFFFF",
        canvas: "#FAFAFA",
        paper: "#F5F5F5",
        navy: "#171717",
        signal: "#50E3C2",
        link: "#0070F3",
        violet: "#7928CA",
        pink: "#FF0080",
      },
      fontFamily: {
        sans: ["Geist", "Inter", "Noto Sans Thai", "Leelawadee UI", "Segoe UI", "Tahoma", "sans-serif"],
        mono: ["Geist Mono", "IBM Plex Mono", "Cascadia Code", "ui-monospace", "monospace"],
      },
      borderRadius: {
        sm: "6px",
        md: "8px",
        lg: "12px",
        xl: "16px",
      },
      boxShadow: {
        card: "0 0 0 1px rgba(0, 0, 0, 0.08), 0 1px 1px rgba(0, 0, 0, 0.02), 0 2px 2px rgba(0, 0, 0, 0.04)",
        subtle: "0 0 0 1px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.04)",
        soft: "0 0 0 1px rgba(0, 0, 0, 0.08), 0 8px 16px -4px rgba(0, 0, 0, 0.08)",
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
