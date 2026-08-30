import { CopyButton } from '@/components/ui';

import type { DevToolRunResult } from '../types';
import { PanelHeading } from './kit';

export function ResultPanel({ result }: { result: DevToolRunResult }) {
  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between">
        <PanelHeading>Çıktı</PanelHeading>
        <CopyButton value={result.output} idleLabel="kopyala" />
      </div>

      <pre className="max-h-[28rem] overflow-auto rounded-lg border border-border bg-bg px-3 py-2.5 text-xs leading-relaxed text-fg">
        <code>{result.output}</code>
      </pre>

      {result.stats.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {result.stats.map((stat) => (
            <span
              key={stat.label}
              className="inline-flex items-center gap-1 rounded border border-border px-1.5 py-0.5 text-[11px] text-fg-muted"
            >
              <span className="text-fg-subtle">{stat.label}</span>
              <span className="tnum text-fg">{stat.value}</span>
            </span>
          ))}
        </div>
      )}

      {result.notes.length > 0 && (
        <ul className="space-y-0.5 text-[11px] text-fg-subtle">
          {result.notes.map((note) => (
            <li key={note}>— {note}</li>
          ))}
        </ul>
      )}
    </section>
  );
}
