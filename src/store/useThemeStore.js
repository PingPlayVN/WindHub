import { create } from 'zustand';

const STORAGE_KEY = 'windhub-appearance-v2';
const LEGACY_THEME_KEY = 'windhub-theme';

function getSystemPrefersDark() {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return true;
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export function resolveEffectiveTheme(themeMode) {
  if (themeMode === 'light') return 'light';
  if (themeMode === 'dark') return 'dark';
  return getSystemPrefersDark() ? 'dark' : 'light';
}

function loadStoredAppearance() {
  const defaults = {
    themeMode: 'dark', // 'light' | 'dark' | 'system'
    liquidGlass: false, // Default: Modern OS UI with Liquid Glass OFF
    motionLevel: 'full', // 'full' | 'subtle' | 'reduced'
  };

  if (typeof window === 'undefined') {
    return { ...defaults, theme: 'dark' };
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const themeMode = ['light', 'dark', 'system'].includes(parsed?.themeMode)
        ? parsed.themeMode
        : defaults.themeMode;
      const liquidGlass = Boolean(parsed?.liquidGlass === true);
      const motionLevel = ['full', 'subtle', 'reduced'].includes(parsed?.motionLevel)
        ? parsed.motionLevel
        : defaults.motionLevel;
      return {
        themeMode,
        theme: resolveEffectiveTheme(themeMode),
        liquidGlass,
        motionLevel,
      };
    }

    const legacy = window.localStorage.getItem(LEGACY_THEME_KEY);
    if (legacy === 'light' || legacy === 'dark') {
      return {
        ...defaults,
        themeMode: legacy,
        theme: legacy,
      };
    }
  } catch {
    // Storage unavailable; continue with defaults
  }

  return { ...defaults, theme: resolveEffectiveTheme(defaults.themeMode) };
}

function persistAppearance(nextState) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        themeMode: nextState.themeMode,
        liquidGlass: Boolean(nextState.liquidGlass),
        motionLevel: nextState.motionLevel,
      })
    );
    window.localStorage.setItem(LEGACY_THEME_KEY, nextState.theme);
  } catch {
    // Ignore storage errors
  }
}

export function applyAppearance({ theme, liquidGlass = false, motionLevel = 'full' }) {
  if (typeof document === 'undefined') return;
  const isDark = theme === 'dark';
  const root = document.documentElement;

  root.classList.toggle('dark', isDark);
  root.dataset.theme = isDark ? 'dark' : 'light';
  root.dataset.glass = liquidGlass ? 'true' : 'false';
  root.dataset.motion = motionLevel || 'full';
  root.style.colorScheme = isDark ? 'dark' : 'light';

  const metaTheme = document.querySelector('meta[name="theme-color"]');
  if (metaTheme) {
    metaTheme.setAttribute('content', isDark ? '#000000' : '#f3f5f8');
  }
}

export function applyTheme(theme) {
  const state = useThemeStore.getState();
  applyAppearance({
    theme: theme || state.theme,
    liquidGlass: state.liquidGlass,
    motionLevel: state.motionLevel,
  });
}

const initial = loadStoredAppearance();

export const useThemeStore = create((set, get) => ({
  themeMode: initial.themeMode,
  theme: initial.theme,
  liquidGlass: initial.liquidGlass,
  motionLevel: initial.motionLevel,

  setThemeMode: (themeMode) => {
    const validMode = ['light', 'dark', 'system'].includes(themeMode) ? themeMode : 'dark';
    const theme = resolveEffectiveTheme(validMode);
    const next = {
      themeMode: validMode,
      theme,
      liquidGlass: get().liquidGlass,
      motionLevel: get().motionLevel,
    };
    persistAppearance(next);
    applyAppearance(next);
    set({ themeMode: validMode, theme });
  },

  toggleTheme: () => {
    const current = get().theme;
    const nextTheme = current === 'light' ? 'dark' : 'light';
    get().setThemeMode(nextTheme);
  },

  setLiquidGlass: (enabled) => {
    const liquidGlass = Boolean(enabled);
    const next = {
      themeMode: get().themeMode,
      theme: get().theme,
      liquidGlass,
      motionLevel: get().motionLevel,
    };
    persistAppearance(next);
    applyAppearance(next);
    set({ liquidGlass });
  },

  toggleLiquidGlass: () => {
    get().setLiquidGlass(!get().liquidGlass);
  },

  setMotionLevel: (level) => {
    const motionLevel = ['full', 'subtle', 'reduced'].includes(level) ? level : 'full';
    const next = {
      themeMode: get().themeMode,
      theme: get().theme,
      liquidGlass: get().liquidGlass,
      motionLevel,
    };
    persistAppearance(next);
    applyAppearance(next);
    set({ motionLevel });
  },

  resetAppearance: () => {
    const next = {
      themeMode: 'dark',
      theme: 'dark',
      liquidGlass: false,
      motionLevel: 'full',
    };
    persistAppearance(next);
    applyAppearance(next);
    set(next);
  },

  syncSystemTheme: () => {
    if (get().themeMode !== 'system') return;
    const resolved = resolveEffectiveTheme('system');
    if (resolved !== get().theme) {
      const next = {
        themeMode: 'system',
        theme: resolved,
        liquidGlass: get().liquidGlass,
        motionLevel: get().motionLevel,
      };
      applyAppearance(next);
      set({ theme: resolved });
    }
  },
}));

if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
  const media = window.matchMedia('(prefers-color-scheme: dark)');
  media.addEventListener?.('change', () => {
    useThemeStore.getState().syncSystemTheme();
  });
}
