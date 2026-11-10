import type { Config } from "tailwindcss";

/* Brand colors live here. Rename or recolor the store in this file and src/config/brand.ts. */
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#09090D",
        surface: "#101017",
        raised: "#171722",
        line: "#26263A",
        muted: "#9A9AB2",
        violet: { DEFAULT: "#8B5CF6", soft: "#A78BFA", deep: "#5B34C9" },
        volt: { DEFAULT: "#3B82F6", soft: "#60A5FA" },
        gold: { DEFAULT: "#D9B04C", soft: "#EBCB7A", deep: "#8F6F1E" },
      },
      fontFamily: {
        display: ['"Space Grotesk Variable"', "ui-sans-serif", "system-ui", "sans-serif"],
        sans: ['"Inter Variable"', "ui-sans-serif", "system-ui", "sans-serif"],
      },
      backgroundImage: {
        "brand-gradient": "linear-gradient(120deg, #8B5CF6 0%, #3B82F6 100%)",
        "gold-gradient": "linear-gradient(120deg, #EBCB7A 0%, #D9B04C 50%, #8F6F1E 100%)",
      },
      maxWidth: { page: "1180px" },
    },
  },
  plugins: [],
};

export default config;
