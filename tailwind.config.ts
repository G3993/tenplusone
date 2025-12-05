import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // 90s retro pixel palette
        pixel: {
          black: "#0d0d0d",
          white: "#f0f0f0",
          green: "#00ff00",
          cyan: "#00ffff",
          magenta: "#ff00ff",
          yellow: "#ffff00",
          red: "#ff0000",
          blue: "#0000ff",
          orange: "#ff8800",
          purple: "#8800ff",
          gold: "#ffd700",
          silver: "#c0c0c0",
        },
      },
      fontFamily: {
        pixel: ["var(--font-pixel)", "monospace"],
      },
      animation: {
        blink: "blink 1s step-end infinite",
        pulse90s: "pulse90s 2s ease-in-out infinite",
        scanline: "scanline 8s linear infinite",
        glitch: "glitch 0.3s ease-in-out infinite",
      },
      keyframes: {
        blink: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0" },
        },
        pulse90s: {
          "0%, 100%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.05)" },
        },
        scanline: {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100vh)" },
        },
        glitch: {
          "0%": { transform: "translate(0)" },
          "20%": { transform: "translate(-2px, 2px)" },
          "40%": { transform: "translate(-2px, -2px)" },
          "60%": { transform: "translate(2px, 2px)" },
          "80%": { transform: "translate(2px, -2px)" },
          "100%": { transform: "translate(0)" },
        },
      },
      boxShadow: {
        pixel: "4px 4px 0px 0px rgba(0, 0, 0, 1)",
        "pixel-lg": "6px 6px 0px 0px rgba(0, 0, 0, 1)",
        "pixel-glow": "0 0 10px #00ff00, 0 0 20px #00ff00",
      },
    },
  },
  plugins: [],
};

export default config;
