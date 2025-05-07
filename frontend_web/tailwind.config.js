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
        'logo-blue': '#119AD5',
        'logo-blue-hover': '#0D7EB1',
        'story-title': '#0780C6',
        'sequence-title': '#0F7CB7',
        'slot-color': '#FFF4D7',
        'seq-text': '#c8a675'
      },
      backgroundImage: {
        'login-bg': "url('./src/assets/login-bg.png')",
      },
    },
  },
  plugins: [],
}
