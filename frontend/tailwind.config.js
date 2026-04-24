/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,jsx,ts,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        'background-dark': '#18181a',
        'background-light': '#232326',
        'primary': '#7c3aed',
        'accent-yellow': '#f59e0b',
        'accent-green': '#34d399',
        'accent-red': '#ef4444',
        'accent-blue': '#60a5fa',
        'text-primary': '#f3f4f6',
        'text-secondary': '#a1a1aa',
        'white': '#ffffff',
      },
      fontFamily: {
        sans: ['Inter', 'Segoe UI', 'Helvetica Neue', 'Arial', 'sans-serif'],
        admin: ['Inter', 'Segoe UI', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
}


























