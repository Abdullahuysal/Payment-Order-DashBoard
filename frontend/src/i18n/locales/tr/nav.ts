const nav = {
  modules: {
    health: {
      label: 'Servis Sağlığı',
      description: 'Uygulama alive endpoint’lerini yoklar; 200 → ayakta.',
    },
    'test-runs': {
      label: 'Test Koşumları',
      description:
        'Uçtan uca test senaryolarını seçili ortama karşı çalıştırır, adım adım pass/fail gösterir.',
    },
    'test-data': {
      label: 'Test Verisi Üretici',
      description: 'Test müşterisi, sepet, sipariş ve kupon üretir; sonrasında temizler.',
      planned: [
        'Senaryo seç: tek müşteri, dolu sepet, ödenmiş sipariş, iade edilebilir sipariş…',
        'Seçili ortama test verisi bas; üretilen id’ler (müşteri no, sipariş no) listelenir',
        'Tek tıkla ilgili Test Koşumu senaryosuna devret',
        'Üretilen kayıtları etiketle ve toplu temizle',
      ],
    },
    todo: {
      label: 'Yapılacaklar',
      description: 'Kişi bazlı basit bir yapılacaklar listesi — günlük işlerini unutma.',
    },
    orders: {
      label: 'Sipariş Kontrol',
      description: 'DB üzerinde sipariş durumu sorgular (read-only).',
    },
    queues: {
      label: 'Mesaj Kuyrukları & DLQ',
      description:
        'RabbitMQ/Kafka kuyruk ve topic’leri, consumer lag, DLQ ve uyarılar; mesaj önizleme (salt-okunur).',
    },
    errors: {
      label: 'Hata Panosu',
      description:
        'Son dönemdeki hata imzaları, frekansı ve etkilenen siparişler; tek tık AI açıklaması.',
      planned: [
        'Son N saatteki hata imzaları: frekans, ilk / son görülme, etkilenen sipariş sayısı',
        'İmzaya tıkla: örnek stacktrace, ilgili traceId’ler, muhtemel servis',
        'Tek tık “ne oldu” AI özeti ve önerilen sahip',
        'Elasticsearch / Sentry kaynağından beslenir',
      ],
    },
    logs: {
      label: 'Log & AI',
      description: 'Elasticsearch log araması + sipariş için AI “ne oldu” yorumu.',
      planned: [
        'Elasticsearch üzerinde serbest metin + alan bazlı log araması',
        'Sipariş bağlamına göre otomatik korelasyon (traceId / orderId)',
        'Seçili log penceresi için AI “ne oldu” özeti',
      ],
    },
    'dev-tools': {
      label: 'Geliştirici Araçları',
      description:
        'Günlük yardımcılar: JSON/XML biçimleme, liste tekilleştirme, SQL liste oluşturma — işi backend yapar.',
    },
  },
  subpages: {
    'order-create': {
      label: 'Sipariş Oluşturma',
      description: 'Tek bir siparişi uçtan uca oluşturur ve sistemde düştüğünü doğrular.',
    },
    'order-bulk': {
      label: 'Toplu Sipariş Oluşturma',
      description: 'Aynı anda çok sayıda sipariş üretir (yük / kapsam testi).',
    },
    'retail-invoice': {
      label: 'Retail Fatura Oluşturma',
      description: 'Boyner (retail) ürünleri için satış faturası kesme akışı.',
    },
    'retail-return-invoice': {
      label: 'Retail İade Faturası Oluşturma',
      description: 'Boyner (retail) ürünleri için iade faturası oluşturma akışı.',
    },
    'retail-shipment-advance': {
      label: 'Retail Kargo Statüsü İlerletme',
      description: 'Retail siparişin kargo statüsünü hedef adıma kadar ilerletir.',
    },
    'merchant-shipment-advance': {
      label: 'Merchant Kargo Statüsü İlerletme',
      description: '3. parti (merchant) satıcı siparişinin kargo statüsünü ilerletir.',
    },
    json: {
      label: 'JSON Biçimlendirici',
      description: 'JSON’ı doğrular; girintiler, anahtarları sıralar ya da tek satıra küçültür.',
    },
    xml: {
      label: 'XML Biçimlendirici',
      description: 'XML’i ayrıştırır; okunur biçimde girintiler ya da tek satıra küçültür.',
    },
    list: {
      label: 'Liste Tekilleştirici',
      description: 'Satır listesindeki tekrarları atar; kırpar, boşları eler, sıralar.',
    },
    'sql-list': {
      label: 'SQL Liste Oluşturucu',
      description: 'Satırları tırnaklar, önek/sonek ekler, IN (…) için tek ifadede birleştirir.',
    },
  },
  crumbs: {
    runHistory: 'Koşum geçmişi',
    run: 'Koşum',
    order: 'Sipariş',
  },
  home: {
    eyebrow: 'Boyner · Payment & Order',
    title: 'Ops Panel',
    intro:
      'Ödeme ve sipariş ekibindeki geliştirici ve QA’in günlük operasyon işleri için tek panel. Servis sağlığını izle, test senaryolarını koştur, sipariş durumunu sorgula, logları AI ile yorumla — hepsi seçili ortam üzerinden.',
    ctaHealth: 'Servis Sağlığı’na git',
    activeEnv: 'Aktif ortam:',
    tags: {
      active: 'Aktif',
      soon: 'Yakında',
    },
    footer:
      'Faz 0 — kabuk ve mimari. Servis Sağlığı tipli mock veriyle çalışır; diğer modüller placeholder. Gerçek backend entegrasyonu sonraki fazlarda.',
  },
};

export default nav;
