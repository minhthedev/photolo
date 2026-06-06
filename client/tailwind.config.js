/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: '#0a0a0b',
          card: '#141416',
          elevated: '#1c1c1f',
        },
        accent: {
          DEFAULT: '#ff3b5c',
          soft: 'rgba(255, 59, 92, 0.15)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out',
        'scale-in': 'scaleIn 0.25s ease-out',
        'heart-pop': 'heartPop 0.35s ease-out',
        'glow-pulse': 'glowPulse 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        heartPop: {
          '0%': { transform: 'scale(0.6)' },
          '50%': { transform: 'scale(1.15)' },
          '100%': { transform: 'scale(1)' },
        },
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(255, 59, 92, 0.25)' },
          '50%': { boxShadow: '0 0 32px rgba(255, 59, 92, 0.45)' },
        },
      },
    },
  },
  plugins: [],
};
