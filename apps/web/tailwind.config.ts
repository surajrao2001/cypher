import type { Config } from 'tailwindcss';
import tailwindcssAnimate from 'tailwindcss-animate';

const config: Config = {
  darkMode: ['class'],
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './features/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: 'rgb(var(--bg-rgb) / <alpha-value>)',
        surface: 'rgb(var(--surface-rgb) / <alpha-value>)',
        elevated: 'rgb(var(--elevated-rgb) / <alpha-value>)',
        border: 'rgb(var(--border-rgb) / <alpha-value>)',
        'text-primary': 'rgb(var(--text-primary-rgb) / <alpha-value>)',
        'text-secondary': 'rgb(var(--text-secondary-rgb) / <alpha-value>)',
        'text-muted': 'rgb(var(--text-muted-rgb) / <alpha-value>)',
        accent: {
          DEFAULT: 'rgb(var(--accent-primary-rgb) / <alpha-value>)',
          hover: 'rgb(var(--accent-primary-hover-rgb) / <alpha-value>)',
        },
        'accent-2': 'rgb(var(--accent-secondary-rgb) / <alpha-value>)',
        success: 'rgb(var(--success-rgb) / <alpha-value>)',
        warning: 'rgb(var(--warning-rgb) / <alpha-value>)',
        error: 'rgb(var(--error-rgb) / <alpha-value>)',
      },
      fontFamily: {
        display: ['var(--font-display)', 'Bebas Neue', 'sans-serif'],
        body: ['var(--font-body)', 'Barlow', 'sans-serif'],
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
      },
      boxShadow: {
        poster: '0 24px 60px -28px rgba(0, 0, 0, 0.85)',
        glow: '0 0 0 1px var(--accent-primary), 0 12px 40px -16px rgba(255, 77, 0, 0.55)',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'slide-in-from-left': {
          from: { transform: 'translateX(-100%)' },
          to: { transform: 'translateX(0)' },
        },
        'slide-in-from-right': {
          from: { transform: 'translateX(100%)' },
          to: { transform: 'translateX(0)' },
        },
        'slide-in-from-bottom': {
          from: { transform: 'translateY(8px)', opacity: '0' },
          to: { transform: 'translateY(0)', opacity: '1' },
        },
      },
      animation: {
        'fade-in': 'fade-in 180ms ease-out',
        'slide-in-from-left': 'slide-in-from-left 220ms ease-out',
        'slide-in-from-right': 'slide-in-from-right 220ms ease-out',
        'slide-in-from-bottom': 'slide-in-from-bottom 200ms ease-out',
      },
    },
  },
  plugins: [tailwindcssAnimate],
};

export default config;
