const orders = {
  page: {
    title: 'Sipariş Kontrol',
    subtitle:
      'Tek numarayla siparişin tüm künyesi: aktarıldı mı, faturası / iade faturası / kargosu oluştu mu — {{env}} ortamı üzerinden, salt-okunur.',
  },
  search: {
    fieldAria: 'Arama alanı',
    valueAria: 'Arama değeri',
    submit: 'Ara',
  },
  fields: {
    orderNumber: 'Sipariş No',
    customerNo: 'Müşteri No',
    packageNo: 'Paket No',
    invoiceNo: 'Fatura No',
    trackingNo: 'Takip No',
  },
  results: {
    heading: 'Sonuçlar',
    error: 'Arama başarısız: {{message}}',
    empty: 'Eşleşme yok. Alan seçimini ve değeri kontrol et; “Sipariş No” ile doğrudan aç.',
    count_one: '{{count}} eşleşme',
    count_other: '{{count}} eşleşme',
  },
  how: {
    heading: 'Nasıl çalışır',
    body: 'Varsayılan alan <b>Sipariş No</b>; Enter ile doğrudan siparişin künyesine gidersin. Müşteri No / Paket No / Fatura No / Takip No seçersen eşleşen siparişler listelenir. Klavyeden <k>/</k> aramaya odaklanır.',
    sampleLabel: 'Örnek (mock):',
  },
  mockSamples: {
    '30012345': 'Retail — tüm künye tamam',
    '30012346': 'Merchant — kargo kısmi, fatura yok, uyarılı',
    '30012347': 'Aktarılmamış sipariş',
    '30012348': 'İade + iade bedeli',
    '30012349': 'Karma — paket bazında kalemler',
    '39999999': '404 — bulunamadı',
  },
  dossier: {
    loadError: 'Sipariş künyesi alınamadı: {{message}}',
    timestamps: 'Oluşturma {{created}} · güncelleme {{updated}}',
    fetched: 'çekildi {{relative}}',
    copySummary: 'Özet kopyala',
    timelineTitle: 'Zaman Çizelgesi',
    relatedPanels: 'İlgili paneller',
    back: '← Sipariş aramaya dön',
  },
  prodDisabled: {
    title: 'Sipariş Kontrol prod’da devre dışı',
    body: 'Bu modül yalnızca <k>dev</k> ve <k>preprod</k> ortamlarında çalışır. Devam etmek için Topbar’dan ortamı değiştir.',
  },
  notFound: {
    title: 'Sipariş bulunamadı',
    body: '<k>{{orderId}}</k> için seçili ortamda kayıt yok. Numara ya da ortam yanlış olabilir.',
    back: 'Aramaya dön',
  },
  channel: {
    retail: 'Retail',
    merchant: 'Merchant',
    mixed: 'Karma',
  },
  checkState: {
    ok: 'Tamam',
    missing: 'Yok',
    partial: 'Kısmi',
    na: 'İlgili değil',
    unknown: 'Bilinmiyor',
    short: {
      ok: '✓',
      missing: 'yok',
      partial: 'kısmi',
      na: '—',
      unknown: '?',
    },
  },
  section: {
    notApplicable: 'Bu sipariş için geçerli değil.',
    noFields: 'Kayıt yok.',
    noRows: 'Gösterilecek satır yok.',
    openJson: 'JSON’u aç',
    rawRecord: 'Ham kayıt',
  },
  timeline: {
    empty: 'Zaman çizelgesi kaydı yok.',
  },
  warnings: {
    title: 'Kısmi veri',
  },
  recent: {
    heading: 'Son bakılanlar',
  },
  summary: {
    order: 'Sipariş {{orderNumber}}',
    orderMerchant: 'Sipariş {{orderNumber}} (merchant: {{merchantName}})',
    status: 'durum: {{status}}',
  },
  raw: {
    object: '[nesne]',
    unserializable: '[serileştirilemedi]',
  },
};

export default orders;
