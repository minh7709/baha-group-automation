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
        background: "#0c0e12",
        surface: "#14171f",
        card: "#1a1f2c",
        border: "#283042",
        baha: {
          green: "#2ecc71",
          emerald: "#10b981",
          gold: "#f59e0b",
          dark: "#0b0f17",
          subtle: "#8b949e",
          accent: "#22c55e",
        }
      },
    },
  },
  plugins: [],
};
export default config;

