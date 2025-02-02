/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'trading-dark': '#0A0F1C',
        'trading-accent': '#00F7FF',
        'trading-success': '#00FF9D',
        'trading-warning': '#FFB800',
        'trading-danger': '#FF3B3B',
      },
    },
  },
  plugins: [],
};