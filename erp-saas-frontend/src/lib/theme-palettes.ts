/** Paletas de acento (HSL sin `hsl()` — compatibles con globals.css). */

export type AccentPaletteId =
  | 'sage'
  | 'ocean'
  | 'indigo'
  | 'rose'
  | 'amber'
  | 'slate';

export interface AccentPalette {
  id: AccentPaletteId;
  label: string;
  /** Muestra del color primario (CSS color) */
  swatch: string;
  light: { primary: string; primaryForeground: string };
  dark: { primary: string; primaryForeground: string };
}

export const ACCENT_PALETTES: AccentPalette[] = [
  {
    id: 'sage',
    label: 'Sage (Domo)',
    swatch: 'hsl(168 34% 40%)',
    light: { primary: '168 34% 40%', primaryForeground: '40 40% 98%' },
    dark: { primary: '165 30% 52%', primaryForeground: '220 20% 10%' },
  },
  {
    id: 'ocean',
    label: 'Océano',
    swatch: 'hsl(199 78% 42%)',
    light: { primary: '199 78% 42%', primaryForeground: '0 0% 100%' },
    dark: { primary: '199 72% 55%', primaryForeground: '210 40% 8%' },
  },
  {
    id: 'indigo',
    label: 'Índigo',
    swatch: 'hsl(239 60% 52%)',
    light: { primary: '239 60% 52%', primaryForeground: '0 0% 100%' },
    dark: { primary: '239 70% 68%', primaryForeground: '230 30% 10%' },
  },
  {
    id: 'rose',
    label: 'Rosa',
    swatch: 'hsl(346 65% 48%)',
    light: { primary: '346 65% 48%', primaryForeground: '0 0% 100%' },
    dark: { primary: '346 70% 62%', primaryForeground: '340 30% 10%' },
  },
  {
    id: 'amber',
    label: 'Ámbar',
    swatch: 'hsl(32 90% 45%)',
    light: { primary: '32 90% 45%', primaryForeground: '0 0% 100%' },
    dark: { primary: '36 92% 55%', primaryForeground: '30 40% 8%' },
  },
  {
    id: 'slate',
    label: 'Pizarra',
    swatch: 'hsl(215 20% 40%)',
    light: { primary: '215 20% 40%', primaryForeground: '0 0% 100%' },
    dark: { primary: '210 16% 65%', primaryForeground: '220 20% 10%' },
  },
];

export type UiRadius = 'soft' | 'rounded' | 'sharp';
export type FontScale = 'sm' | 'md' | 'lg';

export const UI_RADIUS: Record<UiRadius, { label: string; value: string }> = {
  soft: { label: 'Suave', value: '0.75rem' },
  rounded: { label: 'Redondeado', value: '1rem' },
  sharp: { label: 'Compacto', value: '0.35rem' },
};

export const FONT_SCALES: Record<FontScale, { label: string; value: string }> = {
  sm: { label: 'Pequeño', value: '15px' },
  md: { label: 'Normal', value: '16px' },
  lg: { label: 'Grande', value: '17px' },
};

export function getAccentPalette(id: AccentPaletteId): AccentPalette {
  return ACCENT_PALETTES.find((p) => p.id === id) ?? ACCENT_PALETTES[0]!;
}
