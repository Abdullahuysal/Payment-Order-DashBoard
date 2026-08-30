import type trCommon from '../tr/common';

const common: typeof trCommon = {
  app: {
    title: 'Payment & Order Ops',
    brand: 'Payment · Order Ops',
  },
  actions: {
    retry: 'retry',
    close: 'close',
    cancel: 'Cancel',
    clear: 'clear',
    copy: 'copy',
    copied: 'copied',
    refresh: 'Refresh',
    back: 'Back',
  },
  copyAria: 'Copy: {{value}}',
  errorBoundary: {
    title: 'This module failed to load',
    retry: 'Try again',
  },
  states: {
    loading: 'Loading…',
    empty: 'No records',
    noResults: 'No results',
    error: 'Something went wrong',
    soon: 'Soon',
  },
  units: {
    perSecond: '/s',
  },
  topbar: {
    searchPlaceholder: 'Search or run a command…',
  },
  sidebar: {
    overview: 'Overview',
    collapse: 'Collapse',
    collapseAria: 'Collapse menu',
    expandAria: 'Expand menu',
    soon: 'soon',
  },
  breadcrumb: {
    root: 'Ops',
    aria: 'breadcrumb',
  },
  commandPalette: {
    placeholder: 'Search pages or run a command…',
    dialogAria: 'Command palette',
    empty: 'No results',
    groups: {
      pages: 'Pages',
      actions: 'Actions',
    },
    hints: {
      navigate: 'navigate',
      select: 'select',
      close: 'close',
    },
    themeItem: 'Theme: {{name}}',
    envItem: 'Environment: {{name}}',
    localeItem: 'Language: {{name}}',
    active: 'active',
    homeKeywords: 'home overview start dashboard',
    themeKeywords: 'theme appearance dark light',
    envKeywords: 'environment env',
    localeKeywords: 'language locale turkish english',
  },
  env: {
    ariaLabel: 'Environment',
    labels: {
      dev: 'Dev',
      preprod: 'Preprod',
      production: 'Prod',
    },
    prodConfirm: {
      title: 'Switch to production',
      body: "You'll be working against live data. Continue?",
      confirm: 'Switch to prod',
      cancel: 'Cancel',
    },
  },
  locale: {
    ariaLabel: 'Language',
    short: {
      tr: 'TR',
      en: 'EN',
    },
    names: {
      tr: 'Turkish',
      en: 'English',
    },
  },
  theme: {
    ariaLabel: 'Choose theme',
    groups: {
      dark: 'Dark',
      light: 'Light',
    },
    names: {
      dark: 'Dark',
      midnight: 'Midnight',
      grape: 'Grape',
      ember: 'Ember',
      forest: 'Forest',
      light: 'Light',
      sage: 'Sage',
      sepia: 'Sepia',
      blush: 'Blush',
      lavender: 'Lavender',
    },
    hints: {
      dark: 'Zinc / OLED',
      midnight: 'Navy slate',
      grape: 'Purple / violet',
      ember: 'Warm charcoal / amber',
      forest: 'Deep pine / emerald',
      light: 'Neutral white',
      sage: 'Green / basil',
      sepia: 'Warm cream',
      blush: 'Soft pink',
      lavender: 'Soft violet',
    },
  },
};

export default common;
