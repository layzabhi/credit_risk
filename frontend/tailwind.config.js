/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Credit risk specific colors
        risk: {
          low: '#10b981',
          medium: '#f59e0b',
          high: '#ef4444',
          critical: '#7c2d12',
        },
        // Brand colors
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
      },
      spacing: {
        '128': '32rem',
      },
      borderRadius: {
        'xl': '1rem',
      },
      shadows: {
        'sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'md': '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        'lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
        'xl': '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
      },
      fontFamily: {
        sans: ['system-ui', 'blinkmacsystemfont', '"Segoe UI"', 'Roboto', '"Helvetica Neue"', 'Arial', 'sans-serif'],
        mono: ['source-code-pro', 'Menlo', 'Monaco', 'Consolas', '"Courier New"', 'monospace'],
      },
      typography: {
        DEFAULT: {
          css: {
            color: '#1f2937',
            h1: {
              color: '#111827',
              fontWeight: '700',
            },
            h2: {
              color: '#111827',
              fontWeight: '600',
            },
            h3: {
              color: '#111827',
              fontWeight: '600',
            },
            strong: {
              color: '#111827',
              fontWeight: '600',
            },
            code: {
              color: '#dc2626',
              backgroundColor: '#f9fafb',
              padding: '0.25rem 0.5rem',
              borderRadius: '0.25rem',
            },
          },
        },
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        slideOut: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(100%)' },
        },
        pulse: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
      },
      animation: {
        fadeIn: 'fadeIn 0.3s ease-in',
        slideIn: 'slideIn 0.3s ease-out',
        slideOut: 'slideOut 0.3s ease-in',
        pulse: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      screens: {
        'xs': '320px',
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1536px',
      },
    },
  },
  plugins: [],
  safelist: [
    'bg-green-100',
    'bg-yellow-100',
    'bg-red-100',
    'bg-blue-100',
    'text-green-800',
    'text-yellow-800',
    'text-red-800',
    'text-blue-800',
    'border-green-200',
    'border-yellow-200',
    'border-red-200',
    'border-blue-200',
  ],
}
