/**
 * Blossom-Vermillion — type scale.
 *
 * The Vermillion financial scale: large, tightly-tracked numeric displays with
 * tabular figures; Inter for everything. These objects mirror the Flutter
 * TextTheme and feed Tailwind's fontSize config (see tailwind.config.ts).
 *
 * In components, prefer the Tailwind text classes (`text-display-lg`,
 * `text-title-md`, …) defined from this file. Use `.tabular-nums-bv` (from
 * tokens.css) on any currency/percentage figures so columns line up.
 */

export const fontFamily = {
  // Swap for your bundled font, or wire up `next/font` / a <link> to Inter.
  sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
} as const;

type TypeStep = {
  size: number; // px
  lineHeight: number; // unitless multiplier
  weight: number;
  tracking: number; // letter-spacing in px
  tabular?: boolean;
};

/**
 * Named steps mirroring Material's roles. Keys become Tailwind fontSize keys:
 *   display-lg / display-md / display-sm
 *   headline-lg / headline-md / headline-sm
 *   title-lg / title-md / title-sm
 *   body-lg / body-md / body-sm
 *   label-lg / label-md / label-sm
 */
export const typeScale = {
  'display-lg': { size: 46, lineHeight: 1.05, weight: 700, tracking: -1.0, tabular: true },
  'display-md': { size: 38, lineHeight: 1.08, weight: 700, tracking: -0.8, tabular: true },
  'display-sm': { size: 30, lineHeight: 1.1, weight: 700, tracking: -0.5, tabular: true },

  'headline-lg': { size: 26, lineHeight: 1.2, weight: 700, tracking: -0.3 },
  'headline-md': { size: 22, lineHeight: 1.25, weight: 600, tracking: -0.2 },
  'headline-sm': { size: 20, lineHeight: 1.3, weight: 600, tracking: 0 },

  'title-lg': { size: 18, lineHeight: 1.3, weight: 600, tracking: 0 },
  'title-md': { size: 15, lineHeight: 1.35, weight: 600, tracking: 0 },
  'title-sm': { size: 13, lineHeight: 1.4, weight: 600, tracking: 0 },

  'body-lg': { size: 16, lineHeight: 1.5, weight: 400, tracking: 0 },
  'body-md': { size: 14, lineHeight: 1.5, weight: 400, tracking: 0 },
  'body-sm': { size: 12, lineHeight: 1.45, weight: 400, tracking: 0 },

  'label-lg': { size: 15, lineHeight: 1.2, weight: 600, tracking: 0.1 },
  'label-md': { size: 13, lineHeight: 1.2, weight: 600, tracking: 0.2 },
  'label-sm': { size: 11, lineHeight: 1.2, weight: 600, tracking: 0.3 },
} satisfies Record<string, TypeStep>;

export type TypeToken = keyof typeof typeScale;

/**
 * Convert the scale into the shape Tailwind's `fontSize` theme key expects:
 *   [sizeRem, { lineHeight, fontWeight, letterSpacing }]
 */
export function toTailwindFontSize(): Record<
  string,
  [string, { lineHeight: string; fontWeight: string; letterSpacing: string }]
> {
  const out: Record<string, [string, { lineHeight: string; fontWeight: string; letterSpacing: string }]> = {};
  for (const [key, s] of Object.entries(typeScale)) {
    out[key] = [
      `${s.size / 16}rem`,
      {
        lineHeight: String(s.lineHeight),
        fontWeight: String(s.weight),
        letterSpacing: `${s.tracking / 16}rem`,
      },
    ];
  }
  return out;
}
