import { type FormEvent, type RefObject } from 'react';
import { Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button, Segmented } from '@/components/ui';

import { LOOKUP_FIELD_PLACEHOLDER, LOOKUP_FIELD_VALUES } from '../lib';
import type { LookupField } from '../types';

export function SearchBar({
  field,
  value,
  pending,
  inputRef,
  onFieldChange,
  onValueChange,
  onSubmit,
}: {
  field: LookupField;
  value: string;
  pending: boolean;
  inputRef: RefObject<HTMLInputElement | null>;
  onFieldChange: (field: LookupField) => void;
  onValueChange: (value: string) => void;
  onSubmit: () => void;
}) {
  const { t } = useTranslation('orders');

  const submit = (event: FormEvent) => {
    event.preventDefault();
    onSubmit();
  };

  return (
    <form onSubmit={submit} className="space-y-2">
      <Segmented<LookupField>
        ariaLabel={t('search.fieldAria')}
        size="sm"
        className="max-w-full flex-wrap"
        value={field}
        onChange={onFieldChange}
        options={LOOKUP_FIELD_VALUES.map((f) => ({ value: f, label: t(`fields.${f}`) }))}
      />
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search
            size={14}
            className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-fg-subtle"
          />
          <input
            ref={inputRef}
            value={value}
            onChange={(event) => onValueChange(event.target.value)}
            placeholder={LOOKUP_FIELD_PLACEHOLDER[field]}
            aria-label={t('search.valueAria')}
            className="h-9 w-full rounded-md border border-border bg-bg pl-8 pr-2.5 text-sm text-fg placeholder:text-fg-subtle focus-visible:border-border-strong focus-visible:outline-none"
          />
        </div>
        <Button type="submit" variant="primary" disabled={pending || value.trim().length === 0}>
          {t('search.submit')}
        </Button>
      </div>
    </form>
  );
}
