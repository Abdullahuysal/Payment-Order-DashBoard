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
    todo: {
      label: 'Todo',
      description: 'A simple per-person todo list — don’t forget what needs doing today.',
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
    jwt: {
      label: 'JWT Decoder',
      description:
        'Splits a JWT into parts; shows header and payload as readable JSON. No signature check.',
    },
    base64: {
      label: 'Base64 Convert',
      description:
        'Encodes text to UTF-8 base64 or decodes it; URL-safe alphabet and 76-char wrap.',
    },
    url: {
      label: 'URL / Query Parser',
      description:
        'Breaks a full URL or query string into parts; builds a query string from lines.',
    },
    timestamp: {
      label: 'Timestamp Convert',
      description:
        'Converts between epoch (s/ms) and ISO dates; local time zone and relative time.',
    },
    case: {
      label: 'Case Converter',
      description: 'Converts text to camel/pascal/snake/kebab/constant/sentence/title case.',
    },
    whitespace: {
      label: 'Whitespace / Invisible Cleaner',
      description: 'Trims trailing spaces, collapses blank lines, strips invisible characters.',
    },
    'json-flatten': {
      label: 'JSON Flatten / Unflatten',
      description: 'Flattens nested JSON to single-level `a.b.c` keys or expands them back.',
    },
    'json-csv': {
      label: 'JSON ↔ CSV',
      description: 'Converts a flat object array to CSV or turns CSV back into an object array.',
    },
    curl: {
      label: 'cURL Parse / Build',
      description:
        'Parses a cURL command into method/url/headers/body or builds a command from it.',
    },
    regex: {
      label: 'Regex Test',
      description:
        'Applies a pattern to the text; lists matches, replaces them, or splits the text.',
    },
    'number-base': {
      label: 'Number Base Convert',
      description: 'Converts integers between base 2/8/10/16 (BigInt); can show all bases at once.',
    },
    html: {
      label: 'HTML Minify / Format',
      description:
        'Indents HTML for readability or minifies to one line; handles void and raw elements.',
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
