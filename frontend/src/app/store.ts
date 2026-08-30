import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { detectInitialLocale, isLocale, type Locale } from '@/i18n/config';
import { APP_ENVIRONMENTS, config } from '@/services/config';
import type { AppEnvironment } from '@/types';

export const THEMES = [
  'dark',
  'midnight',
  'grape',
  'ember',
  'forest',
  'light',
  'sage',
  'sepia',
  'blush',
  'lavender',
] as const;
export type ThemeName = (typeof THEMES)[number];

export const THEME_COLOR_SCHEME: Record<ThemeName, 'light' | 'dark'> = {
  dark: 'dark',
  midnight: 'dark',
  grape: 'dark',
  ember: 'dark',
  forest: 'dark',
  light: 'light',
  sage: 'light',
  sepia: 'light',
  blush: 'light',
  lavender: 'light',
};

function normalizeTheme(value: unknown): ThemeName {
  return THEMES.includes(value as ThemeName) ? (value as ThemeName) : 'dark';
}

interface AppState {
  environment: AppEnvironment;
  setEnvironment: (env: AppEnvironment) => void;

  language: Locale;
  setLanguage: (language: Locale) => void;

  theme: ThemeName;
  setTheme: (theme: ThemeName) => void;
  cycleTheme: () => void;

  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;

  commandOpen: boolean;
  setCommandOpen: (open: boolean) => void;

  queueScopeEnabled: boolean;
  queueScopePatterns: string[];
  setQueueScopeEnabled: (enabled: boolean) => void;
  setQueueScopePatterns: (patterns: string[]) => void;
}

const LEGACY_ENV: Record<string, AppEnvironment> = {
  prod: 'production',
  staging: 'preprod',
  test: 'dev',
};

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      environment: config.defaultEnv,
      setEnvironment: (environment) => set({ environment }),

      language: detectInitialLocale(),
      setLanguage: (language) => set({ language }),

      theme: 'dark',
      setTheme: (theme) => set({ theme }),
      cycleTheme: () =>
        set((s) => ({
          theme: THEMES[(THEMES.indexOf(s.theme) + 1) % THEMES.length] ?? 'dark',
        })),

      sidebarCollapsed: false,
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),

      commandOpen: false,
      setCommandOpen: (commandOpen) => set({ commandOpen }),

      queueScopeEnabled: false,
      queueScopePatterns: [],
      setQueueScopeEnabled: (queueScopeEnabled) => set({ queueScopeEnabled }),
      setQueueScopePatterns: (queueScopePatterns) => set({ queueScopePatterns }),
    }),
    {
      name: 'boyner-ops-ui',
      version: 2,
      partialize: (s) => ({
        environment: s.environment,
        language: s.language,
        theme: s.theme,
        sidebarCollapsed: s.sidebarCollapsed,
        queueScopeEnabled: s.queueScopeEnabled,
        queueScopePatterns: s.queueScopePatterns,
      }),
      migrate: (persisted, version) => {
        const state = (persisted ?? {}) as Partial<AppState>;
        if (version < 1 && typeof state.environment === 'string') {
          state.environment = LEGACY_ENV[state.environment] ?? config.defaultEnv;
        }
        if (version < 2 && !isLocale(state.language)) {
          state.language = detectInitialLocale();
        }
        return state as AppState;
      },
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<AppState>;
        const environment =
          p.environment && APP_ENVIRONMENTS.includes(p.environment)
            ? p.environment
            : current.environment;
        const theme = normalizeTheme(p.theme);
        const language = isLocale(p.language) ? p.language : current.language;
        const queueScopePatterns = Array.isArray(p.queueScopePatterns)
          ? p.queueScopePatterns.filter((x): x is string => typeof x === 'string')
          : current.queueScopePatterns;
        const queueScopeEnabled =
          typeof p.queueScopeEnabled === 'boolean'
            ? p.queueScopeEnabled
            : current.queueScopeEnabled;
        return {
          ...current,
          ...p,
          environment,
          language,
          theme,
          queueScopePatterns,
          queueScopeEnabled,
        };
      },
    },
  ),
);
