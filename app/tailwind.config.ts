import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        rr: {
          pink: "#E11F8F",
          blue: "#1226AA",
          navy: "#001D48",
          "light-pink": "#E96BB0",
          "medium-blue": "#0075C9",
          charcoal: "#323E48",
        },
        // Category colours for session blocks
        category: {
          batting: "#3B82F6",
          "batting-power": "#6366F1",
          pace: "#EF4444",
          spin: "#EC4899",
          wicketkeeping: "#06B6D4",
          fielding: "#22C55E",
          fitness: "#A855F7",
          mental: "#8B5CF6",
          tactical: "#F59E0B",
          warmup: "#14B8A6",
          cooldown: "#64748B",
          transition: "#9CA3AF",
          other: "#D4D4D8",
        },
        // Squad colours
        squad: {
          f: "#E11F8F",
          "1": "#1226AA",
          "2": "#16A34A",
          "3": "#F97316",
        },
      },
      fontFamily: {
        montserrat: ["Montserrat", "sans-serif"],
      },
      backgroundImage: {
        "rr-gradient":
          "linear-gradient(135deg, #001D48 0%, #1226AA 40%, #E11F8F 100%)",
        "rr-gradient-reverse":
          "linear-gradient(135deg, #E11F8F 0%, #1226AA 60%, #001D48 100%)",
      },
    },
  },
  plugins: [],
};
export default config;
