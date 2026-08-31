const todo = {
  page: {
    title: 'Yapılacaklar',
    description: 'Kişi bazlı basit bir yapılacaklar listesi — günlük işlerini unutma.',
    newItem: 'Yeni todo',
  },
  filters: {
    status: {
      all: 'Tümü',
      todo: 'Yapılacak',
      'in-progress': 'Yapılıyor',
      done: 'Bitti',
    },
    owner: {
      all: 'Tüm kişiler',
    },
  },
  status: {
    todo: 'Yapılacak',
    'in-progress': 'Yapılıyor',
    done: 'Bitti',
  },
  priority: {
    label: 'Öncelik',
    low: 'Düşük',
    medium: 'Orta',
    high: 'Yüksek',
  },
  form: {
    newTitle: 'Yeni todo',
    editTitle: 'Todo’yu düzenle',
    fields: {
      title: 'Başlık',
      titlePlaceholder: 'örn. Retail iade akışını test et',
      description: 'Açıklama',
      descriptionPlaceholder: 'İsteğe bağlı ayrıntı…',
      owner: 'Sahip',
      status: 'Durum',
      dueDate: 'Son tarih',
    },
    titleRequired: 'Başlık gerekli',
    ownerRequired: 'Sahip seçilmeli',
    save: 'Kaydet',
    saving: 'Kaydediliyor…',
  },
  owner: {
    none: 'Kişi seçilmedi',
    addNew: 'Yeni kişi ekle',
    namePlaceholder: 'Kişi adı',
    add: 'Ekle',
    nameRequired: 'İsim gerekli',
  },
  list: {
    empty: 'Henüz todo yok.',
    editAria: 'Todo’yu düzenle',
    deleteAria: 'Todo’yu sil',
    deleteConfirm: '“{{title}}” silinsin mi?',
  },
};

export default todo;
