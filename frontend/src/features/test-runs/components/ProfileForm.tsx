import { useMemo, useState, type Dispatch, type SetStateAction } from 'react';
import { Plus, X } from 'lucide-react';

import { Button } from '@/components/ui';

import { defaultInputValues } from '../lib';
import type { Profile, ProfileInput, ScenarioDetail } from '../types';
import { controlClass, ErrorHint, FieldShell, SectionHeading } from './kit';
import { ScenarioInputForm } from './ScenarioInputForm';

interface ExtraRow {
  id: string;
  key: string;
  value: string;
}

interface ProfileFormProps {
  scenario: ScenarioDetail;
  profile?: Profile | undefined;
  environmentLabel: string;
  pending?: boolean | undefined;
  error?: unknown;
  onSubmit: (input: ProfileInput) => void;
  onCancel: () => void;
}

export function ProfileForm({
  scenario,
  profile,
  environmentLabel,
  pending,
  error,
  onSubmit,
  onCancel,
}: ProfileFormProps) {
  const knownNames = useMemo(() => new Set(scenario.inputs.map((f) => f.name)), [scenario.inputs]);

  const [name, setName] = useState(profile?.name ?? '');
  const [known, setKnown] = useState<Record<string, unknown>>(() => ({
    ...defaultInputValues(scenario.inputs),
    ...pickKnown(profile?.values ?? {}, knownNames),
  }));
  const [extra, setExtra] = useState<ExtraRow[]>(() =>
    toExtraRows(profile?.values ?? {}, knownNames),
  );
  const [nameError, setNameError] = useState<string | undefined>(undefined);

  const submit = () => {
    if (name.trim() === '') {
      setNameError('Profil adı gerekli');
      return;
    }
    const values: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(known)) {
      if (value !== '' && value != null) values[key] = value;
    }
    for (const row of extra) {
      const key = row.key.trim();
      if (key === '') continue;
      values[key] = parseLoose(row.value);
    }
    onSubmit({ name: name.trim(), values });
  };

  return (
    <form
      className="space-y-5"
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
    >
      <FieldShell id="profile-name" label="Profil adı" required error={nameError}>
        <input
          id="profile-name"
          className={controlClass}
          value={name}
          onChange={(event) => {
            setName(event.target.value);
            setNameError(undefined);
          }}
          placeholder="örn. Standart kredi kartı — 1 adet"
        />
      </FieldShell>

      <p className="rounded-md border border-border bg-bg px-2.5 py-2 text-[11px] text-fg-subtle">
        Ortam: <span className="tnum text-fg-muted">{environmentLabel}</span> — profiller seçili
        ortama özeldir.
      </p>

      <div className="space-y-2">
        <SectionHeading>Bilinen alanlar</SectionHeading>
        <ScenarioInputForm
          fields={scenario.inputs}
          value={known}
          onChange={setKnown}
          idPrefix="profile"
        />
      </div>

      <div className="space-y-2">
        <SectionHeading>Ek anahtarlar</SectionHeading>
        <p className="text-[11px] text-fg-subtle">
          Şema dışı serbest anahtar/değer çiftleri. Şema netleşince bilinen alanlara taşınır.
        </p>
        <div className="space-y-2">
          {extra.map((row) => (
            <div key={row.id} className="flex items-center gap-2">
              <input
                className={controlClass}
                placeholder="anahtar"
                value={row.key}
                onChange={(event) => updateRow(setExtra, row.id, { key: event.target.value })}
              />
              <input
                className={controlClass}
                placeholder="değer"
                value={row.value}
                onChange={(event) => updateRow(setExtra, row.id, { value: event.target.value })}
              />
              <button
                type="button"
                onClick={() => setExtra((rows) => rows.filter((r) => r.id !== row.id))}
                className="shrink-0 rounded p-1.5 text-fg-subtle hover:bg-surface-2 hover:text-fg"
                aria-label="Anahtarı sil"
              >
                <X size={14} />
              </button>
            </div>
          ))}
          <Button
            size="sm"
            variant="ghost"
            onClick={() =>
              setExtra((rows) => [...rows, { id: crypto.randomUUID(), key: '', value: '' }])
            }
          >
            <Plus size={13} />
            Anahtar ekle
          </Button>
        </div>
      </div>

      {error != null && <ErrorHint error={error} />}

      <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
        <Button variant="ghost" onClick={onCancel} disabled={pending ?? false}>
          Vazgeç
        </Button>
        <Button type="submit" variant="primary" disabled={pending ?? false}>
          {pending ? 'Kaydediliyor…' : 'Kaydet'}
        </Button>
      </div>
    </form>
  );
}

function pickKnown(values: Record<string, unknown>, known: Set<string>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(values)) {
    if (known.has(key)) out[key] = value;
  }
  return out;
}

function toExtraRows(values: Record<string, unknown>, known: Set<string>): ExtraRow[] {
  return Object.entries(values)
    .filter(([key]) => !known.has(key))
    .map(([key, value]) => ({
      id: crypto.randomUUID(),
      key,
      value: typeof value === 'string' ? value : (JSON.stringify(value) ?? ''),
    }));
}

function updateRow(
  setExtra: Dispatch<SetStateAction<ExtraRow[]>>,
  id: string,
  patch: Partial<ExtraRow>,
) {
  setExtra((rows) => rows.map((row) => (row.id === id ? { ...row, ...patch } : row)));
}

function parseLoose(raw: string): unknown {
  const trimmed = raw.trim();
  if (trimmed === '') return '';
  if (trimmed === 'true') return true;
  if (trimmed === 'false') return false;
  if (/^-?\d+(\.\d+)?$/.test(trimmed)) return Number(trimmed);
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      return JSON.parse(trimmed) as unknown;
    } catch {
      return raw;
    }
  }
  return raw;
}
