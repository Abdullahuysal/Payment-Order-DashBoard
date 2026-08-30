import { type ReactNode } from 'react';

import { cn } from '@/lib/cn';

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-2">
      <h3 className="text-[11px] font-semibold uppercase tracking-wide text-fg-subtle">{title}</h3>
      {children}
    </section>
  );
}

export function StatGrid({ children }: { children: ReactNode }) {
  return <dl className="grid grid-cols-2 gap-2 sm:grid-cols-3">{children}</dl>;
}

export function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: ReactNode;
  tone?: 'up' | 'degraded' | 'down' | 'neutral' | undefined;
}) {
  return (
    <div className="rounded-md border border-border bg-bg px-2.5 py-2">
      <dt className="text-[11px] text-fg-subtle">{label}</dt>
      <dd
        className={cn(
          'tnum mt-0.5 text-sm font-semibold text-fg',
          tone === 'up' && 'text-status-up',
          tone === 'degraded' && 'text-status-degraded',
          tone === 'down' && 'text-status-down',
        )}
      >
        {value}
      </dd>
    </div>
  );
}

export function KeyValueList({ data }: { data: Record<string, unknown> | undefined }) {
  const entries = data ? Object.entries(data) : [];
  if (entries.length === 0) {
    return <p className="text-xs text-fg-subtle">—</p>;
  }
  return (
    <dl className="divide-y divide-border rounded-md border border-border">
      {entries.map(([key, value]) => (
        <div key={key} className="grid grid-cols-[9rem_1fr] gap-2 px-2.5 py-1.5">
          <dt className="tnum truncate text-[11px] text-fg-subtle" title={key}>
            {key}
          </dt>
          <dd className="tnum break-all text-[11px] text-fg-muted">{stringify(value)}</dd>
        </div>
      ))}
    </dl>
  );
}

function stringify(value: unknown): string {
  if (value == null) return '—';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  try {
    return JSON.stringify(value) ?? '—';
  } catch {
    return '[döngüsel nesne]';
  }
}

export function CodeBlock({ text }: { text: string | undefined }) {
  return (
    <pre className="tnum max-h-64 overflow-auto rounded-md border border-border bg-bg px-2.5 py-2 text-[11px] leading-relaxed text-fg-muted">
      {text && text.length > 0 ? text : '— boş —'}
    </pre>
  );
}
