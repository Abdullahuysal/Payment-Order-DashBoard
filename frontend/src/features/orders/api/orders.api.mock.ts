import { HttpError } from '@/services/http';

import type { LookupField, LookupMatch, OrderDossier } from '../types';
import type { OrdersApi } from './orders.api';

const isoAgo = (minutes: number): string => new Date(Date.now() - minutes * 60_000).toISOString();

function latency<T>(value: T, ms = 260): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

const F1: OrderDossier = {
  orderId: 'ORD-1001',
  orderNumber: '30012345',
  channel: 'retail',
  status: { code: 'completed', label: 'Tamamlandı', tone: 'positive' },
  createdAt: isoAgo(6 * 24 * 60),
  updatedAt: isoAgo(2 * 24 * 60),
  customer: {
    id: '1002453',
    name: 'Ayşe Yılmaz',
    email: 'ayse.yilmaz@example.com',
    phone: '+90 532 000 00 00',
  },
  identifiers: [
    { key: 'orderNumber', label: 'Sipariş No', value: '30012345', copyable: true },
    { key: 'customerNo', label: 'Müşteri No', value: '1002453', copyable: true },
    { key: 'packageNo', label: 'Paket No', value: 'PKG-77001', copyable: true },
    { key: 'invoiceNo', label: 'Fatura No', value: 'FTR-100234', copyable: true },
    { key: 'trackingNo', label: 'Takip No', value: '7260012345', copyable: true },
  ],
  checks: [
    { key: 'transferred', label: 'Aktarım', state: 'ok', value: 'order-orchestrator’a düştü' },
    { key: 'payment', label: 'Ödeme', state: 'ok', value: 'Kredi kartı · ₺1.249,90' },
    {
      key: 'invoice',
      label: 'Fatura',
      state: 'ok',
      value: 'FTR-100234',
      links: [{ label: 'Log & AI', href: '/logs?orderNo=30012345&q=invoice' }],
    },
    { key: 'returnInvoice', label: 'İade Faturası', state: 'na' },
    { key: 'shipment', label: 'Kargo', state: 'ok', value: 'Teslim edildi · barkod 7260012345' },
    { key: 'refund', label: 'İade Bedeli', state: 'na' },
  ],
  sections: [
    {
      key: 'payment',
      title: 'Ödeme',
      kind: 'fields',
      applicable: true,
      state: 'ok',
      summary: 'Kredi kartı ile tek çekim, onaylandı.',
      fields: [
        { label: 'Yöntem', value: 'Kredi Kartı' },
        { label: 'Tutar', value: '₺1.249,90' },
        { label: 'Taksit', value: 'Tek çekim' },
        { label: 'PSP Ref', value: 'psp_9f22a1c7', copyable: true },
        { label: 'Onay', value: 'Onaylandı', tone: 'positive' },
      ],
    },
    {
      key: 'invoice',
      title: 'Fatura',
      kind: 'fields',
      applicable: true,
      state: 'ok',
      fields: [
        { label: 'Fatura No', value: 'FTR-100234', copyable: true },
        { label: 'Tarih', value: '24.08.2026 14:10' },
        { label: 'Tutar', value: '₺1.249,90' },
        { label: 'e-Belge', value: 'Gönderildi', tone: 'positive' },
      ],
    },
    {
      key: 'shipment',
      title: 'Kargo Hareketleri',
      kind: 'table',
      applicable: true,
      state: 'ok',
      summary: 'Barkod 7260012345 · 4 hareket',
      columns: [
        { key: 'step', label: 'Adım' },
        { key: 'at', label: 'Zaman' },
        { key: 'location', label: 'Konum' },
      ],
      rows: [
        { step: 'Hazırlandı', at: '25.08.2026 09:20', location: 'İstanbul Depo' },
        { step: 'Kargoya verildi', at: '25.08.2026 18:40', location: 'İstanbul Transfer' },
        { step: 'Dağıtımda', at: '27.08.2026 08:05', location: 'Ankara Şube' },
        { step: 'Teslim edildi', at: '27.08.2026 13:22', location: 'Ankara / Çankaya' },
      ],
    },
    {
      key: 'raw',
      title: 'Ham Kayıt',
      kind: 'json',
      applicable: true,
      json: {
        orderId: 'ORD-1001',
        source: 'order-orchestrator',
        lines: [{ sku: 'BOY-1002345', qty: 1, price: 1249.9 }],
        flags: { transferred: true, invoiced: true, shipped: true },
      },
    },
  ],
  timeline: [
    { at: isoAgo(6 * 24 * 60), source: 'checkout', label: 'Sipariş oluşturuldu', tone: 'neutral' },
    {
      at: isoAgo(6 * 24 * 60 - 3),
      source: 'order-orchestrator',
      label: 'Sipariş aktarıldı',
      tone: 'positive',
    },
    {
      at: isoAgo(5 * 24 * 60),
      source: 'invoicing',
      label: 'Satış faturası kesildi',
      detail: 'FTR-100234',
      tone: 'positive',
    },
    {
      at: isoAgo(3 * 24 * 60),
      source: 'shipment',
      label: 'Kargoya verildi',
      detail: '7260012345',
      tone: 'positive',
    },
    { at: isoAgo(2 * 24 * 60), source: 'shipment', label: 'Teslim edildi', tone: 'positive' },
  ],
  links: [
    { key: 'test-runs', label: 'Test Koşumları', href: '/test-runs' },
    { key: 'queues', label: 'Mesaj Kuyrukları', href: '/queues' },
    { key: 'logs', label: 'Log & AI', href: '/logs?orderNo=30012345' },
    { key: 'errors', label: 'Hata Panosu', href: '/errors?orderNo=30012345' },
  ],
  warnings: [],
  fetchedAt: isoAgo(0),
};

