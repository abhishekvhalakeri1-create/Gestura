/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      screens: {
        xs: '420px',
      },
      colors: {
        paper: '#F7F5F0',
        card: '#FFFFFF',
        ink: '#18181B',
        stone: '#E4E2DD',
        sand: '#EFEBE4',
        clay: '#D94E34',
        muted: '#6E6A63',
        faint: '#9A958C',
      },
      fontFamily: {
        display: ['"Instrument Serif"', 'Georgia', 'Times New Roman', 'serif'],
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      borderRadius: {
        xl2: '20px',
        xl3: '28px',
      },
      boxShadow: {
        lift: '0 1px 0 rgba(24,24,27,0.04), 0 18px 40px -32px rgba(24,24,27,0.45)',
        sheet: '0 40px 120px -60px rgba(24,24,27,0.45)',
      },
      transitionTimingFunction: {
        spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        editorial: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
      keyframes: {
        caret: {
          '0%, 45%': { opacity: '1' },
          '50%, 95%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        settle: {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        rise: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        breathe: {
          '0%, 100%': { opacity: '0.35' },
          '50%': { opacity: '0.8' },
        },
        drift: {
          '0%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-4px)' },
          '100%': { transform: 'translateY(0px)' },
        },
      },
      animation: {
        caret: 'caret 1.15s steps(1, end) infinite',
        settle: 'settle 260ms cubic-bezier(0.22, 1, 0.36, 1) both',
        rise: 'rise 520ms cubic-bezier(0.22, 1, 0.36, 1) both',
        breathe: 'breathe 3.2s ease-in-out infinite',
        drift: 'drift 6s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
