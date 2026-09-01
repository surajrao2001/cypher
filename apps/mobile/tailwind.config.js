/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        bg: '#0A0A0A',
        surface: '#121212',
        elevated: '#1A1A1A',
        border: '#2A2A2A',
        ink: '#F5F5F5',
        secondary: '#A3A3A3',
        muted: '#737373',
        accent: {
          DEFAULT: '#FF4D00',
          hover: '#FF6A2B',
        },
        lime: '#DFFF00',
        success: '#22C55E',
        warning: '#F59E0B',
        danger: '#EF4444',
      },
      fontFamily: {
        display: ['BebasNeue_400Regular'],
        body: ['Barlow_400Regular'],
        'body-medium': ['Barlow_500Medium'],
        'body-semibold': ['Barlow_600SemiBold'],
        'body-bold': ['Barlow_700Bold'],
      },
      borderRadius: {
        sm: '6px',
        md: '10px',
        lg: '16px',
      },
    },
  },
  plugins: [],
};
