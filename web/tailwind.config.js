/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        relay: {
          dark: '#0B0F17',
          card: '#131926',
          'card-hover': '#1C2436',
          border: '#1E293B',
          purple: '#8B5CF6',
          'purple-light': '#A78BFA',
          'purple-dark': '#6D28D9',
          green: '#10B981',
          'green-light': '#34D399',
          amber: '#F59E0B',
          red: '#EF4444',
          muted: '#64748B',
          text: '#F8FAFC',
          subtext: '#94A3B8',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      }
    },
  },
  plugins: [],
}
