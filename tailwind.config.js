/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./pages/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        comic: ['"Comic Sans MS"', "cursive", "sans-serif"],
      },
      colors: {
        canary: {
          50:  '#fcffe6',
          100: '#f6fdca',
          200: '#eefc9a',
          300: '#daf551',
          400: '#caeb30',
          500: '#acd111',
          600: '#86a709',
          700: '#647f0c',
          800: '#506410',
          900: '#445512',
          950: '#232f04',
        },
      },
    },
  },
  plugins: [],
};