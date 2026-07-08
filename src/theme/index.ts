/**
 * Blossom-Vermillion design system — single import surface.
 *
 *   import { ThemeProvider, useTheme, palette, typeScale } from '@/theme';
 *
 * Remember to import the CSS once at your app entry:
 *   import '@/theme/tokens.css';
 */

export * from './tokens';
export * from './typography';
export { ThemeProvider, useTheme } from './ThemeProvider';
