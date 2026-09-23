import type { Config } from "tailwindcss";

export default {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        paper: "var(--paper)",
        "paper-2": "var(--paper-2)",
        ink: "var(--ink)",
        "ink-muted": "var(--ink-muted)",
        line: "var(--line)",
        pink: {
          DEFAULT: "var(--pink)",
          hover: "#e03e85",
        },
        orange: {
          DEFAULT: "var(--orange)",
          hover: "#dc5313",
        },
        surface: "var(--white)",
        danger: "var(--danger)",
        brandgreen: "var(--green)",
      },
      fontFamily: {
        display: ["'Archivo Narrow'", "Impact", "'Arial Narrow'", "sans-serif"],
        body: ["Inter", "system-ui", "-apple-system", "sans-serif"],
        mono: ["'IBM Plex Mono'", "ui-monospace", "SFMono-Regular", "Consolas", "monospace"],
      },
      boxShadow: {
        hard: "2px 2px 0px var(--line)",
        "hard-md": "3px 3px 0px var(--line)",
        "hard-lg": "4px 4px 0px var(--line)",
        "hard-xl": "6px 6px 0px var(--line)",
        "hard-pink": "3px 3px 0px var(--pink)",
        "hard-orange": "3px 3px 0px var(--orange)",
      },
      borderRadius: {
        sm: "2px",
        DEFAULT: "3px",
      },
    },
  },
  plugins: [],
} satisfies Config;