const F2: OrderDossier = {
  orderId: 'ORD-1002',
  orderNumber: '30012346',
  channel: 'merchant',
  merchantName: 'Moda Butik A.Ş.',
  status: { code: 'processing', label: 'İşleniyor', tone: 'warning' },
  createdAt: isoAgo(4 * 24 * 60),
  updatedAt: isoAgo(2 * 60),
  customer: { id: '1009988', name: 'Mehmet Demir', email: 'mehmet.demir@example.com' },
  identifiers: [
    { key: 'orderNumber', label: 'Sipariş No', value: '30012346', copyable: true },
    { key: 'customerNo', label: 'Müşteri No', value: '1009988', copyable: true },
    { key: 'merchantId', label: 'Satıcı No', value: 'M-1042', copyable: true },
    { key: 'packageNo', label: 'Paket No', value: 'PKG-77042', copyable: true },
    { key: 'trackingNo', label: 'Takip No', value: '7260088888', copyable: true },
  ],
  checks: [
    { key: 'transferred', label: 'Aktarım', state: 'ok', value: 'order-orchestrator’a düştü' },
    { key: 'payment', label: 'Ödeme', state: 'ok', value: 'Cüzdan · ₺529,00' },
    {
      key: 'invoice',
      label: 'Fatura',
      state: 'missing',
      detail: 'Satıcı faturası henüz kesilmedi.',
    },
    { key: 'returnInvoice', label: 'İade Faturası', state: 'na' },
    {
      key: 'shipment',
      label: 'Kargo',
      state: 'partial',
      value: 'Yolda',
      detail: 'Son hareket 2 gün önce; ara hareketler alınamadı.',
    },
    { key: 'refund', label: 'İade Bedeli', state: 'na' },
  ],
  sections: [
    {
      key: 'payment',
      title: 'Ödeme',
      kind: 'fields',
      applicable: true,
      state: 'ok',
      fields: [
        { label: 'Yöntem', value: 'Cüzdan' },
        { label: 'Tutar', value: '₺529,00' },
        { label: 'Onay', value: 'Onaylandı', tone: 'positive' },
      ],
    },
    {
      key: 'invoice',
      title: 'Fatura',
      kind: 'fields',
      applicable: true,
      state: 'missing',
      summary: 'Satıcı fatura servisi 503 döndü.',
      emptyText: 'Fatura kaydı bulunamadı — satıcı faturası bekleniyor.',
    },
    {
      key: 'shipment',
      title: 'Kargo Hareketleri',
      kind: 'table',
      applicable: true,
      state: 'partial',
      summary: 'Kısmi: 2 ara hareket alınamadı.',
      columns: [
        { key: 'step', label: 'Adım' },
        { key: 'at', label: 'Zaman' },
        { key: 'location', label: 'Konum' },
      ],
      rows: [
        { step: 'Hazırlandı', at: '28.08.2026 11:00', location: 'İzmir Depo' },
        { step: 'Kargoya verildi', at: '28.08.2026 20:15', location: 'İzmir Transfer' },
      ],
    },
    {
      key: 'raw',
      title: 'Ham Kayıt',
      kind: 'json',
      applicable: true,
      json: {
        orderId: 'ORD-1002',
        merchant: { id: 'M-1042', name: 'Moda Butik A.Ş.' },
        flags: { transferred: true, invoiced: false, shipped: 'partial' },
        errors: ['merchant-invoice: 503', 'shipment-tracking: partial'],
      },
    },
  ],
  timeline: [
    { at: isoAgo(4 * 24 * 60), source: 'checkout', label: 'Sipariş oluşturuldu', tone: 'neutral' },
    {
      at: isoAgo(4 * 24 * 60 - 2),
      source: 'order-orchestrator',
      label: 'Sipariş aktarıldı',
      tone: 'positive',
    },
    {
      at: isoAgo(2 * 24 * 60),
      source: 'shipment',
      label: 'Kargoya verildi',
      detail: '7260088888',
      tone: 'positive',
    },
    {
      at: isoAgo(3 * 60),
      source: 'merchant-invoice',
      label: 'Fatura servisi 503',
      detail: 'Yeniden denenecek',
      tone: 'critical',
    },
  ],
  links: [
    { key: 'queues', label: 'Mesaj Kuyrukları', href: '/queues' },
    { key: 'logs', label: 'Log & AI', href: '/logs?orderNo=30012346' },
    { key: 'errors', label: 'Hata Panosu', href: '/errors?orderNo=30012346' },
  ],
  warnings: [
    'Kısmi veri: kargo servisi (shipment-tracking) 2 hareketi döndüremedi.',
    'Satıcı fatura servisi 503 döndü; fatura durumu güncel olmayabilir.',
  ],
  fetchedAt: isoAgo(0),
};

