import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Plus, Trash2, X } from 'lucide-react';

import { Badge, Button } from '@/components/ui';
import { cn } from '@/lib/cn';

import { deriveNameFromUrl, parseCurl } from '../curl';
import { useCreateHealthCheck, useUpdateHealthCheck } from '../hooks/useHealthChecks';
import {
  HEALTH_GROUPS,
  HEALTH_GROUP_LABEL,
  type CreateHealthCheckRequest,
  type HealthCheck,
  type HealthGroup,
} from '../types';

export interface CheckDialogProps {
  /** Omit to create a new check; pass one to edit it in place. */
  check?: HealthCheck | undefined;
  onClose: () => void;
}

type Tab = 'curl' | 'manual';

interface HeaderRow {
  id: number;
  key: string;
  value: string;
}

const METHODS = ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE'] as const;

const CURL_PLACEHOLDER = `curl -X GET 'https://payment-gateway.boyner.internal/actuator/health' \\
  -H 'Authorization: Bearer <token>'`;

let headerRowId = 0;

function toRows(headers: Record<string, string> | undefined): HeaderRow[] {
  return Object.entries(headers ?? {}).map(([key, value]) => ({ id: headerRowId++, key, value }));
}

function toHeaderMap(rows: readonly HeaderRow[]): Record<string, string> {
  const map: Record<string, string> = {};
  for (const row of rows) {
    const key = row.key.trim();
    if (key) map[key] = row.value;
  }
  return map;
}

