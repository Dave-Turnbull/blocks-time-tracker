/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './resources/views/**/*.blade.php',
    './resources/js/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        canvas: 'rgb(var(--color-canvas) / <alpha-value>)',
        fg:     'rgb(var(--color-fg) / <alpha-value>)',
        muted:  'rgb(var(--color-muted) / <alpha-value>)',
        cell:   'rgb(var(--color-cell) / <alpha-value>)',
        hover:  'rgb(var(--color-hover) / <alpha-value>)',
        danger: 'rgb(var(--color-danger) / <alpha-value>)',
      },

      borderColor: {
        DEFAULT: 'rgb(var(--color-muted) / <alpha-value>)',
      },

      // group = cell + 2px group padding + 1px group border, so corners stay concentric
      borderRadius: {
        panel:   '16px',
        group:   '11px',
        control: '8px',
        cell:    '8px',
      },

      fontFamily: {
        sans: ['var(--font-sans)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },

      boxShadow: {
        // Inset so it sits under the task-colour fills, which are child elements.
        cell: 'inset 0 0 0 1px rgb(var(--color-muted))',
      },
    },
  },
  plugins: [],
};
