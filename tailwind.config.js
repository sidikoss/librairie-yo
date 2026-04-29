/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef4ff",
          100: "#dbe7ff",
          200: "#bdd3ff",
          300: "#90b7ff",
          400: "#5f92ff",
          500: "#356cf5",
          600: "#1e4ed8",
          700: "#1e40af",
          800: "#1e3a8a",
          900: "#1e356f",
        },
        accent: {
          50: "#fffceb",
          100: "#fff6c6",
          200: "#ffea88",
          300: "#ffdd4a",
          400: "#facc15",
          500: "#eab308",
          600: "#ca8a04",
          700: "#a16207",
          800: "#854d0e",
          900: "#713f12",
        },
        guinea: {
          50: "#ecfdf3",
          100: "#d1fae5",
          200: "#a7f3d0",
          300: "#6ee7b7",
          400: "#34d399",
          500: "#10b981",
          600: "#059669",
          700: "#047857",
          800: "#065f46",
          900: "#064e3b",
        },
        surface: {
          50: "#f8fafc",
          100: "#f1f5f9",
          200: "#e2e8f0",
        },
      },
      fontFamily: {
        sans: ["Be Vietnam Pro", "ui-sans-serif", "system-ui", "sans-serif"],
        heading: ["Sora", "Be Vietnam Pro", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      borderRadius: {
        "card-lg": "1.25rem",
      },
      boxShadow: {
        "soft-sm": "0 10px 28px rgba(15, 23, 42, 0.08)",
        "card-hover": "0 18px 48px rgba(30, 64, 175, 0.22)",
      },
      aspectRatio: {
        book: "3 / 4",
      },
      transitionTimingFunction: {
        "out-expo": "cubic-bezier(0.16, 1, 0.3, 1)",
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: 0 },
          "100%": { opacity: 1 },
        },
        "fade-in-up": {
          "0%": { opacity: 0, transform: "translateY(14px)" },
          "100%": { opacity: 1, transform: "translateY(0)" },
        },
        "scale-in": {
          "0%": { opacity: 0, transform: "scale(0.97)" },
          "100%": { opacity: 1, transform: "scale(1)" },
        },
        "bounce-in": {
          "0%": { opacity: 0, transform: "scale(0.88)" },
          "60%": { opacity: 1, transform: "scale(1.04)" },
          "100%": { opacity: 1, transform: "scale(1)" },
        },
        "float": {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-8px)" },
        },
        "pulse-soft": {
          "0%, 100%": { opacity: 0.72 },
          "50%": { opacity: 0.35 },
        },
      },
      animation: {
        "fade-in": "fade-in 420ms ease-out both",
        "fade-in-up": "fade-in-up 540ms cubic-bezier(0.16, 1, 0.3, 1) both",
        "scale-in": "scale-in 360ms ease-out both",
        "bounce-in": "bounce-in 460ms ease-out both",
        "float": "float 6s ease-in-out infinite",
        "float-slow": "float 9s ease-in-out infinite",
        "float-delayed": "float 7.5s ease-in-out 0.8s infinite",
        "pulse-soft": "pulse-soft 2.4s ease-in-out infinite",
      },
    },
  },
};
