/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0a0a0b',
        'bg-sub': '#111113',
        'bg-card': '#18181b',
        'bg-hover': '#1f1f24',
        coral: '#f26b45',
        sky: '#4ba3e3',
        green: '#22c55e',
        amber: '#f59e0b',
        red: '#ef4444',
      },
      fontFamily: {
        display: ["'Cabinet Grotesk'", "'Bricolage Grotesque'", 'system-ui', 'sans-serif'],
        body: ["'DM Sans'", 'system-ui', 'sans-serif'],
        mono: ["'JetBrains Mono'", "'Fira Code'", 'monospace'],
      },
    },
  },
  plugins: [],
};
