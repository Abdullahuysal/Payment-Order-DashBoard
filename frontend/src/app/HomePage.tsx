import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

import { useAppStore } from '@/app/store';
import { Badge } from '@/components/ui';
import { MODULES } from '@/lib/constants';
import { ENV_LABELS } from '@/services/config';

export default function HomePage() {
  const env = useAppStore((s) => s.environment);

  return (
    <div className="mx-auto max-w-4xl py-6">
      <p className="text-xs font-medium uppercase tracking-wide text-fg-subtle">
        Boyner · Payment &amp; Order
      </p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight text-fg">Ops Panel</h1>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-fg-muted">
        Ödeme ve sipariş ekibindeki geliştirici ve QA’in günlük operasyon işleri için tek panel.
        Servis sağlığını izle, QA senaryolarını koştur, sipariş durumunu sorgula, logları AI ile
        yorumla — hepsi seçili ortam üzerinden.
      </p>

      <div className="mt-5 flex items-center gap-3">
        <Link
          to="/health"
          className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-3.5 text-sm font-medium text-primary-fg transition-colors hover:bg-primary/90"
        >
          Servis Sağlığı’na git
          <ArrowRight size={14} />
        </Link>
        <span className="text-xs text-fg-subtle">
          Aktif ortam: <span className="tnum text-fg-muted">{ENV_LABELS[env]}</span>
        </span>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {MODULES.map((mod) => {
          const Icon = mod.icon;
          return (
            <Link
              key={mod.id}
              to={`/${mod.path}`}
              className="group rounded-lg border border-border bg-surface p-4 transition-colors hover:border-border-strong"
            >
              <div className="flex items-start justify-between">
                <span className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-surface-2 text-fg-muted group-hover:text-fg">
                  <Icon size={17} strokeWidth={1.75} />
                </span>
                <Badge tone={mod.implemented ? 'up' : 'neutral'}>
                  {mod.implemented ? 'Aktif' : 'Yakında'}
                </Badge>
              </div>
              <h2 className="mt-3 text-sm font-semibold text-fg">{mod.label}</h2>
              <p className="mt-1 text-xs leading-relaxed text-fg-muted">{mod.description}</p>
            </Link>
          );
        })}
      </div>

      <p className="mt-8 text-[11px] text-fg-subtle">
        Faz 0 — kabuk ve mimari. Servis Sağlığı tipli mock veriyle çalışır; diğer modüller
        placeholder. Gerçek backend entegrasyonu sonraki fazlarda.
      </p>
    </div>
  );
}
