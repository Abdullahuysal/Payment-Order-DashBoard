import {
  Activity,
  DatabaseZap,
  FlaskConical,
  Inbox,
  PackageSearch,
  ScrollText,
  TriangleAlert,
  type LucideIcon,
} from 'lucide-react';

export type ModuleId =
  'health' | 'test-runs' | 'test-data' | 'orders' | 'queues' | 'errors' | 'logs';

export interface SubPageDef {
  id: string;
  path: string;
  label: string;
  description: string;
}

export interface ModuleDef {
  id: ModuleId;
  path: string;
  label: string;
  description: string;
  icon: LucideIcon;
  implemented: boolean;
  children?: readonly SubPageDef[];
}

export const TEST_RUN_SCENARIOS: readonly SubPageDef[] = [
  {
    id: 'order-create',
    path: 'order-create',
    label: 'Sipariş Oluşturma',
    description: 'Tek bir siparişi uçtan uca oluşturur ve sistemde düştüğünü doğrular.',
  },
  {
    id: 'order-bulk',
    path: 'order-bulk',
    label: 'Çoklu Sipariş Oluşturma',
    description: 'Aynı anda çok sayıda sipariş üretir (yük / kapsam testi).',
  },
  {
    id: 'retail-invoice',
    path: 'retail-invoice',
    label: 'Retail Fatura Oluşturma',
    description: 'Boyner (retail) ürünleri için satış faturası kesme akışı.',
  },
  {
    id: 'retail-return-invoice',
    path: 'retail-return-invoice',
    label: 'Retail İade Faturası Oluşturma',
    description: 'Boyner (retail) ürünleri için iade faturası oluşturma akışı.',
  },
  {
    id: 'retail-shipment-advance',
    path: 'retail-shipment-advance',
    label: 'Retail Kargo Statü İlerletme',
    description: 'Retail siparişin kargo statüsünü hedef adıma kadar ilerletir.',
  },
  {
    id: 'merchant-shipment-advance',
    path: 'merchant-shipment-advance',
    label: 'Merchant Kargo Statü İlerletme',
    description: '3. parti (merchant) satıcı siparişinin kargo statüsünü ilerletir.',
  },
] as const;

export const MODULES: readonly ModuleDef[] = [
  {
    id: 'health',
    path: 'health',
    label: 'Servis Sağlığı',
    description: 'Uygulama alive endpoint’lerini yoklar; 200 → ayakta.',
    icon: Activity,
    implemented: true,
  },
  {
    id: 'test-runs',
    path: 'test-runs',
    label: 'Test Koşumları',
    description: 'QA senaryolarını seçili ortama karşı tetikler, pass/fail gösterir.',
    icon: FlaskConical,
    implemented: false,
    children: TEST_RUN_SCENARIOS,
  },
  {
    id: 'test-data',
    path: 'test-data',
    label: 'Test Verisi Üretici',
    description: 'Test müşterisi, sepet, sipariş ve kupon üretir; sonrasında temizler.',
    icon: DatabaseZap,
    implemented: false,
  },
  {
    id: 'orders',
    path: 'orders',
    label: 'Sipariş Kontrol',
    description: 'DB üzerinde sipariş durumu sorgular (read-only).',
    icon: PackageSearch,
    implemented: false,
  },
  {
    id: 'queues',
    path: 'queues',
    label: 'Mesaj Kuyrukları & DLQ',
    description:
      'Kafka/Rabbit topic’leri, consumer lag ve DLQ; mesaj görüntüle / yeniden kuyruğa al.',
    icon: Inbox,
    implemented: false,
  },
  {
    id: 'errors',
    path: 'errors',
    label: 'Hata Panosu',
    description:
      'Son dönemdeki hata imzaları, frekansı ve etkilenen siparişler; tek tık AI açıklaması.',
    icon: TriangleAlert,
    implemented: false,
  },
  {
    id: 'logs',
    path: 'logs',
    label: 'Log & AI',
    description: 'Elasticsearch log araması + sipariş için AI “ne oldu” yorumu.',
    icon: ScrollText,
    implemented: false,
  },
] as const;
