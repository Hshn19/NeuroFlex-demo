import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Palette drawn from the referenced fabric: navy sleeve + cream body,
        // shifted toward a warm, trustworthy clinical product rather than a
        // neon "hacker console" — this dashboard is read by patients too.
        void: "#F7F2E7",       // page background — warm cream
        panel: "#FFFFFF",      // card background — clean white
        panelBorder: "#DCD3BE", // soft cream-grey border
        signal: "#1F4E6B",      // primary accent — deep navy-teal (was neon cyan)
        signalDim: "#4B7086",   // muted navy-teal for secondary labels
        pulse: "#B8863B",       // secondary accent — warm gold (was neon purple)
        vital: "#3F8A5C",       // "good/normal" — sage green (was neon green)
        warn: "#C1483E",        // "restricted/alert" — warm terracotta (was neon red/pink)
        mist: "#7A7361",        // muted body text — warm grey
        bone: "#1B2A41",        // primary heading/text — deep navy (was near-white)
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
        glow: "0 0 14px rgba(31,78,107,0.18), 0 1px 2px rgba(27,42,65,0.12)",
        glowPulse: "0 0 16px rgba(184,134,59,0.22), 0 1px 2px rgba(27,42,65,0.1)",
        glowVital: "0 0 14px rgba(63,138,92,0.2), 0 1px 2px rgba(27,42,65,0.1)",
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