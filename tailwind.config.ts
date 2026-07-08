import type { Config } from 'tailwindcss';
import { fontFamily, toTailwindFontSize } from './src/theme/typography';

/**
 * Blossom-Vermillion — Tailwind config.
 *
 * Colors point at the CSS variables in `src/theme/tokens.css`, so every utility
 * (`bg-brand`, `text-secondary`, `border-default`, …) is automatically
 * theme-aware: flipping `.dark` on <html> re-resolves them with zero JS.
 *
 * `<alpha-value>` lets Tailwind opacity modifiers work (e.g. `bg-brand/40`).
 * That requires the channel form, so the brand/surface/text tokens are also
 * exposed as `*-rgb` triples below; the plain hex vars remain for direct
 * `var(--bv-*)` use in CSS. To keep this simple we use the rgb() wrapper on the
 * tokens that commonly take opacity and leave the rest as direct vars.
 */

const config: Config = {
  darkMode: ['class', '[data-theme="dark"]'],
  content: ['./index.html', './src/**/*.{ts,tsx,js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Brand (single accent — magenta)
        brand: {
          DEFAULT: 'var(--bv-brand)',
          deep: 'var(--bv-brand-deep)',
          bright: 'var(--bv-brand-bright)',
        },
        'on-brand': 'var(--bv-on-brand)',

        // Surfaces
        background: 'var(--bv-background)',
        surface: {
          DEFAULT: 'var(--bv-surface)',
          high: 'var(--bv-surface-high)',
          brand: 'var(--bv-surface-brand)',
        },

        // Text (use as text-primary / text-secondary / text-tertiary)
        primary: 'var(--bv-text-primary)',
        secondary: 'var(--bv-text-secondary)',
        tertiary: 'var(--bv-text-tertiary)',

        // Status
        success: 'var(--bv-success)',
        warning: 'var(--bv-warning)',
        danger: 'var(--bv-danger)',
        info: 'var(--bv-info)',
      },
      borderColor: {
        DEFAULT: 'var(--bv-border)',
        default: 'var(--bv-border)',
      },
      fontFamily: {
        sans: [...fontFamily.sans],
      },
      // display-lg, headline-md, title-sm, body-lg, label-md, … (see typography.ts)
      fontSize: toTailwindFontSize(),
      borderRadius: {
        sm: '10px',
        md: '14px',
        lg: '20px',
        xl: '28px',
        pill: '9999px',
      },
      boxShadow: {
        card: 'var(--bv-shadow-card)',
        'brand-glow': 'var(--bv-shadow-brand-glow)',
      },
      transitionDuration: {
        fast: '150ms',
        normal: '250ms',
        slow: '400ms',
      },
    },
  },
  plugins: [],
};

export default config;