const F3: OrderDossier = {
  orderId: 'ORD-1003',
  orderNumber: '30012347',
  channel: 'retail',
  status: { code: 'pending_transfer', label: 'Aktarım bekliyor', tone: 'critical' },
  createdAt: isoAgo(90),
  updatedAt: isoAgo(80),
  customer: { id: '1005511', name: 'Zeynep Kaya' },
  identifiers: [
    { key: 'orderNumber', label: 'Sipariş No', value: '30012347', copyable: true },
    { key: 'customerNo', label: 'Müşteri No', value: '1005511', copyable: true },
  ],
  checks: [
    {
      key: 'transferred',
      label: 'Aktarım',
      state: 'missing',
      detail: 'Sipariş order-orchestrator’a düşmedi (60+ dk).',
      links: [{ label: 'Mesaj Kuyrukları', href: '/queues' }],
    },
    { key: 'payment', label: 'Ödeme', state: 'ok', value: 'Kredi kartı · ₺318,50' },
    { key: 'invoice', label: 'Fatura', state: 'na' },
    { key: 'returnInvoice', label: 'İade Faturası', state: 'na' },
    {
      key: 'shipment',
      label: 'Kargo',
      state: 'unknown',
      detail: 'Sipariş aktarılmadığı için kargo durumu sorgulanamıyor.',
    },
    { key: 'refund', label: 'İade Bedeli', state: 'na' },
  ],
  sections: [
    {
      key: 'payment',
      title: 'Ödeme',
      kind: 'fields',
      applicable: true,
      state: 'ok',
      fields: [
        { label: 'Yöntem', value: 'Kredi Kartı' },
        { label: 'Tutar', value: '₺318,50' },
        { label: 'Onay', value: 'Onaylandı', tone: 'positive' },
      ],
    },
    {
      key: 'fulfillment',
      title: 'Sipariş Kalemleri',
      kind: 'table',
      applicable: true,
      state: 'missing',
      columns: [
        { key: 'sku', label: 'SKU' },
        { key: 'qty', label: 'Adet' },
        { key: 'status', label: 'Durum' },
      ],
      rows: [],
      emptyText: 'Aktarım tamamlanmadığı için kalem kaydı yok.',
    },
    {
      key: 'invoice',
      title: 'Fatura',
      kind: 'fields',
      applicable: false,
    },
    {
      key: 'raw',
      title: 'Ham Kayıt',
      kind: 'json',
      applicable: true,
      json: {
        orderId: 'ORD-1003',
        source: 'checkout',
        flags: { transferred: false, invoiced: false, shipped: false },
        lastAttempt: { at: isoAgo(15), result: 'no-ack' },
      },
    },
  ],
  timeline: [
    { at: isoAgo(90), source: 'checkout', label: 'Sipariş oluşturuldu', tone: 'neutral' },
    { at: isoAgo(88), source: 'payment', label: 'Ödeme onaylandı', tone: 'positive' },
    {
      at: isoAgo(15),
      source: 'order-orchestrator',
      label: 'Aktarım denendi — yanıt yok',
      tone: 'critical',
    },
  ],
  links: [
    { key: 'queues', label: 'Mesaj Kuyrukları', href: '/queues' },
    { key: 'errors', label: 'Hata Panosu', href: '/errors?orderNo=30012347' },
    { key: 'logs', label: 'Log & AI', href: '/logs?orderNo=30012347' },
  ],
  warnings: [],
  fetchedAt: isoAgo(0),
};

