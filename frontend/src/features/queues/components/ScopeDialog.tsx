import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, X } from 'lucide-react';

import { useAppStore } from '@/app/store';
import { Button } from '@/components/ui';
import { cn } from '@/lib/cn';
import { formatCount } from '@/lib/format';
import { ENV_LABELS } from '@/services/config';

import { queuesApi } from '../api/queues.api';
import { compileMatcher, isTooBroad } from '../scope';

const PREVIEW_CAP = 200;

export function ScopeDialog({ onClose }: { onClose: () => void }) {
  const env = useAppStore((s) => s.environment);
  const stored = useAppStore((s) => s.queueScopePatterns);
  const setPatterns = useAppStore((s) => s.setQueueScopePatterns);
  const setEnabled = useAppStore((s) => s.setQueueScopeEnabled);

  const [draft, setDraft] = useState<string[]>(stored);
  const [input, setInput] = useState('');

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const preview = useQuery({
    queryKey: ['message-queues', 'scope-preview', env],
    queryFn: ({ signal }) =>
      queuesApi.rabbitQueues(env, { page: 1, pageSize: PREVIEW_CAP }, signal),
    staleTime: 15_000,
  });

  const names = useMemo(() => (preview.data?.items ?? []).map((q) => q.name), [preview.data]);
  const cleanDraft = draft.map((p) => p.trim()).filter(Boolean);
  const matcher = useMemo(
    () => compileMatcher(draft.map((p) => p.trim()).filter(Boolean)),
    [draft],
  );
  const matched = cleanDraft.length > 0 ? names.filter((n) => matcher(n)) : [];
  const scannedTotal = preview.data?.totalCount ?? names.length;
  const capped = scannedTotal > names.length;

  function addPattern(raw: string) {
    const p = raw.trim();
    if (!p || draft.includes(p)) {
      setInput('');
      return;
    }
    setDraft((d) => [...d, p]);
    setInput('');
  }

  function save() {
    setPatterns(cleanDraft);
    if (cleanDraft.length > 0) setEnabled(true);
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 pt-[8vh]"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-label="Alan kapsamı"
        className="flex max-h-[80vh] w-full max-w-lg flex-col overflow-hidden rounded-lg border border-border-strong bg-surface shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 className="text-sm font-semibold text-fg">Alan kapsamı</h2>
          <button onClick={onClose} className="text-fg-subtle hover:text-fg" aria-label="Kapat">
            <X size={15} />
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-3.5 overflow-y-auto px-4 py-4">
          <p className="text-xs leading-relaxed text-fg-muted">
            Kuyruk adı bu kalıplardan <span className="text-fg">herhangi biriyle</span> eşleşenler
            izlenir. <span className="tnum">*</span> joker karakter; joker yoksa “içerir” olarak
            eşleşir. Örn: <span className="tnum">payment.*</span>,{' '}
            <span className="tnum">order-service</span>, <span className="tnum">*.error</span>.
          </p>

          <div className="flex flex-wrap gap-1.5">
            {cleanDraft.length === 0 && (
              <span className="text-xs text-fg-subtle">Henüz kalıp yok.</span>
            )}
            {draft.map((p, i) => (
              <span
                key={`${p}-${i}`}
                className={cn(
                  'inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[11px]',
                  isTooBroad(p)
                    ? 'border-status-degraded/40 text-status-degraded'
                    : 'border-border text-fg-muted',
                )}
              >
                <span className="tnum break-all">{p}</span>
                <button
                  type="button"
                  onClick={() => setDraft((d) => d.filter((_, idx) => idx !== i))}
                  aria-label={`${p} kalıbını kaldır`}
                  className="text-fg-subtle hover:text-status-down"
                >
                  <X size={11} />
                </button>
              </span>
            ))}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              addPattern(input);
            }}
            className="flex gap-2"
          >
            <input
              autoFocus
              value={input}
              onChange={(e) => setInput(e.target.value)}
              spellCheck={false}
              placeholder="ör. payment.*"
              aria-label="Yeni kalıp"
              className="tnum h-8 flex-1 rounded-md border border-border bg-bg px-2.5 text-xs text-fg placeholder:text-fg-subtle focus:border-border-strong focus:outline-none"
            />
            <Button type="submit" size="sm" disabled={!input.trim()}>
              <Plus size={12} />
              Ekle
            </Button>
          </form>

          {cleanDraft.some(isTooBroad) && (
            <p className="text-[11px] text-status-degraded">
              Yalnızca joker içeren kalıp tüm kuyrukları kapsar — kapsam etkisiz kalır.
            </p>
          )}

          <div className="rounded-md border border-border bg-bg px-3 py-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase tracking-wide text-fg-subtle">
                Önizleme · {ENV_LABELS[env]}
              </span>
              {preview.isLoading ? (
                <span className="text-[11px] text-fg-subtle">yükleniyor…</span>
              ) : preview.isError ? (
                <span className="text-[11px] text-status-down">alınamadı</span>
              ) : (
                <span className="tnum text-[11px] text-fg-muted">
                  <span className="font-semibold text-fg">{formatCount(matched.length)}</span> /{' '}
                  {formatCount(names.length)} kuyruk eşleşiyor
                </span>
              )}
            </div>

            {!preview.isLoading && !preview.isError && (
              <>
                {cleanDraft.length === 0 ? (
                  <p className="mt-1.5 text-[11px] text-fg-subtle">
                    Kalıp ekleyince eşleşen kuyruklar burada listelenir.
                  </p>
                ) : matched.length === 0 ? (
                  <p className="mt-1.5 text-[11px] text-fg-subtle">
                    Bu ortamda eşleşen kuyruk yok. Kalıbı kontrol edin.
                  </p>
                ) : (
                  <ul className="mt-1.5 flex flex-wrap gap-1">
                    {matched.slice(0, 12).map((n) => (
                      <li
                        key={n}
                        className="tnum rounded border border-border px-1.5 py-0.5 text-[11px] text-fg-muted"
                      >
                        {n}
                      </li>
                    ))}
                    {matched.length > 12 && (
                      <li className="px-1 py-0.5 text-[11px] text-fg-subtle">
                        +{matched.length - 12}
                      </li>
                    )}
                  </ul>
                )}
                {capped && (
                  <p className="mt-1.5 text-[11px] text-status-degraded">
                    Bu ortamda {formatCount(scannedTotal)} kuyruk var; önizleme ilk {PREVIEW_CAP}{' '}
                    tanesini taradı.
                  </p>
                )}
              </>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-border px-4 py-3">
          <button
            type="button"
            onClick={() => setDraft([])}
            disabled={draft.length === 0}
            className="text-[11px] text-fg-subtle hover:text-fg-muted disabled:opacity-40"
          >
            Tümünü temizle
          </button>
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" onClick={onClose}>
              Vazgeç
            </Button>
            <Button size="sm" variant="primary" onClick={save}>
              Kaydet
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
