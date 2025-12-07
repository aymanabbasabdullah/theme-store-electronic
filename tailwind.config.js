/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Cairo"', "system-ui", "sans-serif"],
      },
      colors: {
        brand: {
          50: "#faf7f2",
          100: "#f3e8dc",
          200: "#e5d4bd",
          300: "#d3b694",
          400: "#b5916a",
          500: "#9a7550",
          600: "#7b5c3f",
          700: "#5c4330",
          800: "#3d2c20",
          900: "#201610",
        },
      },
    },
  },
  plugins: [],
};
