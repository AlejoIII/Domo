import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AccentPaletteId, FontScale, UiRadius } from '@/lib/theme-palettes';

export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeState {
  /** Preferencia del usuario (system sigue al SO). */
  theme: ThemeMode;
  accent: AccentPaletteId;
  radius: UiRadius;
  fontScale: FontScale;
  reducedMotion: boolean;
  setTheme: (theme: ThemeMode) => void;
  setAccent: (accent: AccentPaletteId) => void;
  setRadius: (radius: UiRadius) => void;
  setFontScale: (fontScale: FontScale) => void;
  setReducedMotion: (reducedMotion: boolean) => void;
  /** Compat: toggle claro/oscuro (ignora system). */
  toggle: () => void;
}

function resolveLegacyTheme(raw: unknown): ThemeMode {
  if (raw === 'light' || raw === 'dark' || raw === 'system') return raw;
  return 'light';
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'light',
      accent: 'sage',
      radius: 'soft',
      fontScale: 'md',
      reducedMotion: false,
      setTheme: (theme) => set({ theme }),
      setAccent: (accent) => set({ accent }),
      setRadius: (radius) => set({ radius }),
      setFontScale: (fontScale) => set({ fontScale }),
      setReducedMotion: (reducedMotion) => set({ reducedMotion }),
      toggle: () => {
        const current = get().theme;
        const next = current === 'dark' ? 'light' : 'dark';
        set({ theme: next });
      },
    }),
    {
      name: 'domo-theme',
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<ThemeState>;
        return {
          ...current,
          ...p,
          theme: resolveLegacyTheme(p.theme),
          accent: p.accent ?? current.accent,
          radius: p.radius ?? current.radius,
          fontScale: p.fontScale ?? current.fontScale,
          reducedMotion: p.reducedMotion ?? current.reducedMotion,
        };
      },
    },
  ),
);

/** Resuelve claro/oscuro efectivo según preferencia y SO. */
export function resolveEffectiveDark(theme: ThemeMode): boolean {
  if (theme === 'dark') return true;
  if (theme === 'light') return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}
