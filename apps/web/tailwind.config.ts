import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Primary indigo
        "etihuku-indigo": "#5046E5",
        "etihuku-indigo-dark": "#3D35B0",
        "etihuku-indigo-deeper": "#2D2880",
        "etihuku-indigo-light": "#7B73FF",
        "etihuku-indigo-wash": "#EEEDFE",
        "etihuku-indigo-subtle": "#F6F5FF",
        // Gold accent
        "etihuku-gold": "#D1A039",
        "etihuku-gold-dark": "#B8872D",
        "etihuku-gold-light": "#F0D78A",
        "etihuku-gold-wash": "#FDF8EC",
        // Neutrals
        "etihuku-black": "#0F0F1A",
        "etihuku-gray-900": "#1A1A2E",
        "etihuku-gray-800": "#2D2D44",
        "etihuku-gray-700": "#4A4A66",
        "etihuku-gray-600": "#6B6B88",
        "etihuku-gray-500": "#8E8EA8",
        "etihuku-gray-400": "#B0B0C8",
        "etihuku-gray-300": "#D0D0E0",
        "etihuku-gray-200": "#E8E8F0",
        "etihuku-gray-100": "#F4F4F8",
        "etihuku-white": "#FFFFFF",
        // Semantic
        "etihuku-success": "#10B981",
        "etihuku-warning": "#F59E0B",
        "etihuku-error": "#EF4444",
        "etihuku-info": "#3B82F6",
        // Vertical identity
        "vertical-telecom": "#8B5CF6",
        "vertical-security": "#F59E0B",
        "vertical-mining": "#10B981",
        "vertical-engineering": "#EC4899",
      },
      fontFamily: {
        display: ["Sora", "sans-serif"],
        body: ["Inter", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      fontSize: {
        "display": ["48px", { lineHeight: "56px", letterSpacing: "-0.02em", fontWeight: "700" }],
        "h1": ["36px", { lineHeight: "44px", letterSpacing: "-0.01em", fontWeight: "700" }],
        "h2": ["28px", { lineHeight: "36px", letterSpacing: "-0.01em", fontWeight: "600" }],
        "h3": ["22px", { lineHeight: "30px", letterSpacing: "0", fontWeight: "600" }],
        "h4": ["18px", { lineHeight: "26px", letterSpacing: "0", fontWeight: "600" }],
        "body": ["15px", { lineHeight: "24px" }],
        "body-sm": ["13px", { lineHeight: "20px" }],
        "caption": ["11px", { lineHeight: "16px", letterSpacing: "0.02em", fontWeight: "500" }],
        "mono-data": ["14px", { lineHeight: "20px" }],
        "label": ["11px", { lineHeight: "16px", letterSpacing: "0.08em", fontWeight: "600" }],
      },
      borderRadius: {
        card: "8px",
        input: "6px",
        badge: "4px",
      },
      boxShadow: {
        card: "0 0 20px rgba(80, 70, 229, 0.08)",
        "card-hover": "0 0 28px rgba(80, 70, 229, 0.14)",
        glow: "0 0 20px rgba(80, 70, 229, 0.2)",
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "flow": "flow 2s linear infinite",
      },
      keyframes: {
        flow: {
          "0%": { strokeDashoffset: "100" },
          "100%": { strokeDashoffset: "0" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
