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
        'firework-burst': 'fireworkBurst 1.2s ease-out forwards',
        'float-particle': 'floatParticle 2.8s ease-out forwards',
        'confetti-fall': 'confettiFall 2.5s ease-out forwards',
        'celebrate-pop': 'celebratePop 0.6s ease-out forwards',
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
        fireworkBurst: {
          '0%': { transform: 'scale(0)', opacity: '1' },
          '100%': { transform: 'scale(2.5)', opacity: '0' },
        },
        floatParticle: {
          '0%': { transform: 'translateY(0) rotate(0deg)', opacity: '1' },
          '100%': { transform: 'translateY(-120vh) rotate(720deg)', opacity: '0' },
        },
        confettiFall: {
          '0%': { transform: 'translateY(-10vh) rotate(0deg)', opacity: '1' },
          '100%': { transform: 'translateY(110vh) rotate(540deg)', opacity: '0.3' },
        },
        celebratePop: {
          '0%': { opacity: '0', transform: 'scale(0.5)' },
          '60%': { opacity: '1', transform: 'scale(1.08)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [],
};
