/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Inkforge design system — Vellum-inspired
        ink: {
          50:  '#f7f6f4',
          100: '#eeecea',
          200: '#dedad5',
          300: '#c8c2ba',
          400: '#b0a89e',
          500: '#978e83',
          600: '#7d7368',
          700: '#655c53',
          800: '#534c45',
          900: '#453f39',
          950: '#26211d',
        },
        parchment: {
          50:  '#fdfcfa',
          100: '#f9f7f3',
          200: '#f2ede6',
          300: '#e8e0d5',
          400: '#d9cfbf',
        },
        sage: {
          400: '#8fa68a',
          500: '#75906f',
          600: '#5e7559',
        },
        copper: {
          400: '#c49a6c',
          500: '#b08050',
          600: '#8f6438',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        serif: ['Lora', 'Georgia', 'serif'],
        mono:  ['JetBrains Mono', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '1rem' }],
      },
      borderRadius: {
        '4xl': '2rem',
      },
      boxShadow: {
        'soft':   '0 1px 3px 0 rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.04)',
        'card':   '0 4px 16px -2px rgb(0 0 0 / 0.08), 0 2px 4px -2px rgb(0 0 0 / 0.04)',
        'lifted': '0 12px 32px -4px rgb(0 0 0 / 0.12), 0 4px 8px -4px rgb(0 0 0 / 0.06)',
      },
      animation: {
        'fade-in':   'fadeIn 0.2s ease-out',
        'slide-up':  'slideUp 0.25s ease-out',
      },
      keyframes: {
        fadeIn:  { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp: { from: { opacity: '0', transform: 'translateY(6px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
      },
    },
  },
  plugins: [],
}
