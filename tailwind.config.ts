import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx,html}"],
  theme: {
    extend: {
      colors: {
        lockbox: {
          bg: "rgb(var(--lb-bg) / <alpha-value>)",
          surface: "rgb(var(--lb-surface) / <alpha-value>)",
          border: "rgb(var(--lb-border) / <alpha-value>)",
          "border-hover": "rgb(var(--lb-border-hover) / <alpha-value>)",
          accent: "rgb(var(--lb-accent) / <alpha-value>)",
          "accent-hover": "rgb(var(--lb-accent-hover) / <alpha-value>)",
          "accent-dim": "rgb(var(--lb-accent) / 0.1)",
          text: "rgb(var(--lb-text) / <alpha-value>)",
          "text-secondary": "rgb(var(--lb-text-secondary) / <alpha-value>)",
          "text-muted": "rgb(var(--lb-text-muted) / <alpha-value>)",
          danger: "rgb(var(--lb-danger) / <alpha-value>)",
          warning: "rgb(var(--lb-warning) / <alpha-value>)",
          success: "rgb(var(--lb-success) / <alpha-value>)",
          pro: "rgb(var(--lb-pro) / <alpha-value>)",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      animation: {
        "fade-in": "fadeIn 0.2s ease-out",
        "slide-up": "slideUp 0.2s ease-out",
        "slide-down": "slideDown 0.2s ease-out",
        "slide-in-right": "slideInRight 0.3s ease-out",
        "slide-in-left": "slideInLeft 0.3s ease-out",
        "scale-in": "scaleIn 0.2s ease-out",
        pulse: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        shimmer: "shimmer 1.5s infinite",
        confetti: "confetti 0.6s ease-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideDown: {
          "0%": { opacity: "0", transform: "translateY(-8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideInRight: {
          "0%": { opacity: "0", transform: "translateX(16px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        slideInLeft: {
          "0%": { opacity: "0", transform: "translateX(-16px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        scaleIn: {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        confetti: {
          "0%": { transform: "translateY(0) rotate(0deg)", opacity: "1" },
          "100%": { transform: "translateY(-100px) rotate(720deg)", opacity: "0" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
