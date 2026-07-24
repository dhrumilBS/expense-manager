/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Fraunces"', 'serif'],
        sans: ['"Inter"', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
      colors: {
        ink: 'rgb(var(--color-ink) / <alpha-value>)',
        paper: 'rgb(var(--color-paper) / <alpha-value>)',
        surface: 'rgb(var(--color-surface) / <alpha-value>)',
        line: 'rgb(var(--color-line) / <alpha-value>)',
        muted: 'rgb(var(--color-muted) / <alpha-value>)',
        brand: { DEFAULT: '#0B6E4F', dark: '#095C41' },
        income: '#0B8457',
        expense: '#B33A3A',
        transfer: '#3B5BA9',
      },
      borderRadius: { xl: '14px', '2xl': '20px' },
      boxShadow: {
        soft: '0 1px 2px rgba(18,24,27,0.04), 0 8px 24px -12px rgba(18,24,27,0.10)',
        softer: '0 1px 1px rgba(18,24,27,0.03), 0 2px 8px -2px rgba(18,24,27,0.06)',
      },
    },
  },
  plugins: [],
}
