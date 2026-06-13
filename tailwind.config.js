/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        display: ['Plus Jakarta Sans', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
      },
      colors: {
        pageBg: 'var(--color-page-bg)',
        surface: 'var(--color-surface)',
        surface2: 'var(--color-surface2)',
        textPrimary: 'var(--color-text-primary)',
        textMuted: 'var(--color-text-muted)',
        accent: 'var(--color-accent)',
        accentGreen: 'var(--color-accent-green)',
        calorie: 'var(--color-calorie)',
        protein: 'var(--color-protein)',
        carbs: 'var(--color-carbs)',
        fat: 'var(--color-fat)',
        success: 'var(--color-success)',
        danger: 'var(--color-danger)',
        ringTrack: 'var(--color-ring-track)',
      },
    },
  },
  plugins: [],
}
