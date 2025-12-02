import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        lava: {
          orange: "#FF3900",
          "spanish-orange": "#EF6000",
          "gold-drop": "#EF8109",
          yellow: "#FFE50A",
          red: "#D7001E",
          purple: "#6D0074",
        },
        grey: {
          650: "#05090F",
          550: "#0C121A",
          425: "#212630",
          200: "#787A7E",
          100: "#B9B9B9",
          25: "#EDEDED",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "-apple-system", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "glow": "glow 2s ease-in-out infinite alternate",
        "slide-up": "slideUp 0.3s ease-out",
        "fade-in": "fadeIn 0.5s ease-out",
      },
      keyframes: {
        glow: {
          "0%": { boxShadow: "0 0 20px rgba(255, 57, 0, 0.3)" },
          "100%": { boxShadow: "0 0 40px rgba(255, 57, 0, 0.6)" },
        },
        slideUp: {
          "0%": { transform: "translateY(10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
      backgroundImage: {
        "lava-gradient": "linear-gradient(135deg, #FF3900 0%, #EF6000 50%, #EF8109 100%)",
        "lava-gradient-dark": "linear-gradient(135deg, #D7001E 0%, #FF3900 50%, #EF6000 100%)",
        "dark-gradient": "linear-gradient(180deg, #0C121A 0%, #05090F 100%)",
        "card-gradient": "linear-gradient(145deg, rgba(33, 38, 48, 0.8) 0%, rgba(12, 18, 26, 0.9) 100%)",
      },
    },
  },
  plugins: [],
};

export default config;