const F4: OrderDossier = {
  orderId: 'ORD-1004',
  orderNumber: '30012348',
  channel: 'retail',
  status: { code: 'returned', label: 'İade tamamlandı', tone: 'positive' },
  createdAt: isoAgo(20 * 24 * 60),
  updatedAt: isoAgo(3 * 24 * 60),
  customer: {
    id: '1002453',
    name: 'Ayşe Yılmaz',
    email: 'ayse.yilmaz@example.com',
  },
  identifiers: [
    { key: 'orderNumber', label: 'Sipariş No', value: '30012348', copyable: true },
    { key: 'customerNo', label: 'Müşteri No', value: '1002453', copyable: true },
    { key: 'invoiceNo', label: 'Fatura No', value: 'FTR-100812', copyable: true },
    { key: 'returnInvoiceNo', label: 'İade Fatura No', value: 'IAD-100233', copyable: true },
  ],
  checks: [
    { key: 'transferred', label: 'Aktarım', state: 'ok' },
    { key: 'payment', label: 'Ödeme', state: 'ok', value: 'Kredi kartı · ₺430,00' },
    { key: 'invoice', label: 'Fatura', state: 'ok', value: 'FTR-100812' },
    { key: 'returnInvoice', label: 'İade Faturası', state: 'ok', value: 'IAD-100233' },
    { key: 'shipment', label: 'Kargo', state: 'ok', value: 'Teslim edildi, sonra iade alındı' },
    { key: 'refund', label: 'İade Bedeli', state: 'ok', value: '₺430,00 · iade edildi' },
  ],
  sections: [
    {
      key: 'payment',
      title: 'Ödeme',
      kind: 'fields',
      applicable: true,
      state: 'ok',
      fields: [
        { label: 'Yöntem', value: 'Kredi Kartı' },
        { label: 'Tutar', value: '₺430,00' },
        { label: 'İade', value: 'Tam iade', tone: 'positive' },
      ],
    },
    {
      key: 'invoice',
      title: 'Fatura',
      kind: 'fields',
      applicable: true,
      state: 'ok',
      fields: [
        { label: 'Fatura No', value: 'FTR-100812', copyable: true },
        { label: 'Tutar', value: '₺430,00' },
      ],
    },
    {
      key: 'returnInvoice',
      title: 'İade Faturası',
      kind: 'fields',
      applicable: true,
      state: 'ok',
      fields: [
        { label: 'İade Fatura No', value: 'IAD-100233', copyable: true },
        { label: 'Tarih', value: '27.08.2026 10:05' },
        { label: 'Tutar', value: '₺430,00' },
        { label: 'Neden', value: 'Müşteri vazgeçti' },
      ],
    },
    {
      key: 'refund',
      title: 'İade Bedeli',
      kind: 'fields',
      applicable: true,
      state: 'ok',
      fields: [
        { label: 'Tutar', value: '₺430,00' },
        { label: 'Kanal', value: 'Kredi kartına iade' },
        { label: 'Durum', value: 'Tamamlandı', tone: 'positive' },
        { label: 'PSP Ref', value: 'psp_ref_4410', copyable: true },
      ],
    },
    {
      key: 'shipment',
      title: 'Kargo Hareketleri',
      kind: 'table',
      applicable: true,
      state: 'ok',
      columns: [
        { key: 'step', label: 'Adım' },
        { key: 'at', label: 'Zaman' },
      ],
      rows: [
        { step: 'Teslim edildi', at: '15.08.2026 12:00' },
        { step: 'İade talebi', at: '20.08.2026 09:30' },
        { step: 'İade kargosu alındı', at: '24.08.2026 16:40' },
      ],
    },
    {
      key: 'raw',
      title: 'Ham Kayıt',
      kind: 'json',
      applicable: true,
      json: {
        orderId: 'ORD-1004',
        flags: { transferred: true, invoiced: true, returned: true, refunded: true },
      },
    },
  ],
  timeline: [
    { at: isoAgo(20 * 24 * 60), source: 'checkout', label: 'Sipariş oluşturuldu', tone: 'neutral' },
    { at: isoAgo(18 * 24 * 60), source: 'shipment', label: 'Teslim edildi', tone: 'positive' },
    { at: isoAgo(10 * 24 * 60), source: 'returns', label: 'İade talebi açıldı', tone: 'warning' },
    {
      at: isoAgo(6 * 24 * 60),
      source: 'invoicing',
      label: 'İade faturası kesildi',
      detail: 'IAD-100233',
      tone: 'positive',
    },
    {
      at: isoAgo(3 * 24 * 60),
      source: 'payment',
      label: 'İade bedeli aktarıldı',
      detail: '₺430,00',
      tone: 'positive',
    },
  ],
  links: [
    { key: 'logs', label: 'Log & AI', href: '/logs?orderNo=30012348' },
    { key: 'test-runs', label: 'Test Koşumları', href: '/test-runs/retail-return-invoice' },
  ],
  warnings: [],
  fetchedAt: isoAgo(0),
};

