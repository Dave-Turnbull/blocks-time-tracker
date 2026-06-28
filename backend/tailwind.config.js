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
        page: 'rgb(var(--color-page) / <alpha-value>)',

        surface: {
          DEFAULT:    'rgb(var(--color-surface) / <alpha-value>)',
          input:      'rgb(var(--color-surface-input) / <alpha-value>)',
          btn:        'rgb(var(--color-surface-btn) / <alpha-value>)',
          'btn-hover':'rgb(var(--color-surface-btn-hover) / <alpha-value>)',
          hover:      'rgb(var(--color-surface-hover) / <alpha-value>)',
        },

        fg: {
          DEFAULT:   'rgb(var(--color-fg) / <alpha-value>)',
          secondary: 'rgb(var(--color-fg-secondary) / <alpha-value>)',
          muted:     'rgb(var(--color-fg-muted) / <alpha-value>)',
          subtle:    'rgb(var(--color-fg-subtle) / <alpha-value>)',
        },

        line: {
          DEFAULT: 'rgb(var(--color-line) / <alpha-value>)',
          strong:  'rgb(var(--color-line-strong) / <alpha-value>)',
        },

        accent: {
          DEFAULT: 'rgb(var(--color-accent) / <alpha-value>)',
          hover:   'rgb(var(--color-accent-hover) / <alpha-value>)',
          fg:      'rgb(var(--color-accent-fg) / <alpha-value>)',
          text:    'rgb(var(--color-accent-text) / <alpha-value>)',
          line:    'rgb(var(--color-accent-line) / <alpha-value>)',
        },

        ring: 'rgb(var(--color-ring) / <alpha-value>)',

        danger: {
          fg:   'rgb(var(--color-danger-fg) / <alpha-value>)',
          line: 'rgb(var(--color-danger-line) / <alpha-value>)',
          note: 'rgb(var(--color-danger-note) / <alpha-value>)',
        },

        cell:         'rgb(var(--color-cell) / <alpha-value>)',
        'task-group': 'rgb(var(--color-task-group) / <alpha-value>)',
      },

      fontFamily: {
        sans: ['var(--font-sans)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },

      boxShadow: {
        panel: 'var(--shadow-panel)',
      },
    },
  },
  plugins: [],
};
