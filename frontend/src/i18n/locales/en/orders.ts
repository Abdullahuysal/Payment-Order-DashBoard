import type trOrders from '../tr/orders';

const orders: typeof trOrders = {
  page: {
    title: 'Order Lookup',
    subtitle:
      'The full dossier of an order from a single number: was it transferred, is there an invoice / return invoice / shipment — against {{env}}, read-only.',
  },
  search: {
    fieldAria: 'Search field',
    valueAria: 'Search value',
    submit: 'Search',
  },
  fields: {
    orderNumber: 'Order No',
    customerNo: 'Customer No',
    packageNo: 'Package No',
    invoiceNo: 'Invoice No',
    trackingNo: 'Tracking No',
  },
  results: {
    heading: 'Results',
    error: 'Search failed: {{message}}',
    empty: 'No matches. Check the field and value; open directly with “Order No”.',
    count_one: '{{count}} match',
    count_other: '{{count}} matches',
  },
  how: {
    heading: 'How it works',
    body: 'The default field is <b>Order No</b>; press Enter to jump straight to the order dossier. Pick Customer No / Package No / Invoice No / Tracking No to list matching orders. Press <k>/</k> to focus search.',
    sampleLabel: 'Example (mock):',
  },
  mockSamples: {
    '30012345': 'Retail — full dossier complete',
    '30012346': 'Merchant — partial shipment, no invoice, warnings',
    '30012347': 'Order not transferred',
    '30012348': 'Return + refund',
    '30012349': 'Mixed — line items per package',
    '39999999': '404 — not found',
  },
  dossier: {
    loadError: 'Could not load the order dossier: {{message}}',
    timestamps: 'Created {{created}} · updated {{updated}}',
    fetched: 'fetched {{relative}}',
    copySummary: 'Copy summary',
    timelineTitle: 'Timeline',
    relatedPanels: 'Related panels',
    back: '← Back to order search',
  },
  prodDisabled: {
    title: 'Order Lookup is disabled in prod',
    body: 'This module only runs in <k>dev</k> and <k>preprod</k>. Switch the environment from the Topbar to continue.',
  },
  notFound: {
    title: 'Order not found',
    body: 'No record for <k>{{orderId}}</k> in the selected environment. The number or the environment may be wrong.',
    back: 'Back to search',
  },
  channel: {
    retail: 'Retail',
    merchant: 'Merchant',
    mixed: 'Mixed',
  },
  checkState: {
    ok: 'OK',
    missing: 'Missing',
    partial: 'Partial',
    na: 'Not applicable',
    unknown: 'Unknown',
    short: {
      ok: '✓',
      missing: 'missing',
      partial: 'partial',
      na: '—',
      unknown: '?',
    },
  },
  section: {
    notApplicable: 'Not applicable for this order.',
    noFields: 'No records.',
    noRows: 'No rows to show.',
    openJson: 'Open JSON',
    rawRecord: 'Raw record',
  },
  timeline: {
    empty: 'No timeline entries.',
  },
  warnings: {
    title: 'Partial data',
  },
  recent: {
    heading: 'Recently viewed',
  },
  summary: {
    order: 'Order {{orderNumber}}',
    orderMerchant: 'Order {{orderNumber}} (merchant: {{merchantName}})',
    status: 'status: {{status}}',
  },
  raw: {
    object: '[object]',
    unserializable: '[unserializable]',
  },
};

export default orders;
