import {
  Coffee,
  Flame,
  Flower2,
  Grape,
  Leaf,
  Moon,
  MoonStar,
  Sparkles,
  Sun,
  TreePine,
  type LucideIcon,
} from 'lucide-react';

import type { ThemeName } from '@/app/store';

export type ThemeGroup = 'dark' | 'light';

export interface ThemeSwatch {
  bg: string;
  surface: string;
  fg: string;
  accent: string;
  border: string;
}

export interface ThemeMetaEntry {
  group: ThemeGroup;
  icon: LucideIcon;
  swatch: ThemeSwatch;
}

export const THEME_META: Record<ThemeName, ThemeMetaEntry> = {
  dark: {
    group: 'dark',
    icon: Moon,
    swatch: {
      bg: '#09090b',
      surface: '#18181b',
      fg: '#fafafa',
      accent: '#38bdf8',
      border: '#27272a',
    },
  },
  midnight: {
    group: 'dark',
    icon: MoonStar,
    swatch: {
      bg: '#0f172a',
      surface: '#1b2336',
      fg: '#f8fafc',
      accent: '#38bdf8',
      border: '#334155',
    },
  },
  grape: {
    group: 'dark',
    icon: Grape,
    swatch: {
      bg: '#1a1626',
      surface: '#241d33',
      fg: '#f4f1fb',
      accent: '#a78bfa',
      border: '#3b3155',
    },
  },
  ember: {
    group: 'dark',
    icon: Flame,
    swatch: {
      bg: '#1a1512',
      surface: '#241d18',
      fg: '#faf6f0',
      accent: '#fb923c',
      border: '#3d3128',
    },
  },
  forest: {
    group: 'dark',
    icon: TreePine,
    swatch: {
      bg: '#0c1611',
      surface: '#12211a',
      fg: '#eefaf2',
      accent: '#34d399',
      border: '#24402f',
    },
  },
  light: {
    group: 'light',
    icon: Sun,
    swatch: {
      bg: '#ffffff',
      surface: '#f4f4f5',
      fg: '#18181b',
      accent: '#0284c7',
      border: '#e4e4e7',
    },
  },
  sage: {
    group: 'light',
    icon: Leaf,
    swatch: {
      bg: '#f0f5f1',
      surface: '#e3ede5',
      fg: '#1c2b22',
      accent: '#15803d',
      border: '#cfe0d3',
    },
  },
  sepia: {
    group: 'light',
    icon: Coffee,
    swatch: {
      bg: '#faf4e8',
      surface: '#f2e8d5',
      fg: '#43382a',
      accent: '#0369a1',
      border: '#e4d5bd',
    },
  },
  blush: {
    group: 'light',
    icon: Flower2,
    swatch: {
      bg: '#fdf2f4',
      surface: '#f9e8ec',
      fg: '#3d2930',
      accent: '#be123c',
      border: '#f2d5dc',
    },
  },
  lavender: {
    group: 'light',
    icon: Sparkles,
    swatch: {
      bg: '#f6f4fd',
      surface: '#eeeafb',
      fg: '#2c2540',
      accent: '#7c3aed',
      border: '#e0d9f5',
    },
  },
};
