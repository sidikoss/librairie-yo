/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#fff2f2",
          100: "#ffe2e2",
          500: "#d62828",
          600: "#b91c1c",
          700: "#991b1b",
        },
        accent: {
          100: "#fff8db",
          300: "#fde68a",
          500: "#f4c430",
          600: "#d4a915",
        },
        guinea: {
          50: "#e8f8ef",
          100: "#d1f1df",
          500: "#1f8f4a",
          600: "#18753c",
          700: "#125b2f",
        },
      },
      fontFamily: {
        sans: ["Be Vietnam Pro", "system-ui", "sans-serif"],
        heading: ["Sora", "Be Vietnam Pro", "sans-serif"],
      },
      boxShadow: {
        soft: "0 18px 45px rgba(17, 24, 39, 0.12)",
        warm: "0 14px 35px rgba(212, 169, 21, 0.22)",
      },
    },
  },
  plugins: [],
};
