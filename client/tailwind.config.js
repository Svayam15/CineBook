/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Manrope", "sans-serif"],
        heading: ["Plus Jakarta Sans", "sans-serif"],
      },
      colors: {
        primary: "#7C3AED",
        "primary-dark": "#5B21B6",
        golden: "#F59E0B",
        "golden-dark": "#D97706",
        dark: "#0D0D0D",
        card: "#161616",
        border: "#27272A",
        muted: "#71717A",
      },
    },
  },
  plugins: [],
}