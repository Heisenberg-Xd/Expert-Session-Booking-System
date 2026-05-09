/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        premium: {
          900: '#050505', // Deep black
          800: '#0A0A0A', // Surface 1
          700: '#111111', // Surface 2
          600: '#171717', // Surface 3
          500: '#1B1B1B', // Surface 4
          gold: '#E7C873', // Primary gold accent
          'gold-muted': '#D6B25E',
          'gold-dark': '#C9A44C',
          text: '#FFFFFF',
          'text-secondary': '#CFCFCF',
          'text-tertiary': '#8B8B8B',
          border: 'rgba(255,255,255,0.08)',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      borderRadius: {
        'xl': '0.75rem',
        '2xl': '1rem',
      },
      transitionTimingFunction: {
        'premium': 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
      animation: {
        'subtle-pulse': 'subtle-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        'subtle-pulse': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '.8' },
        }
      }
    },
  },
  plugins: [],
}
