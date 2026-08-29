export const TEST_RUN_SCENARIO_STEPS: Record<string, readonly string[]> = {
  'order-create': [
    'Test müşterisi ve sepet hazırlanır',
    'Ödeme (mock POS) ile sipariş oluşturulur',
    'Order-orchestrator’da siparişin düştüğü doğrulanır',
    'Sipariş no ve durum çıktı olarak döner',
  ],
  'order-bulk': [
    'Adet, ürün profili ve eşzamanlılık parametreleri girilir',
    'N adet sipariş paralel oluşturulur',
    'Başarılı / başarısız dağılımı ve süreler raporlanır',
    'Oluşan sipariş no listesi döner',
  ],
  'retail-invoice': [
    'Faturalanacak retail siparişi seçilir',
    'Satış faturası kesme akışı tetiklenir',
    'Fatura no ve e-belge durumu doğrulanır',
  ],
  'retail-return-invoice': [
    'İadesi yapılacak retail sipariş / kalem seçilir',
    'İade faturası oluşturma akışı tetiklenir',
    'İade fatura no ve tutar mutabakatı doğrulanır',
  ],
  'retail-shipment-advance': [
    'Retail siparişin mevcut kargo statüsü okunur',
    'Hedef statüye kadar adımlar sırayla ilerletilir',
    'Her adımda ilgili event / webhook’ların tetiklendiği doğrulanır',
  ],
  'merchant-shipment-advance': [
    '3. parti (merchant) sipariş seçilir',
    'Merchant kargo akışına göre statü adımları ilerletilir',
    'Retail’den farklı olan merchant entegrasyon adımları doğrulanır',
  ],
};
