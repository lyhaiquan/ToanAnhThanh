/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        display: ['"Baloo 2"', 'cursive'],
        body: ['"Be Vietnam Pro"', 'sans-serif'],
      },
      colors: {
        ink: {
          50: '#eef3fd',
          100: '#dce6fb',
          200: '#b3c9f5',
          300: '#83a5ee',
          400: '#4f7ce4',
          500: '#2f5fe3',
          600: '#2148b8',
          700: '#1b3a92',
          800: '#182f70',
          900: '#152752',
        },
        chalk: {
          amber: '#f59e0b',
          coral: '#f4694c',
          mint: '#10b981',
          sky: '#38bdf8',
        },
        paper: '#fbf7f0',
        board: '#0f1b2d',
        boardcard: '#16263e',
      },
      boxShadow: {
        note: '4px 4px 0 0 rgba(21, 39, 82, 0.12)',
        'note-hover': '6px 6px 0 0 rgba(21, 39, 82, 0.18)',
        'note-dark': '4px 4px 0 0 rgba(0, 0, 0, 0.4)',
      },
      keyframes: {
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(14px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'pop-in': {
          '0%': { opacity: '0', transform: 'scale(0.92)' },
          '70%': { transform: 'scale(1.03)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        drift: {
          '0%, 100%': { transform: 'translate(0, 0)' },
          '50%': { transform: 'translate(8px, -6px)' },
        },
        'arrow-nudge': {
          '0%, 100%': { transform: 'translateX(0)' },
          '50%': { transform: 'translateX(-8px)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.5s ease-out both',
        'pop-in': 'pop-in 0.35s ease-out both',
        drift: 'drift 7s ease-in-out infinite',
        'arrow-nudge': 'arrow-nudge 0.9s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
