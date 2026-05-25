import type { Config } from 'tailwindcss'
import tailwindAnimate from 'tailwindcss-animate'

export default {
  content: ['./src/**/*.{ts,tsx}'],
  darkMode: ['class'],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          '"SF Pro Rounded"',
          '-apple-system',
          'BlinkMacSystemFont',
          'system-ui',
          'sans-serif',
        ],
      },
      colors: {
        bg: 'rgb(var(--latch-bg) / <alpha-value>)',
        fg: 'rgb(var(--latch-fg) / <alpha-value>)',
        muted: 'rgb(var(--latch-muted) / <alpha-value>)',
        primary: 'rgb(var(--latch-primary) / <alpha-value>)',
        surface: 'rgb(var(--latch-surface) / <alpha-value>)',
        border: 'rgb(var(--latch-border) / <alpha-value>)',
      },
      boxShadow: {
        soft: 'none',
      },
      keyframes: {
        screenIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pop: {
          '0%': { opacity: '0', transform: 'scale(0.92)' },
          '70%': { opacity: '1', transform: 'scale(1.03)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      animation: {
        screenIn: 'screenIn 220ms ease-out',
        pop: 'pop 380ms cubic-bezier(0.2, 0.9, 0.2, 1)',
      },
      borderRadius: {
        xl2: '1.25rem',
      },
    },
  },
  plugins: [tailwindAnimate],
} satisfies Config
