/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        inter: ['Inter', 'sans-serif'],
        jakarta: ['"Plus Jakarta Sans"', 'sans-serif'],
      },
      colors: {
        primary: '#8115a2ff',   // Dark Brown
        secondary: '#590d81ff',   // Medium Brown
        tertiary: '#b08dcdff',    // Light Brown
      }
    },
  },
  plugins: [],
}
