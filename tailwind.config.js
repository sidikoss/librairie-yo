/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f7fbff",
          100: "#ebf5ff",
          500: "#1d4ed8",
          600: "#1e40af",
          700: "#1e3a8a",
        },
        accent: {
          500: "#f97316",
          600: "#ea580c",
        },
      },
      fontFamily: {
        sans: ["Poppins", "system-ui", "sans-serif"],
        heading: ["Manrope", "Poppins", "sans-serif"],
      },
      boxShadow: {
        soft: "0 8px 30px rgba(15, 23, 42, 0.08)",
      },
    },
  },
  plugins: [],
};