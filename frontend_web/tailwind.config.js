/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'btn-blue': '#0A96E6',
        'btn-blue-hover': '#087AC1',
        'blue-footer': '#1174CB',
        'blue-box': '#2499e3',
      },
      backgroundImage: {
        'login-bg': "url('./src/assets/login-bg.png')",
      },
    },
  },
  plugins: [],
}
