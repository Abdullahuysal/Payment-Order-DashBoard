export type OrderChannel = 'retail' | 'merchant' | 'mixed';

export type StatusTone = 'neutral' | 'positive' | 'warning' | 'critical';

export type CheckState = 'ok' | 'missing' | 'partial' | 'na' | 'unknown';

export type SectionKind = 'fields' | 'table' | 'json';

export type LookupField = 'orderNumber' | 'customerNo' | 'packageNo' | 'invoiceNo' | 'trackingNo';

export type CheckKey =
  'transferred' | 'payment' | 'invoice' | 'returnInvoice' | 'shipment' | 'refund';

export interface OrderStatus {
  code: string;
  label: string;
  tone: StatusTone;
}

export interface OrderCustomer {
  id: string;
  name?: string | undefined;
  email?: string | undefined;
  phone?: string | undefined;
}

export interface Identifier {
  key: string;
  label: string;
  value: string;
  copyable: boolean;
}

export interface CheckLink {
  label: string;
  href: string;
}

export interface CheckItem {
  key: string;
  label: string;
  state: CheckState;
  value?: string | undefined;
  detail?: string | undefined;
  links?: CheckLink[] | undefined;
}

export interface SectionField {
  label: string;
  value: string;
  copyable?: boolean | undefined;
  tone?: StatusTone | undefined;
}

export interface SectionColumn {
  key: string;
  label: string;
}

export interface Section {
  key: string;
  title: string;
  kind: SectionKind;
  applicable: boolean;
  state?: CheckState | undefined;
  summary?: string | undefined;
  fields?: SectionField[] | undefined;
  columns?: SectionColumn[] | undefined;
  rows?: Array<Record<string, unknown>> | undefined;
  json?: unknown;
  emptyText?: string | undefined;
}

export interface TimelineEvent {
  at: string;
  source: string;
  label: string;
  detail?: string | undefined;
  tone?: StatusTone | undefined;
}

export interface LinkItem {
  key: string;
  label: string;
  href: string;
}

export interface OrderDossier {
  orderId: string;
  orderNumber: string;
  channel: OrderChannel;
  merchantName?: string | undefined;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
  customer: OrderCustomer;
  identifiers: Identifier[];
  checks: CheckItem[];
  sections: Section[];
  timeline: TimelineEvent[];
  links: LinkItem[];
  warnings: string[];
  fetchedAt: string;
}

export interface LookupMatch {
  orderId: string;
  orderNumber: string;
  channel: OrderChannel;
  status: {
    label: string;
    tone: StatusTone;
  };
  createdAt: string;
}

export interface LookupResponse {
  matches: LookupMatch[];
}

export interface RecentLookup {
  orderId: string;
  orderNumber: string;
  channel: OrderChannel;
  statusLabel: string;
  statusTone: StatusTone;
  viewedAt: string;
}
