import { cn } from '@/lib/cn';

import { coerceInputValue } from '../lib';
import type { InputField } from '../types';
import { controlClass, FieldShell } from './kit';

interface ScenarioInputFormProps {
  fields: InputField[];
  value: Record<string, unknown>;
  onChange: (next: Record<string, unknown>) => void;
  errors?: Record<string, string> | undefined;
  disabled?: boolean | undefined;
  idPrefix?: string;
}

export function ScenarioInputForm({
  fields,
  value,
  onChange,
  errors,
  disabled,
  idPrefix = 'input',
}: ScenarioInputFormProps) {
  if (fields.length === 0) {
    return <p className="text-xs text-fg-subtle">Bu senaryonun parametresi yok.</p>;
  }

  const setField = (name: string, next: unknown) => onChange({ ...value, [name]: next });

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {fields.map((field) => {
        const id = `${idPrefix}-${field.name}`;
        const raw = value[field.name];
        return (
          <div
            key={field.name}
            className={field.type === 'string' && !field.options ? 'sm:col-span-2' : ''}
          >
            <FieldShell
              id={id}
              label={field.label}
              required={field.required}
              help={field.help}
              error={errors?.[field.name]}
            >
              <Control field={field} id={id} raw={raw} disabled={disabled} onChange={setField} />
            </FieldShell>
          </div>
        );
      })}
    </div>
  );
}

function Control({
  field,
  id,
  raw,
  disabled,
  onChange,
}: {
  field: InputField;
  id: string;
  raw: unknown;
  disabled?: boolean | undefined;
  onChange: (name: string, next: unknown) => void;
}) {
  if (field.type === 'boolean') {
    const on = raw === true;
    return (
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={on}
        disabled={disabled ?? false}
        onClick={() => onChange(field.name, !on)}
        className={cn(
          'inline-flex h-6 w-11 items-center rounded-full border px-0.5 transition-colors disabled:opacity-50',
          on ? 'border-primary bg-primary' : 'border-border bg-surface-2',
        )}
      >
        <span
          className={cn(
            'h-4 w-4 rounded-full transition-transform',
            on ? 'translate-x-5 bg-bg' : 'translate-x-0 bg-fg-muted',
          )}
        />
      </button>
    );
  }

  if (field.type === 'select') {
    return (
      <select
        id={id}
        disabled={disabled ?? false}
        value={typeof raw === 'string' ? raw : ''}
        onChange={(event) => onChange(field.name, event.target.value)}
        className={controlClass}
      >
        {!field.required && <option value="">—</option>}
        {(field.options ?? []).map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    );
  }

  const inputType =
    field.type === 'number' ? 'number' : field.type === 'secret' ? 'password' : 'text';

  return (
    <input
      id={id}
      type={inputType}
      autoComplete={field.type === 'secret' ? 'off' : undefined}
      disabled={disabled ?? false}
      value={typeof raw === 'string' || typeof raw === 'number' ? String(raw) : ''}
      placeholder={field.placeholder}
      onChange={(event) => onChange(field.name, coerceInputValue(field, event.target.value))}
      className={controlClass}
    />
  );
}
