import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

import { DEVTOOLS_MOCK } from './api/devTools.api';
import { DEV_TOOL_LIST } from './registry';

export default function DevToolsPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <header>
        <h1 className="text-base font-semibold text-fg">Geliştirici Araçları</h1>
        <p className="mt-0.5 text-xs text-fg-muted">
          Günlük tekrar eden metin işleri için küçük yardımcılar. Girdiyi yapıştır, seçenekleri
          ayarla, sonucu kopyala. Dönüştürmeyi {DEVTOOLS_MOCK ? 'şimdilik mock katman' : 'backend'}{' '}
          yapar.
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2">
        {DEV_TOOL_LIST.map((tool) => {
          const Icon = tool.icon;
          return (
            <Link
              key={tool.key}
              to={`/dev-tools/${tool.key}`}
              className="group rounded-lg border border-border bg-surface p-4 transition-colors hover:border-border-strong"
            >
              <div className="flex items-start justify-between">
                <span className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-surface-2 text-fg-muted group-hover:text-fg">
                  <Icon size={17} strokeWidth={1.75} />
                </span>
                <ArrowRight
                  size={14}
                  className="mt-1 text-fg-subtle transition-transform group-hover:translate-x-0.5"
                />
              </div>
              <h2 className="mt-3 text-sm font-semibold text-fg">{tool.label}</h2>
              <p className="mt-1 text-xs leading-relaxed text-fg-muted">{tool.summary}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
