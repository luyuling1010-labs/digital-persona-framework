import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        body: ["var(--font-body)", "Aptos", "Segoe UI", "sans-serif"]
      },
      boxShadow: {
        glass: "0 24px 90px rgba(0, 0, 0, 0.42)",
        glow: "0 0 60px rgba(179, 214, 255, 0.16)"
      }
    }
  },
  plugins: []
};

export default config;
