import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        void: "#070A10",
        panel: "#0D1420",
        panelBorder: "#1B2A3D",
        signal: "#00E5FF",
        signalDim: "#0891A8",
        pulse: "#B026FF",
        vital: "#39FF9E",
        warn: "#FF3D6E",
        mist: "#6B7A99",
        bone: "#E4F0FF",
      },
      fontFamily: {
        display: ["var(--font-orbitron)", "sans-serif"],
        body: ["var(--font-space-grotesk)", "sans-serif"],
        mono: ["var(--font-jetbrains)", "monospace"],
      },
      backgroundImage: {
        grid: "linear-gradient(rgba(0,229,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(0,229,255,0.06) 1px, transparent 1px)",
      },
      boxShadow: {
        glow: "0 0 20px rgba(0,229,255,0.25), 0 0 2px rgba(0,229,255,0.6)",
        glowPulse: "0 0 24px rgba(176,38,255,0.35), 0 0 2px rgba(176,38,255,0.7)",
        glowVital: "0 0 20px rgba(57,255,158,0.3), 0 0 2px rgba(57,255,158,0.6)",
      },
      keyframes: {
        scan: {
          "0%": { backgroundPosition: "0 0" },
          "100%": { backgroundPosition: "0 40px" },
        },
        flicker: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.85" },
        },
      },
      animation: {
        scan: "scan 3s linear infinite",
        flicker: "flicker 2.4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
export default config;
