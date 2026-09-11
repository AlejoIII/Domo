import {
  FONT_SCALES,
  UI_RADIUS,
  getAccentPalette,
  type AccentPaletteId,
  type FontScale,
  type UiRadius,
} from '@/lib/theme-palettes';
import { resolveEffectiveDark, type ThemeMode } from '@/store/theme.store';

export function applyAppearance(opts: {
  theme: ThemeMode;
  accent: AccentPaletteId;
  radius: UiRadius;
  fontScale: FontScale;
  reducedMotion: boolean;
  /** Si false, fuerza paleta Domo (plan Free). */
  allowCustomization: boolean;
}) {
  const root = document.documentElement;
  const dark = resolveEffectiveDark(opts.theme);
  root.classList.toggle('dark', dark);

  const accentId = opts.allowCustomization ? opts.accent : 'sage';
  const radius = opts.allowCustomization ? opts.radius : 'soft';
  const fontScale = opts.allowCustomization ? opts.fontScale : 'md';

  const palette = getAccentPalette(accentId);
  const tone = dark ? palette.dark : palette.light;
  root.style.setProperty('--primary', tone.primary);
  root.style.setProperty('--primary-foreground', tone.primaryForeground);
  root.style.setProperty('--radius', UI_RADIUS[radius].value);
  root.style.fontSize = FONT_SCALES[fontScale].value;

  root.classList.toggle('reduce-motion', opts.reducedMotion);
  if (opts.reducedMotion) {
    root.style.setProperty('scroll-behavior', 'auto');
  } else {
    root.style.removeProperty('scroll-behavior');
  }
}
