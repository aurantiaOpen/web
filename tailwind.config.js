/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Outfit', 'sans-serif'],
      },
      colors: {
        brand: {
          DEFAULT: '#f97316',
          light: '#fb923c',
          dark: '#ea580c',
        }
      }
    },
  },
  plugins: [],
}
