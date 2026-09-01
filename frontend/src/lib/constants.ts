import {
  Activity,
  DatabaseZap,
  FlaskConical,
  Inbox,
  ListChecks,
  PackageSearch,
  ScrollText,
  TriangleAlert,
  Wrench,
  type LucideIcon,
} from 'lucide-react';

export type ModuleId =
  | 'health'
  | 'test-runs'
  | 'test-data'
  | 'orders'
  | 'queues'
  | 'errors'
  | 'logs'
  | 'dev-tools'
  | 'todo';

export type TestRunScenarioId =
  | 'order-create'
  | 'order-bulk'
  | 'retail-invoice'
  | 'retail-return-invoice'
  | 'retail-shipment-advance'
  | 'merchant-shipment-advance';

export type DevToolPageId =
  | 'json'
  | 'xml'
  | 'list'
  | 'sql-list'
  | 'jwt'
  | 'base64'
  | 'url'
  | 'timestamp'
  | 'case'
  | 'whitespace'
  | 'json-flatten'
  | 'json-csv'
  | 'curl'
  | 'regex'
  | 'number-base'
  | 'html';

export type SubPageId = TestRunScenarioId | DevToolPageId;

export interface SubPageDef {
  id: SubPageId;
  path: string;
}

export interface ModuleDef {
  id: ModuleId;
  path: string;
  icon: LucideIcon;
  implemented: boolean;
  children?: readonly SubPageDef[];
}

export const TEST_RUN_SCENARIOS: readonly SubPageDef[] = [
  { id: 'order-create', path: 'order-create' },
  { id: 'order-bulk', path: 'order-bulk' },
  { id: 'retail-invoice', path: 'retail-invoice' },
  { id: 'retail-return-invoice', path: 'retail-return-invoice' },
  { id: 'retail-shipment-advance', path: 'retail-shipment-advance' },
  { id: 'merchant-shipment-advance', path: 'merchant-shipment-advance' },
] as const;

export const DEV_TOOL_PAGES: readonly SubPageDef[] = [
  { id: 'json', path: 'json' },
  { id: 'xml', path: 'xml' },
  { id: 'list', path: 'list' },
  { id: 'sql-list', path: 'sql-list' },
  { id: 'jwt', path: 'jwt' },
  { id: 'base64', path: 'base64' },
  { id: 'url', path: 'url' },
  { id: 'timestamp', path: 'timestamp' },
  { id: 'case', path: 'case' },
  { id: 'whitespace', path: 'whitespace' },
  { id: 'json-flatten', path: 'json-flatten' },
  { id: 'json-csv', path: 'json-csv' },
  { id: 'curl', path: 'curl' },
  { id: 'regex', path: 'regex' },
  { id: 'number-base', path: 'number-base' },
  { id: 'html', path: 'html' },
] as const;

export const MODULES: readonly ModuleDef[] = [
  { id: 'health', path: 'health', icon: Activity, implemented: true },
  {
    id: 'test-runs',
    path: 'test-runs',
    icon: FlaskConical,
    implemented: true,
    children: TEST_RUN_SCENARIOS,
  },
  { id: 'test-data', path: 'test-data', icon: DatabaseZap, implemented: false },
  { id: 'orders', path: 'orders', icon: PackageSearch, implemented: true },
  { id: 'queues', path: 'queues', icon: Inbox, implemented: true },
  { id: 'errors', path: 'errors', icon: TriangleAlert, implemented: false },
  { id: 'logs', path: 'logs', icon: ScrollText, implemented: true },
  {
    id: 'dev-tools',
    path: 'dev-tools',
    icon: Wrench,
    implemented: true,
    children: DEV_TOOL_PAGES,
  },
  { id: 'todo', path: 'todo', icon: ListChecks, implemented: true },
] as const;