export function CheckDialog({ check, onClose }: CheckDialogProps) {
  const isEdit = check !== undefined;
  const create = useCreateHealthCheck();
  const update = useUpdateHealthCheck();
  const pending = create.isPending || update.isPending;
  const failure = create.error ?? update.error;

  const [tab, setTab] = useState<Tab>(isEdit ? 'manual' : 'curl');
  const [curlText, setCurlText] = useState('');

  const [name, setName] = useState(check?.name ?? '');
  const [nameDirty, setNameDirty] = useState(isEdit);
  const [group, setGroup] = useState<HealthGroup>(check?.group ?? 'custom');
  const [expectedStatus, setExpectedStatus] = useState(check?.expectedStatus ?? 200);
  const [method, setMethod] = useState(check?.method ?? 'GET');
  const [url, setUrl] = useState(check?.url ?? '');
  const [headers, setHeaders] = useState<HeaderRow[]>(() => toRows(check?.headers));
  const [body, setBody] = useState(check?.body ?? '');
  const [isEnabled, setIsEnabled] = useState(check?.isEnabled ?? true);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const parsed = useMemo(() => (curlText.trim() ? parseCurl(curlText) : null), [curlText]);

  useEffect(() => {
    if (!parsed?.ok) return;
    setMethod(parsed.value.method);
    setUrl(parsed.value.url);
    setHeaders(toRows(parsed.value.headers));
    setBody(parsed.value.body ?? '');
  }, [parsed]);

  useEffect(() => {
    if (!nameDirty && url) setName(deriveNameFromUrl(url));
  }, [url, nameDirty]);

  const urlValid = useMemo(() => {
    const trimmed = url.trim();
    if (!trimmed) return false;
    try {
      const parsedUrl = new URL(trimmed);
      return parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:';
    } catch {
      return false;
    }
  }, [url]);

  const statusValid = expectedStatus >= 100 && expectedStatus <= 599;
  const canSubmit = name.trim().length > 0 && urlValid && statusValid && !pending;

  function submit() {
    if (!canSubmit) return;

    const headerMap = toHeaderMap(headers);
    const payload: CreateHealthCheckRequest = {
      name: name.trim(),
      group,
      method,
      url: url.trim(),
      expectedStatus,
      ...(Object.keys(headerMap).length > 0 ? { headers: headerMap } : {}),
      ...(body.trim() ? { body } : {}),
    };

    if (check) {
      update.mutate(
        { id: check.id, input: { ...payload, isEnabled, rowVersion: check.rowVersion } },
        { onSuccess: onClose },
      );
    } else {
      create.mutate(payload, { onSuccess: onClose });
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 p-4 sm:p-6" onClick={onClose}>
      <div
        role="dialog"
        aria-label={isEdit ? 'Servis sağlığı düzenle' : 'Servis sağlığı ekle'}
        className="mx-auto flex max-h-[calc(100dvh-2rem)] w-full max-w-lg flex-col overflow-hidden rounded-lg border border-border-strong bg-surface shadow-2xl sm:max-h-[calc(100dvh-3rem)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-none items-center justify-between gap-3 border-b border-border px-4 py-3">
          <h2 className="truncate text-sm font-semibold text-fg">
            {isEdit ? `Düzenle — ${check.name}` : 'Servis sağlığı ekle'}
          </h2>
          <button
            onClick={onClose}
            className="shrink-0 text-fg-subtle hover:text-fg"
            aria-label="Kapat"
          >
            <X size={15} />
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-3.5 overflow-y-auto px-4 py-4">
          <div className="flex items-center rounded-md border border-border bg-bg p-0.5 text-xs">
            {(['curl', 'manual'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={cn(
                  'flex-1 rounded px-2 py-1 font-medium transition-colors',
                  tab === t ? 'bg-surface-2 text-fg' : 'text-fg-subtle hover:text-fg-muted',
                )}
              >
                {t === 'curl' ? 'curl yapıştır' : 'Elle gir'}
              </button>
            ))}
          </div>

          {tab === 'curl' && (
            <div className="space-y-2">
              <textarea
                autoFocus
                value={curlText}
                onChange={(e) => setCurlText(e.target.value)}
                rows={4}
                spellCheck={false}
                placeholder={CURL_PLACEHOLDER}
                className="tnum max-h-48 w-full resize-y rounded border border-border bg-bg px-2.5 py-2 text-xs text-fg placeholder:text-fg-subtle focus:border-border-strong focus:outline-none"
              />
              {parsed && (
                <div
                  className={cn(
                    'rounded border px-2.5 py-2 text-xs',
                    parsed.ok
                      ? 'max-h-40 overflow-y-auto border-border bg-bg'
                      : 'border-status-down/30 text-status-down',
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
              <p className="text-[11px] text-fg-subtle">
                Çözümlenen istek aşağıdaki alanlara aktarılır; oradan düzeltebilirsin.
              </p>
            </div>
          )}

          <div className="space-y-3">
            <Field label="İstek">
              <div className="grid grid-cols-[5.5rem_1fr] gap-2">
                <select
                  value={method}
                  onChange={(e) => setMethod(e.target.value)}
                  className="rounded border border-border bg-bg px-2 py-1.5 text-xs text-fg focus:outline-none"
                >
                  {METHODS.map((m) => (
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
                  className={cn(
                    'tnum min-w-0 rounded border bg-bg px-2 py-1.5 text-xs text-fg placeholder:text-fg-subtle focus:outline-none',
                    url && !urlValid ? 'border-status-down/50' : 'border-border',
                  )}
                />
              </div>
              {url && !urlValid && (
                <p className="text-[11px] text-status-down">
                  Mutlak bir http/https adresi girilmeli.
                </p>
              )}
            </Field>

            <div className="grid grid-cols-2 gap-2">
              <Field label="Ad">
                <input
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setNameDirty(true);
                  }}
                  className="w-full rounded border border-border bg-bg px-2 py-1.5 text-xs text-fg focus:border-border-strong focus:outline-none"
                />
              </Field>
              <Field label="Grup">
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
              </Field>
              <Field label="Beklenen status">
                <input
                  type="number"
                  min={100}
                  max={599}
                  value={expectedStatus}
                  onChange={(e) => setExpectedStatus(Number(e.target.value))}
                  className={cn(
                    'tnum w-full rounded border bg-bg px-2 py-1.5 text-xs text-fg focus:outline-none',
                    statusValid ? 'border-border' : 'border-status-down/50',
                  )}
                />
              </Field>
              {isEdit && (
                <Field label="Durum">
                  <select
                    value={isEnabled ? 'enabled' : 'disabled'}
                    onChange={(e) => setIsEnabled(e.target.value === 'enabled')}
                    className="w-full rounded border border-border bg-bg px-2 py-1.5 text-xs text-fg focus:outline-none"
                  >
                    <option value="enabled">Aktif</option>
                    <option value="disabled">Pasif</option>
                  </select>
                </Field>
              )}
            </div>

            <Field label={`Header (${headers.length})`}>
              <div className="space-y-1.5">
                {headers.map((row, index) => (
                  <div key={row.id} className="grid grid-cols-[1fr_1.4fr_auto] gap-1.5">
                    <input
                      value={row.key}
                      onChange={(e) =>
                        setHeaders((rows) =>
                          rows.map((r, i) => (i === index ? { ...r, key: e.target.value } : r)),
                        )
                      }
                      spellCheck={false}
                      placeholder="Header"
                      className="tnum min-w-0 rounded border border-border bg-bg px-2 py-1 text-[11px] text-fg placeholder:text-fg-subtle focus:border-border-strong focus:outline-none"
                    />
                    <input
                      value={row.value}
                      onChange={(e) =>
                        setHeaders((rows) =>
                          rows.map((r, i) => (i === index ? { ...r, value: e.target.value } : r)),
                        )
                      }
                      spellCheck={false}
                      placeholder="Değer"
                      className="tnum min-w-0 rounded border border-border bg-bg px-2 py-1 text-[11px] text-fg placeholder:text-fg-subtle focus:border-border-strong focus:outline-none"
                    />
                    <button
                      onClick={() => setHeaders((rows) => rows.filter((_, i) => i !== index))}
                      className="px-1 text-fg-subtle hover:text-status-down"
                      aria-label={`${row.key || 'header'} kaldır`}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() =>
                    setHeaders((rows) => [...rows, { id: headerRowId++, key: '', value: '' }])
                  }
                  className="flex items-center gap-1 text-[11px] text-fg-subtle hover:text-fg-muted"
                >
                  <Plus size={11} />
                  header ekle
                </button>
              </div>
            </Field>

            <Field label="Body">
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={3}
                spellCheck={false}
                placeholder="GET isteklerinde boş bırakılır"
                className="tnum max-h-48 w-full resize-y rounded border border-border bg-bg px-2.5 py-2 text-xs text-fg placeholder:text-fg-subtle focus:border-border-strong focus:outline-none"
              />
            </Field>
          </div>

          {failure instanceof Error && (
            <p className="text-xs text-status-down">
              {isEdit ? 'Güncellenemedi' : 'Eklenemedi'}: {failure.message}
            </p>
          )}
        </div>

        <div className="flex flex-none items-center justify-between gap-3 border-t border-border px-4 py-3">
          <span className="truncate text-[11px] text-fg-subtle">
            Ops API’ye <span className="tnum">{isEdit ? 'PUT' : 'POST'}</span> edilir.
          </span>
          <div className="flex shrink-0 gap-2">
            <Button size="sm" variant="ghost" onClick={onClose}>
              Vazgeç
            </Button>
            <Button size="sm" variant="primary" onClick={submit} disabled={!canSubmit}>
              {pending ? 'Kaydediliyor…' : isEdit ? 'Kaydet' : 'Ekle'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1">
      <span className="block text-[11px] uppercase tracking-wide text-fg-subtle">{label}</span>
      {children}
    </div>
  );
}
