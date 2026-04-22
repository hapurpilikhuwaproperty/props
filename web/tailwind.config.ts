import type { Config } from 'tailwindcss';
import { fontFamily } from 'tailwindcss/defaultTheme';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Inter"', ...fontFamily.sans],
      },
      colors: {
        brand: {
          DEFAULT: '#155EED',
          accent: '#FF6B4A',
          soft: '#EAF2FF',
          dark: '#0F172A',
        },
      },
      boxShadow: {
        card: '0 15px 40px -18px rgba(0,0,0,0.25)',
      },
      borderRadius: {
        xl2: '1.25rem',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;
