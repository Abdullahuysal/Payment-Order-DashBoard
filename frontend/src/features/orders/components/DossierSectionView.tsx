import { useState } from 'react';
import { Braces } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Badge, Card, CardBody, CardHeader, CardTitle, CopyButton, Drawer } from '@/components/ui';
import { cn } from '@/lib/cn';

import { cellText, prettyJson, stateLabel, stateTone } from '../lib';
import type { Section } from '../types';

const FIELD_TONE_CLASS: Record<string, string> = {
  positive: 'text-status-up',
  warning: 'text-status-degraded',
  critical: 'text-status-down',
  neutral: 'text-fg',
};

export function DossierSectionView({ section }: { section: Section }) {
  const { t } = useTranslation('orders');
  return (
    <Card>
      <CardHeader>
        <div className="flex min-w-0 items-center gap-2">
          <CardTitle className="truncate">{section.title}</CardTitle>
          {section.state && (
            <Badge tone={stateTone(section.state)}>{stateLabel(section.state)}</Badge>
          )}
        </div>
      </CardHeader>
      <CardBody className="space-y-3">
        {section.summary && <p className="text-xs text-fg-muted">{section.summary}</p>}
        {!section.applicable ? (
          <p className="text-xs italic text-fg-subtle">
            {section.emptyText ?? t('section.notApplicable')}
          </p>
        ) : (
          <SectionContent section={section} />
        )}
      </CardBody>
    </Card>
  );
}

function SectionContent({ section }: { section: Section }) {
  if (section.kind === 'fields') return <FieldsView section={section} />;
  if (section.kind === 'table') return <TableView section={section} />;
  return <JsonView section={section} />;
}

function FieldsView({ section }: { section: Section }) {
  const { t } = useTranslation('orders');
  const fields = section.fields ?? [];
  if (fields.length === 0) {
    return <p className="text-xs text-fg-subtle">{section.emptyText ?? t('section.noFields')}</p>;
  }
  return (
    <dl className="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
      {fields.map((field) => (
        <div key={field.label} className="flex items-baseline justify-between gap-3">
          <dt className="shrink-0 text-[11px] text-fg-subtle">{field.label}</dt>
          <dd
            className={cn(
              'flex min-w-0 items-center gap-1.5 text-right text-xs',
              FIELD_TONE_CLASS[field.tone ?? 'neutral'],
            )}
          >
            <span className="truncate">{field.value}</span>
            {field.copyable && <CopyButton value={field.value} className="h-5 border-0 px-0.5" />}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function TableView({ section }: { section: Section }) {
  const { t } = useTranslation('orders');
  const columns = section.columns ?? [];
  const rows = section.rows ?? [];
  if (columns.length === 0 || rows.length === 0) {
    return <p className="text-xs text-fg-subtle">{section.emptyText ?? t('section.noRows')}</p>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-full border-collapse text-xs">
        <thead>
          <tr className="border-b border-border text-left text-[11px] text-fg-subtle">
            {columns.map((col) => (
              <th key={col.key} className="whitespace-nowrap px-2 py-1.5 font-medium">
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex} className="border-b border-border/60 last:border-0">
              {columns.map((col) => (
                <td key={col.key} className="px-2 py-1.5 align-top text-fg-muted">
                  {cellText(row[col.key])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function JsonView({ section }: { section: Section }) {
  const { t } = useTranslation(['orders', 'common']);
  const [open, setOpen] = useState(false);
  const text = prettyJson(section.json);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface px-2.5 py-1.5 text-xs text-fg-muted transition-colors hover:border-border-strong hover:text-fg"
      >
        <Braces size={13} className="text-fg-subtle" />
        {t('orders:section.openJson')}
      </button>
      <Drawer
        open={open}
        onClose={() => setOpen(false)}
        title={section.title}
        subtitle={t('orders:section.rawRecord')}
        width="lg"
        actions={<CopyButton value={text} idleLabel={t('common:actions.copy')} />}
      >
        <pre className="tnum overflow-auto rounded-md border border-border bg-bg px-3 py-2.5 text-[11px] leading-relaxed text-fg-muted">
          {text}
        </pre>
      </Drawer>
    </>
  );
}
