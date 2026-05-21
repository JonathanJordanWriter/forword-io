import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        brand: {
          coal: "#1a1a1a",    // Almost-black — headings, wordmark, body text
          blue: "#5271ff",    // Royal Blue — links & accents
          button: "#0049ac",  // Vivid Blue — buttons & active borders
          accent: "#86a9e3",  // Pastel Blue — selected chip backgrounds (use /50)
        },
      },
      keyframes: {
        progress: {
          '0%':   { width: '0%' },
          '50%':  { width: '70%' },
          '100%': { width: '95%' },
        },
      },
      animation: {
        progress: 'progress 90s ease-in-out forwards',
      },
    },
  },
  plugins: [],
};
export default config;
