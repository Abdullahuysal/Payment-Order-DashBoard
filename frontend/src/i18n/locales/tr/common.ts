const common = {
  app: {
    title: 'Payment & Order Ops',
    brand: 'Payment · Order Ops',
  },
  actions: {
    retry: 'tekrar dene',
    close: 'kapat',
    cancel: 'Vazgeç',
    clear: 'temizle',
    copy: 'kopyala',
    copied: 'kopyalandı',
    refresh: 'Yenile',
    back: 'Geri',
  },
  copyAria: 'Kopyala: {{value}}',
  errorBoundary: {
    title: 'Bu modül yüklenemedi',
    retry: 'Tekrar dene',
  },
  states: {
    loading: 'Yükleniyor…',
    empty: 'Kayıt yok',
    noResults: 'Sonuç yok',
    error: 'Bir hata oluştu',
    soon: 'Yakında',
  },
  units: {
    perSecond: '/sn',
  },
  topbar: {
    searchPlaceholder: 'Ara veya komut çalıştır…',
  },
  sidebar: {
    overview: 'Genel Bakış',
    collapse: 'Daralt',
    collapseAria: 'Menüyü daralt',
    expandAria: 'Menüyü genişlet',
    soon: 'yakında',
  },
  breadcrumb: {
    root: 'Ops',
    aria: 'breadcrumb',
  },
  commandPalette: {
    placeholder: 'Sayfa ara veya komut çalıştır…',
    dialogAria: 'Komut paleti',
    empty: 'Sonuç yok',
    groups: {
      pages: 'Sayfalar',
      actions: 'Eylemler',
    },
    hints: {
      navigate: 'gez',
      select: 'seç',
      close: 'kapat',
    },
    themeItem: 'Tema: {{name}}',
    envItem: 'Ortam: {{name}}',
    localeItem: 'Dil: {{name}}',
    active: 'aktif',
    homeKeywords: 'home anasayfa overview başlangıç genel bakış',
    themeKeywords: 'tema theme görünüm dark light açık koyu',
    envKeywords: 'ortam environment',
    localeKeywords: 'dil language türkçe ingilizce',
  },
  env: {
    ariaLabel: 'Ortam',
    labels: {
      dev: 'Dev',
      preprod: 'Preprod',
      production: 'Prod',
    },
    prodConfirm: {
      title: 'Prod ortamına geç',
      body: 'Canlı veriye erişeceksin. Devam edilsin mi?',
      confirm: "Prod'a geç",
      cancel: 'Vazgeç',
    },
  },
  locale: {
    ariaLabel: 'Dil',
    short: {
      tr: 'TR',
      en: 'EN',
    },
    names: {
      tr: 'Türkçe',
      en: 'İngilizce',
    },
  },
  theme: {
    ariaLabel: 'Tema seç',
    groups: {
      dark: 'Koyu',
      light: 'Açık',
    },
    names: {
      dark: 'Koyu',
      midnight: 'Gece Mavisi',
      grape: 'Üzüm',
      ember: 'Kor',
      forest: 'Orman',
      light: 'Açık',
      sage: 'Adaçayı',
      sepia: 'Sepya',
      blush: 'Gül',
      lavender: 'Lavanta',
    },
    hints: {
      dark: 'Zinc / OLED',
      midnight: 'Lacivert slate',
      grape: 'Mor / eflatun',
      ember: 'Sıcak antrasit / amber',
      forest: 'Koyu çam / zümrüt',
      light: 'Nötr beyaz',
      sage: 'Yeşil / fesleğen',
      sepia: 'Sıcak krem',
      blush: 'Yumuşak pembe',
      lavender: 'Yumuşak mor / eflatun',
    },
  },
};

export default common;
