/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["DM Sans", "sans-serif"],
        heading: ["Sora", "sans-serif"],
      },
      colors: {
        primary: "#7C3AED",
        "primary-dark": "#5B21B6",
        golden: "#F59E0B",
        "golden-dark": "#D97706",

        // Light theme surfaces
        dark: "#ffffff",          // was dark bg — now white (so old dark: classes go white)
        card: "#ffffff",          // card bg
        border: "#e5e7eb",        // gray-200
        muted: "#6b7280",         // gray-500
        surface: "#f9fafb",       // gray-50 — page bg
        "surface-2": "#f3f4f6",   // gray-100 — section bg
      },
    },
  },
  plugins: [],
}