const F6: OrderDossier = {
  orderId: 'ORD-1006',
  orderNumber: '30012349',
  channel: 'mixed',
  status: { code: 'partially_shipped', label: 'Kısmen kargolandı', tone: 'warning' },
  createdAt: isoAgo(3 * 24 * 60),
  updatedAt: isoAgo(5 * 60),
  customer: { id: '1007700', name: 'Can Aksoy', phone: '+90 555 111 22 33' },
  identifiers: [
    { key: 'orderNumber', label: 'Sipariş No', value: '30012349', copyable: true },
    { key: 'customerNo', label: 'Müşteri No', value: '1007700', copyable: true },
    { key: 'packageNoRetail', label: 'Retail Paket', value: 'PKG-A-9001', copyable: true },
    { key: 'packageNoMerchant', label: 'Merchant Paket', value: 'PKG-B-9002', copyable: true },
  ],
  checks: [
    { key: 'transferred', label: 'Aktarım', state: 'ok' },
    { key: 'payment', label: 'Ödeme', state: 'ok', value: 'Kredi kartı · ₺1.780,00' },
    {
      key: 'invoice',
      label: 'Fatura',
      state: 'partial',
      detail: 'Retail kalem faturalandı; merchant kalem satıcıdan bekleniyor.',
    },
    { key: 'returnInvoice', label: 'İade Faturası', state: 'na' },
    {
      key: 'shipment',
      label: 'Kargo',
      state: 'partial',
      value: '1/2 paket teslim edildi',
    },
    { key: 'refund', label: 'İade Bedeli', state: 'na' },
  ],
  sections: [
    {
      key: 'payment',
      title: 'Ödeme',
      kind: 'fields',
      applicable: true,
      state: 'ok',
      fields: [
        { label: 'Yöntem', value: 'Kredi Kartı' },
        { label: 'Tutar', value: '₺1.780,00' },
        { label: 'Taksit', value: '3 taksit' },
      ],
    },
    {
      key: 'items',
      title: 'Kalemler (paket bazında)',
      kind: 'table',
      applicable: true,
      state: 'partial',
      summary: 'PKG-A retail · PKG-B merchant',
      columns: [
        { key: 'paket', label: 'Paket' },
        { key: 'kanal', label: 'Kanal' },
        { key: 'sku', label: 'SKU' },
        { key: 'adet', label: 'Adet' },
        { key: 'durum', label: 'Durum' },
      ],
      rows: [
        {
          paket: 'PKG-A-9001',
          kanal: 'retail',
          sku: 'BOY-2200145',
          adet: 1,
          durum: 'Teslim edildi',
        },
        {
          paket: 'PKG-A-9001',
          kanal: 'retail',
          sku: 'BOY-2200146',
          adet: 2,
          durum: 'Teslim edildi',
        },
        { paket: 'PKG-B-9002', kanal: 'merchant', sku: 'MRC-5590021', adet: 1, durum: 'Kargoda' },
        {
          paket: 'PKG-B-9002',
          kanal: 'merchant',
          sku: 'MRC-5590022',
          adet: 1,
          durum: 'Hazırlanıyor',
        },
      ],
    },
    {
      key: 'shipment',
      title: 'Kargo (paket bazında)',
      kind: 'table',
      applicable: true,
      state: 'partial',
      columns: [
        { key: 'paket', label: 'Paket' },
        { key: 'barkod', label: 'Barkod' },
        { key: 'durum', label: 'Durum' },
        { key: 'guncelleme', label: 'Güncelleme' },
      ],
      rows: [
        {
          paket: 'PKG-A-9001',
          barkod: '7260099001',
          durum: 'Teslim edildi',
          guncelleme: '29.08.2026 10:12',
        },
        {
          paket: 'PKG-B-9002',
          barkod: '7260099002',
          durum: 'Yolda',
          guncelleme: '30.08.2026 08:40',
        },
      ],
    },
    {
      key: 'raw',
      title: 'Ham Kayıt',
      kind: 'json',
      applicable: true,
      json: {
        orderId: 'ORD-1006',
        channel: 'mixed',
        packages: [
          { id: 'PKG-A-9001', channel: 'retail', delivered: true },
          { id: 'PKG-B-9002', channel: 'merchant', delivered: false },
        ],
      },
    },
  ],
  timeline: [
    { at: isoAgo(3 * 24 * 60), source: 'checkout', label: 'Sipariş oluşturuldu', tone: 'neutral' },
    {
      at: isoAgo(3 * 24 * 60 - 4),
      source: 'order-orchestrator',
      label: 'Sipariş aktarıldı (2 paket)',
      tone: 'positive',
    },
    { at: isoAgo(30 * 60), source: 'shipment', label: 'PKG-A teslim edildi', tone: 'positive' },
    { at: isoAgo(5 * 60), source: 'shipment', label: 'PKG-B yola çıktı', tone: 'neutral' },
  ],
  links: [
    { key: 'queues', label: 'Mesaj Kuyrukları', href: '/queues' },
    { key: 'logs', label: 'Log & AI', href: '/logs?orderNo=30012349' },
  ],
  warnings: ['Karma sipariş: merchant kalemlerin fatura durumu satıcıdan bekleniyor.'],
  fetchedAt: isoAgo(0),
};

