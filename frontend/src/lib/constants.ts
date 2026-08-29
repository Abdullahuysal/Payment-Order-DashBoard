import { Activity, FlaskConical, PackageSearch, ScrollText, type LucideIcon } from 'lucide-react';

export type ModuleId = 'health' | 'test-runs' | 'orders' | 'logs';

export interface ModuleDef {
  id: ModuleId;
  path: string;
  label: string;
  description: string;
  icon: LucideIcon;
  implemented: boolean;
}

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
    description: 'QA senaryolarını tetikler, pass/fail sonucunu gösterir.',
    icon: FlaskConical,
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
    id: 'logs',
    path: 'logs',
    label: 'Log & AI',
    description: 'Elasticsearch log araması + sipariş için AI “ne oldu” yorumu.',
    icon: ScrollText,
    implemented: false,
  },
] as const;
