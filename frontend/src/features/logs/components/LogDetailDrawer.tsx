import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { Badge, CopyButton, Drawer } from '@/components/ui';
import { formatDateTime } from '@/lib/format';

import { LEVEL_TONE } from '../lib';
import type { LogEntry } from '../types';

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[8rem_1fr] gap-2 px-2.5 py-1.5">
      <dt className="text-[11px] text-fg-subtle">{label}</dt>
      <dd className="tnum break-all text-[11px] text-fg-muted">{children}</dd>
    </div>
  );
}

function stringify(value: unknown): string {
  if (value == null) return '—';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  try {
    return JSON.stringify(value) ?? '—';
  } catch {
    return '[?]';
  }
}

export function LogDetailDrawer({
  entry,
  onClose,
}: {
  entry: LogEntry | null;
  onClose: () => void;
}) {
  const { t } = useTranslation('logs');
  const f = (
    key:
      | 'timestamp'
      | 'level'
      | 'service'
      | 'logger'
      | 'traceId'
      | 'spanId'
      | 'orderId'
      | 'exceptionType',
  ) => t(`detail.fields.${key}`);
  const rawEntries = entry?.fields ? Object.entries(entry.fields) : [];

  return (
    <Drawer
      open={entry !== null}
      onClose={onClose}
      width="lg"
      title={t('detail.title')}
      subtitle={entry ? formatDateTime(entry.timestamp) : undefined}
      actions={
        entry?.traceId ? (
          <CopyButton value={entry.traceId} idleLabel={t('detail.copyTrace')} />
        ) : undefined
      }
    >
      {entry && (
        <div className="space-y-4">
          <dl className="divide-y divide-border rounded-md border border-border">
            <Row label={f('timestamp')}>{formatDateTime(entry.timestamp)}</Row>
            <Row label={f('level')}>
              <Badge tone={LEVEL_TONE[entry.level]} mono>
                {t(`levels.${entry.level}`)}
              </Badge>
            </Row>
            <Row label={f('service')}>{entry.service}</Row>
            {entry.logger != null && <Row label={f('logger')}>{entry.logger}</Row>}
            {entry.traceId != null && <Row label={f('traceId')}>{entry.traceId}</Row>}
            {entry.spanId != null && <Row label={f('spanId')}>{entry.spanId}</Row>}
            {entry.orderId != null && <Row label={f('orderId')}>{entry.orderId}</Row>}
            {entry.exceptionType != null && (
              <Row label={f('exceptionType')}>{entry.exceptionType}</Row>
            )}
          </dl>

          <section className="space-y-1.5">
            <h3 className="text-[11px] font-semibold uppercase tracking-wide text-fg-subtle">
              {t('detail.message')}
            </h3>
            <p className="rounded-md border border-border bg-bg px-2.5 py-2 text-xs leading-relaxed text-fg">
              {entry.message}
            </p>
          </section>

          {rawEntries.length > 0 && (
            <section className="space-y-1.5">
              <h3 className="text-[11px] font-semibold uppercase tracking-wide text-fg-subtle">
                {t('detail.rawFields')}
              </h3>
              <dl className="divide-y divide-border rounded-md border border-border">
                {rawEntries.map(([key, value]) => (
                  <div key={key} className="grid grid-cols-[10rem_1fr] gap-2 px-2.5 py-1.5">
                    <dt className="tnum truncate text-[11px] text-fg-subtle" title={key}>
                      {key}
                    </dt>
                    <dd className="tnum break-all text-[11px] text-fg-muted">{stringify(value)}</dd>
                  </div>
                ))}
              </dl>
            </section>
          )}

          <section className="space-y-1.5">
            <h3 className="text-[11px] font-semibold uppercase tracking-wide text-fg-subtle">
              {t('detail.stackTrace')}
            </h3>
            {entry.stackTrace ? (
              <pre className="tnum max-h-80 overflow-auto rounded-md border border-border bg-bg px-2.5 py-2 text-[11px] leading-relaxed text-fg-muted">
                {entry.stackTrace}
              </pre>
            ) : (
              <p className="text-[11px] text-fg-subtle">{t('detail.noStackTrace')}</p>
            )}
          </section>
        </div>
      )}
    </Drawer>
  );
}