const DOSSIERS: Record<string, OrderDossier> = {
  [F1.orderId]: F1,
  [F2.orderId]: F2,
  [F3.orderId]: F3,
  [F4.orderId]: F4,
  [F6.orderId]: F6,
};

const BY_ORDER_NUMBER: Record<string, string> = Object.fromEntries(
  Object.values(DOSSIERS).map((d) => [d.orderNumber, d.orderId]),
);

const LOOKUP_INDEX: Record<Exclude<LookupField, 'orderNumber'>, Record<string, string[]>> = {
  customerNo: {
    '1002453': ['ORD-1001', 'ORD-1004'],
    '1009988': ['ORD-1002'],
    '1005511': ['ORD-1003'],
    '1007700': ['ORD-1006'],
  },
  packageNo: {
    'PKG-77001': ['ORD-1001'],
    'PKG-77042': ['ORD-1002'],
    'PKG-A-9001': ['ORD-1006'],
    'PKG-B-9002': ['ORD-1006'],
  },
  invoiceNo: {
    'FTR-100234': ['ORD-1001'],
    'FTR-100812': ['ORD-1004'],
    'IAD-100233': ['ORD-1004'],
  },
  trackingNo: {
    '7260012345': ['ORD-1001'],
    '7260088888': ['ORD-1002'],
    '7260099001': ['ORD-1006'],
    '7260099002': ['ORD-1006'],
  },
};

