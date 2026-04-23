/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#fff2f2",
          100: "#ffe2e2",
          200: "#ffc9c9",
          300: "#ffa3a3",
          400: "#ff6b6b",
          500: "#d62828",
          600: "#b91c1c",
          700: "#991b1b",
          800: "#7f1d1d",
          900: "#651a1a",
        },
        accent: {
          50: "#fffef5",
          100: "#fff8db",
          200: "#fff0b3",
          300: "#fde68a",
          400: "#fcd34d",
          500: "#f4c430",
          600: "#d4a915",
          700: "#a3820e",
        },
        guinea: {
          50: "#e8f8ef",
          100: "#d1f1df",
          200: "#a3e4bf",
          300: "#6dd49a",
          400: "#34c472",
          500: "#1f8f4a",
          600: "#18753c",
          700: "#125b2f",
          800: "#0d4423",
        },
      },
      fontFamily: {
        sans: ["Be Vietnam Pro", "system-ui", "sans-serif"],
        heading: ["Sora", "Be Vietnam Pro", "sans-serif"],
      },
      boxShadow: {
        soft: "0 18px 45px rgba(17, 24, 39, 0.10)",
        warm: "0 14px 35px rgba(212, 169, 21, 0.18)",
        "glow-brand": "0 0 30px rgba(214, 40, 40, 0.15)",
        "glow-guinea": "0 0 30px rgba(31, 143, 74, 0.15)",
        "glow-accent": "0 0 30px rgba(244, 196, 48, 0.2)",
        glass: "0 8px 32px rgba(0, 0, 0, 0.06)",
        "card-hover": "0 25px 50px rgba(17, 24, 39, 0.15), 0 0 0 1px rgba(255,255,255,0.8)",
      },
      animation: {
        "fade-in": "fadeIn 0.6s ease-out forwards",
        "fade-in-up": "fadeInUp 0.6s ease-out forwards",
        "slide-in-right": "slideInRight 0.5s ease-out forwards",
        "scale-in": "scaleIn 0.4s ease-out forwards",
        float: "float 6s ease-in-out infinite",
        "float-slow": "floatSlow 8s ease-in-out infinite",
        "float-delayed": "floatDelayed 7s ease-in-out infinite",
        shimmer: "shimmer 2s linear infinite",
        "pulse-soft": "pulseSoft 2s ease-in-out infinite",
        "bounce-in": "bounceIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards",
        "glow-pulse": "glowPulse 3s ease-in-out infinite",
        "spin-slow": "spin 8s linear infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        fadeInUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideInRight: {
          "0%": { opacity: "0", transform: "translateX(-20px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        scaleIn: {
          "0%": { opacity: "0", transform: "scale(0.9)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0) rotate(0deg)" },
          "50%": { transform: "translateY(-20px) rotate(3deg)" },
        },
        floatSlow: {
          "0%, 100%": { transform: "translateY(0) rotate(0deg)" },
          "33%": { transform: "translateY(-15px) rotate(-2deg)" },
          "66%": { transform: "translateY(-8px) rotate(2deg)" },
        },
        floatDelayed: {
          "0%, 100%": { transform: "translateY(0) rotate(0deg)" },
          "50%": { transform: "translateY(-12px) rotate(-3deg)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        pulseSoft: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.7" },
        },
        bounceIn: {
          "0%": { opacity: "0", transform: "scale(0.3)" },
          "50%": { transform: "scale(1.05)" },
          "70%": { transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        glowPulse: {
          "0%, 100%": { boxShadow: "0 0 20px rgba(214, 40, 40, 0.1)" },
          "50%": { boxShadow: "0 0 40px rgba(214, 40, 40, 0.2)" },
        },
      },
      backdropBlur: {
        xs: "2px",
      },
      transitionTimingFunction: {
        "out-expo": "cubic-bezier(0.19, 1, 0.22, 1)",
      },
    },
  },
  plugins: [],
};
