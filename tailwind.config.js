/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Deep obsidian cyber palette
        navy: {
          DEFAULT: '#090D16',
          surface: '#0E1424',
          card: '#12192B',
          hover: '#192238',
        },
        slate: {
          medium: '#1E293B',
          muted: '#334155',
        },
        electric: {
          blue: '#3B82F6',
          cyan: '#06B6D4',
          indigo: '#6366F1',
        },
        emerald: {
          present: '#10B981',
        },
        amber: {
          warning: '#F59E0B',
        },
        rose: {
          danger: '#EF4444',
        },
        // Semantic design tokens
        background: '#090D16',
        foreground: '#F1F5F9',
        card: {
          DEFAULT: '#12192B',
          foreground: '#F1F5F9',
        },
        popover: {
          DEFAULT: '#0E1424',
          foreground: '#F1F5F9',
        },
        primary: {
          DEFAULT: '#3B82F6',
          foreground: '#FFFFFF',
        },
        secondary: {
          DEFAULT: '#1E293B',
          foreground: '#F1F5F9',
        },
        muted: {
          DEFAULT: '#1E293B',
          foreground: '#94A3B8',
        },
        accent: {
          DEFAULT: '#06B6D4',
          foreground: '#FFFFFF',
        },
        destructive: {
          DEFAULT: '#EF4444',
          foreground: '#FFFFFF',
        },
        border: '#1E293B',
        input: '#1E293B',
        ring: '#3B82F6',
        success: '#10B981',
        warning: '#F59E0B',
        danger: '#EF4444',
        'text-primary': '#F1F5F9',
        'text-secondary': '#94A3B8',
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        'glow-blue': '0 0 25px -5px rgba(59, 130, 246, 0.3)',
        'glow-cyan': '0 0 25px -5px rgba(6, 182, 212, 0.3)',
        'glow-amber': '0 0 25px -5px rgba(245, 158, 11, 0.3)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
      },
    },
  },
  plugins: [],
}