function toMatch(orderId: string): LookupMatch | undefined {
  const d = DOSSIERS[orderId];
  if (!d) return undefined;
  return {
    orderId: d.orderId,
    orderNumber: d.orderNumber,
    channel: d.channel,
    status: { label: d.status.label, tone: d.status.tone },
    createdAt: d.createdAt,
  };
}

function notFound(orderId: string): HttpError {
  return new HttpError({
    status: 404,
    message: `Sipariş bulunamadı: ${orderId}`,
    url: `/api/v1/orders/${orderId}`,
    code: 'NOT_FOUND',
  });
}

export const mockOrdersApi: OrdersApi = {
  getDossier(_env, orderId) {
    const key = BY_ORDER_NUMBER[orderId] ?? orderId;
    const dossier = DOSSIERS[key];
    if (!dossier) return Promise.reject(notFound(orderId));
    return latency({ ...structuredClone(dossier), fetchedAt: new Date().toISOString() });
  },

  lookup(_env, field, value) {
    const trimmed = value.trim();
    if (field === 'orderNumber') {
      const orderId = BY_ORDER_NUMBER[trimmed];
      const match = orderId ? toMatch(orderId) : undefined;
      return latency({ matches: match ? [match] : [] });
    }
    const ids = LOOKUP_INDEX[field][trimmed] ?? [];
    const matches = ids.map(toMatch).filter((m): m is LookupMatch => m !== undefined);
    return latency({ matches });
  },
};

export const MOCK_ORDER_SAMPLES = [
  '30012345',
  '30012346',
  '30012347',
  '30012348',
  '30012349',
  '39999999',
] as const;
