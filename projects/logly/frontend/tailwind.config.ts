import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Slate-based dark palette for Logly
        surface: {
          DEFAULT: '#0f172a', // slate-900 — page background
          raised: '#1e293b',  // slate-800 — card background
          overlay: '#334155', // slate-700 — modal, popover
          border: '#475569',  // slate-600 — borders
          muted: '#64748b',   // slate-500 — muted text
        },
        brand: {
          DEFAULT: '#6366f1', // indigo-500
          hover: '#4f46e5',   // indigo-600
          muted: '#312e81',   // indigo-900 — subtle bg
          text: '#a5b4fc',    // indigo-300 — text on dark
        },
        success: {
          DEFAULT: '#10b981', // emerald-500
          muted: '#064e3b',   // emerald-900
          text: '#6ee7b7',    // emerald-300
        },
        danger: {
          DEFAULT: '#ef4444', // red-500
          muted: '#450a0a',   // red-950
          text: '#fca5a5',    // red-300
        },
        warning: {
          DEFAULT: '#f59e0b', // amber-500
          muted: '#451a03',   // amber-950
          text: '#fcd34d',    // amber-300
        },
      },
      fontFamily: {
        sans: [
          'Inter',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'sans-serif',
        ],
        mono: [
          'JetBrains Mono',
          'ui-monospace',
          'SFMono-Regular',
          'monospace',
        ],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
};

export default config;
