import type trNav from '../tr/nav';

const nav: typeof trNav = {
  modules: {
    health: {
      label: 'Service Health',
      description: 'Pings each app’s alive endpoint; 200 → up.',
    },
    'test-runs': {
      label: 'Test Runs',
      description:
        'Runs end-to-end test scenarios against the selected environment, step-by-step pass/fail.',
    },
    'test-data': {
      label: 'Test Data Generator',
      description: 'Generates a test customer, cart, order and coupon; cleans up afterwards.',
      planned: [
        'Pick a scenario: single customer, full cart, paid order, returnable order…',
        'Seed test data into the selected environment; generated ids (customer no, order no) are listed',
        'Hand off to the matching Test Run scenario in one click',
        'Tag generated records and bulk-clean them',
      ],
    },
    orders: {
      label: 'Order Lookup',
      description: 'Queries order status against the DB (read-only).',
    },
    queues: {
      label: 'Message Queues & DLQ',
      description:
        'RabbitMQ/Kafka queues and topics, consumer lag, DLQ and alerts; message preview (read-only).',
    },
    errors: {
      label: 'Error Board',
      description:
        'Recent error signatures, their frequency and affected orders; one-click AI explanation.',
      planned: [
        'Error signatures over the last N hours: frequency, first / last seen, affected order count',
        'Click a signature: sample stacktrace, related traceIds, likely service',
        'One-click “what happened” AI summary and suggested owner',
        'Fed from Elasticsearch / Sentry',
      ],
    },
    logs: {
      label: 'Logs & AI',
      description: 'Elasticsearch log search + an AI “what happened” take for an order.',
      planned: [
        'Free-text + field-based log search over Elasticsearch',
        'Automatic correlation by order context (traceId / orderId)',
        'An AI “what happened” summary for the selected log window',
      ],
    },
    'dev-tools': {
      label: 'Developer Tools',
      description:
        'Everyday helpers: JSON/XML formatting, list dedupe, SQL list building — the backend does the work.',
    },
  },
  subpages: {
    'order-create': {
      label: 'Order Creation',
      description: 'Creates a single order end-to-end and verifies it landed in the system.',
    },
    'order-bulk': {
      label: 'Bulk Order Creation',
      description: 'Generates many orders at once (load / coverage test).',
    },
    'retail-invoice': {
      label: 'Retail Invoice Creation',
      description: 'Sales invoice flow for Boyner (retail) products.',
    },
    'retail-return-invoice': {
      label: 'Retail Return Invoice Creation',
      description: 'Return invoice flow for Boyner (retail) products.',
    },
    'retail-shipment-advance': {
      label: 'Retail Shipment Status Advance',
      description: 'Advances a retail order’s shipment status up to a target step.',
    },
    'merchant-shipment-advance': {
      label: 'Merchant Shipment Status Advance',
      description: 'Advances a third-party (merchant) seller order’s shipment status.',
    },
    json: {
      label: 'JSON Formatter',
      description: 'Validates JSON; indents, sorts keys or minifies to a single line.',
    },
    xml: {
      label: 'XML Formatter',
      description: 'Parses XML; indents for readability or minifies to a single line.',
    },
    list: {
      label: 'List Deduplicator',
      description: 'Drops duplicates from a line list; trims, removes blanks, sorts.',
    },
    'sql-list': {
      label: 'SQL List Builder',
      description: 'Quotes rows, adds prefix/suffix, joins into a single IN (…) expression.',
    },
  },
  crumbs: {
    runHistory: 'Run history',
    run: 'Run',
    order: 'Order',
  },
  home: {
    eyebrow: 'Boyner · Payment & Order',
    title: 'Ops Panel',
    intro:
      'One console for the day-to-day ops work of the payment & order team’s developers and QA. Watch service health, run test scenarios, look up order status, interpret logs with AI — all against the selected environment.',
    ctaHealth: 'Go to Service Health',
    activeEnv: 'Active environment:',
    tags: {
      active: 'Active',
      soon: 'Soon',
    },
    footer:
      'Phase 0 — shell and architecture. Service Health runs on typed mock data; other modules are placeholders. Real backend integration comes in later phases.',
  },
};

export default nav;
