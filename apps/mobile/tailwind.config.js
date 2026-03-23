/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: "#4e80f5",
        surface: "#ffffff",
        background: "#f0f2f5",
        muted: "#9ca3af",
        danger: "#dc2626",
      },
    },
  },
  plugins: [],
}
