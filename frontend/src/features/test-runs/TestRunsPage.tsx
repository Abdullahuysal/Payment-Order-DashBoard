import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

import { Badge } from '@/components/ui';
import { MODULES } from '@/lib/constants';

const mod = MODULES.find((m) => m.id === 'test-runs')!;

export default function TestRunsPage() {
  const scenarios = mod.children ?? [];

  return (
    <div className="mx-auto max-w-4xl py-6">
      <p className="text-xs font-medium uppercase tracking-wide text-fg-subtle">Test Koşumları</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight text-fg">QA senaryo tetikleyici</h1>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-fg-muted">
        Sık kullanılan uçtan uca QA senaryolarını seçili ortama karşı tek tıkla çalıştır, adım adım
        pass/fail çıktısını gör. Her senaryo kendi sayfasında; parametreler ve koşum geçmişi orada
        yönetilecek.
      </p>

      <div className="mt-5 rounded-lg border border-border bg-surface px-4 py-3 text-xs leading-relaxed text-fg-muted">
        <span className="font-semibold text-fg">Retail</span> = Boyner’in kendi ürünlerine ait
        süreçler. <span className="font-semibold text-fg">Merchant</span> = Boyner harici (3. parti)
        satıcıların süreçleri. Kargo ve fatura akışları iki tarafta farklı işlediği için senaryolar
        ayrı tutulur.
      </div>

      <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {scenarios.map((sc) => (
          <Link
            key={sc.id}
            to={`/${mod.path}/${sc.path}`}
            className="group flex flex-col rounded-lg border border-border bg-surface p-4 transition-colors hover:border-border-strong"
          >
            <div className="flex items-start justify-between gap-2">
              <h2 className="text-sm font-semibold text-fg">{sc.label}</h2>
              <ArrowRight
                size={14}
                className="mt-0.5 shrink-0 text-fg-subtle transition-colors group-hover:text-fg"
              />
            </div>
            <p className="mt-1 text-xs leading-relaxed text-fg-muted">{sc.description}</p>
            <Badge className="mt-3 self-start">Yakında</Badge>
          </Link>
        ))}
      </div>
    </div>
  );
}
