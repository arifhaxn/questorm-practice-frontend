/**
 * Blossom-Vermillion — design tokens in TypeScript.
 *
 * These mirror the CSS custom properties in `tokens.css` for when you need token
 * values in JS/TS (charts, canvas, inline styles, animation libs, etc.).
 *
 * Prefer the Tailwind classes (`bg-brand`, `text-secondary`, …) or the CSS vars
 * (`var(--bv-brand)`) for styling DOM. Reach for these objects only when a value
 * must exist in JS. Where possible, read the live CSS var so it stays
 * theme-aware: `getToken('--bv-brand')`.
 */

export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 40,
} as const;

export const radius = {
  sm: 10,
  md: 14,
  lg: 20, // cards
  xl: 28, // hero cards / sheets
  pill: 9999,
} as const;

export const duration = {
  fast: 150,
  normal: 250,
  slow: 400,
} as const;

/** Static hex values per theme — mirrors Flutter AppColors. */
export const palette = {
  light: {
    brand: '#e3106d',
    brandDeep: '#c20e5f',
    brandBright: '#f0387f',
    onBrand: '#ffffff',
    background: '#faf3f6',
    surface: '#ffffff',
    surfaceHigh: '#f3eaee',
    surfaceBrand: '#e3106d',
    border: 'rgba(0,0,0,0.08)',
    textPrimary: '#1e1418',
    textSecondary: '#645157',
    textTertiary: '#9a8b91',
    success: '#3e9e5c',
    warning: '#c98a1e',
    danger: '#c5392f',
    info: '#35699e',
    overlay: 'rgba(0,0,0,0.35)',
  },
  dark: {
    brand: '#f0387f',
    brandDeep: '#c20e5f',
    brandBright: '#f0387f',
    onBrand: '#ffffff',
    background: '#050505',
    surface: '#111111',
    surfaceHigh: '#1c1c1c',
    surfaceBrand: '#e3106d',
    border: 'rgba(255,255,255,0.12)',
    textPrimary: '#f7f5f6',
    textSecondary: '#aea6a9',
    textTertiary: '#6e6669',
    success: '#70af92',
    warning: '#e0b25a',
    danger: '#e05043',
    info: '#6fa3d1',
    overlay: 'rgba(0,0,0,0.8)',
  },
} as const;

export type ThemeName = keyof typeof palette;
export type ColorToken = keyof (typeof palette)['light'];

/**
 * Read a live CSS custom property from the document root. Theme-aware, because
 * it reflects whatever `.dark` / `data-theme` is currently applied.
 *
 * @example getToken('--bv-brand')
 */
export function getToken(cssVar: string, element: HTMLElement = document.documentElement): string {
  return getComputedStyle(element).getPropertyValue(cssVar).trim();
}

/** The magenta hero gradient, for JS consumers (e.g. chart fills). */
export function brandGradientCss(): string {
  return `linear-gradient(135deg, var(--bv-brand-grad-from) 0%, var(--bv-brand-grad-to) 100%)`;
}
