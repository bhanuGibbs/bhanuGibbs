/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          50: '#f0f4f8',
          100: '#d9e2ec',
          200: '#bcccdc',
          300: '#9fb3c8',
          400: '#829ab1',
          500: '#627d98',
          600: '#486581',
          700: '#334e68',
          800: '#243b53',
          900: '#102a43',
          950: '#1E3A5F',
        },
        orange: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#FF6B35',
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
        },
        brand: {
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#2563eb',
          600: '#1d4ed8',
          700: '#1e40af',
        },
      },
      boxShadow: {
        soft: '0 10px 30px rgba(37, 99, 235, 0.12)',
        'card-sm': '0 1px 3px rgba(30, 58, 95, 0.06), 0 1px 2px rgba(30, 58, 95, 0.04)',
        'card-md': '0 4px 6px rgba(30, 58, 95, 0.04), 0 10px 40px rgba(30, 58, 95, 0.08)',
        'card-lg': '0 10px 25px rgba(30, 58, 95, 0.08), 0 20px 60px rgba(30, 58, 95, 0.1)',
        'cta': '0 4px 14px rgba(255, 107, 53, 0.35)',
        'cta-hover': '0 6px 20px rgba(255, 107, 53, 0.45)',
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '24px',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        display: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'count-up': {
          '0%': { opacity: '0', transform: 'scale(0.9)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
      animation: {
        'fade-in-up': 'fade-in-up 0.6s ease-out',
        'count-up': 'count-up 0.5s ease-out',
        'float': 'float 6s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
