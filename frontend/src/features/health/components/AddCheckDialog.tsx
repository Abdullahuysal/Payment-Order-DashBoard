import { useEffect, useMemo, useState } from 'react';
import { X } from 'lucide-react';

import { Badge, Button } from '@/components/ui';
import { cn } from '@/lib/cn';

import { deriveNameFromUrl, parseCurl } from '../curl';
import { useCreateHealthCheck } from '../hooks/useHealthChecks';
import {
  HEALTH_GROUPS,
  HEALTH_GROUP_LABEL,
  type CreateHealthCheckRequest,
  type HealthGroup,
} from '../types';

export interface AddCheckDialogProps {
  onClose: () => void;
}

type Mode = 'curl' | 'manual';

const CURL_PLACEHOLDER = `curl -X GET 'https://payment-gateway.boyner.internal/actuator/health' \\
  -H 'Authorization: Bearer <token>'`;

export function AddCheckDialog({ onClose }: AddCheckDialogProps) {
  const create = useCreateHealthCheck();

  const [mode, setMode] = useState<Mode>('curl');
  const [curlText, setCurlText] = useState('');
  const [name, setName] = useState('');
  const [nameDirty, setNameDirty] = useState(false);
  const [group, setGroup] = useState<HealthGroup>('custom');
  const [expectedStatus, setExpectedStatus] = useState(200);
  const [method, setMethod] = useState('GET');
  const [url, setUrl] = useState('');

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const parsed = useMemo(() => (curlText.trim() ? parseCurl(curlText) : null), [curlText]);

  const sourceUrl = mode === 'curl' ? (parsed?.ok ? parsed.value.url : '') : url;
  useEffect(() => {
    if (!nameDirty && sourceUrl) setName(deriveNameFromUrl(sourceUrl));
  }, [sourceUrl, nameDirty]);

  const manualUrlValid = useMemo(() => {
    if (!url.trim()) return false;
    try {
      new URL(url.trim());
      return true;
    } catch {
      return false;
    }
  }, [url]);

  const canSubmit =
    name.trim().length > 0 &&
    expectedStatus >= 100 &&
    expectedStatus <= 599 &&
    (mode === 'curl' ? Boolean(parsed?.ok) : manualUrlValid) &&
    !create.isPending;

  function submit() {
    if (!canSubmit) return;
    let payload: CreateHealthCheckRequest;

    if (mode === 'curl' && parsed?.ok) {
      const { method: m, url: u, headers, body } = parsed.value;
      payload = {
        name: name.trim(),
        group,
        method: m,
        url: u,
        expectedStatus,
        ...(Object.keys(headers).length > 0 ? { headers } : {}),
        ...(body !== undefined ? { body } : {}),
      };
    } else {
      payload = {
        name: name.trim(),
        group,
        method,
        url: url.trim(),
        expectedStatus,
      };
    }

    create.mutate(payload, { onSuccess: () => onClose() });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 pt-[10vh]"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-label="Servis sağlığı ekle"
        className="w-full max-w-lg overflow-hidden rounded-lg border border-border-strong bg-surface shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 className="text-sm font-semibold text-fg">Servis sağlığı ekle</h2>
          <button onClick={onClose} className="text-fg-subtle hover:text-fg" aria-label="Kapat">
            <X size={15} />
          </button>
        </div>

        <div className="space-y-3.5 px-4 py-4">
          <div className="flex items-center rounded-md border border-border bg-bg p-0.5 text-xs">
            {(['curl', 'manual'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={cn(
                  'flex-1 rounded px-2 py-1 font-medium transition-colors',
                  mode === m ? 'bg-surface-2 text-fg' : 'text-fg-subtle hover:text-fg-muted',
                )}
              >
                {m === 'curl' ? 'curl yapıştır' : 'Elle gir'}
              </button>
            ))}
          </div>

          {mode === 'curl' ? (
            <div className="space-y-2">
              <textarea
                autoFocus
                value={curlText}
                onChange={(e) => setCurlText(e.target.value)}
                rows={4}
                spellCheck={false}
                placeholder={CURL_PLACEHOLDER}
                className="tnum w-full resize-y rounded border border-border bg-bg px-2.5 py-2 text-xs text-fg placeholder:text-fg-subtle focus:border-border-strong focus:outline-none"
              />
              {parsed && (
                <div
                  className={cn(
                    'rounded border px-2.5 py-2 text-xs',
                    parsed.ok ? 'border-border bg-bg' : 'border-status-down/30 text-status-down',
                  )}
                >
                  {parsed.ok ? (
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <Badge mono>{parsed.value.method}</Badge>
                        <span className="tnum truncate text-fg-muted" title={parsed.value.url}>
                          {parsed.value.url}
                        </span>
                      </div>
                      {Object.entries(parsed.value.headers).map(([k, v]) => (
                        <div key={k} className="tnum truncate text-[11px] text-fg-subtle">
                          {k}: {v}
                        </div>
                      ))}
                      {parsed.value.body !== undefined && (
                        <div className="tnum truncate text-[11px] text-fg-subtle">
                          body: {parsed.value.body}
                        </div>
                      )}
                    </div>
                  ) : (
                    parsed.error
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-[5rem_1fr] gap-2">
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                className="rounded border border-border bg-bg px-2 py-1.5 text-xs text-fg focus:outline-none"
              >
                {['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE'].map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
              <input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                spellCheck={false}
                placeholder="https://servis.boyner.internal/health"
                className="tnum rounded border border-border bg-bg px-2 py-1.5 text-xs text-fg placeholder:text-fg-subtle focus:border-border-strong focus:outline-none"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <label className="space-y-1">
              <span className="text-[11px] uppercase tracking-wide text-fg-subtle">Ad</span>
              <input
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setNameDirty(true);
                }}
                className="w-full rounded border border-border bg-bg px-2 py-1.5 text-xs text-fg focus:border-border-strong focus:outline-none"
              />
            </label>
            <label className="space-y-1">
              <span className="text-[11px] uppercase tracking-wide text-fg-subtle">Grup</span>
              <select
                value={group}
                onChange={(e) => setGroup(e.target.value as HealthGroup)}
                className="w-full rounded border border-border bg-bg px-2 py-1.5 text-xs text-fg focus:outline-none"
              >
                {HEALTH_GROUPS.map((g) => (
                  <option key={g} value={g}>
                    {HEALTH_GROUP_LABEL[g]}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1">
              <span className="text-[11px] uppercase tracking-wide text-fg-subtle">
                Beklenen status
              </span>
              <input
                type="number"
                min={100}
                max={599}
                value={expectedStatus}
                onChange={(e) => setExpectedStatus(Number(e.target.value))}
                className="tnum w-full rounded border border-border bg-bg px-2 py-1.5 text-xs text-fg focus:border-border-strong focus:outline-none"
              />
            </label>
          </div>

          {create.isError && (
            <p className="text-xs text-status-down">
              Eklenemedi: {create.error instanceof Error ? create.error.message : 'bilinmeyen hata'}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-border px-4 py-3">
          <span className="text-[11px] text-fg-subtle">
            Ops API’ye <span className="tnum">POST</span> edilir.
          </span>
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" onClick={onClose}>
              Vazgeç
            </Button>
            <Button size="sm" variant="primary" onClick={submit} disabled={!canSubmit}>
              {create.isPending ? 'Ekleniyor…' : 'Ekle'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
