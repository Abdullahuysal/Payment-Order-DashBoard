import { useTranslation } from 'react-i18next';

import { Segmented } from '@/components/ui';

import { STATUS_ORDER } from '../lib';
import type { TodoOwner, TodoStatus } from '../types';
import { controlClass } from './kit';

type StatusFilter = TodoStatus | 'all';

interface TodoFiltersProps {
  status: StatusFilter;
  onStatusChange: (status: StatusFilter) => void;
  owners: TodoOwner[];
  ownerId: string;
  onOwnerChange: (ownerId: string) => void;
}

export function TodoFilters({
  status,
  onStatusChange,
  owners,
  ownerId,
  onOwnerChange,
}: TodoFiltersProps) {
  const { t } = useTranslation('todo');

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Segmented
        ariaLabel={t('filters.status.all')}
        value={status}
        onChange={onStatusChange}
        options={[
          { value: 'all', label: t('filters.status.all') },
          ...STATUS_ORDER.map((value) => ({ value, label: t(`filters.status.${value}`) })),
        ]}
      />
      <select
        className={`${controlClass} w-auto`}
        value={ownerId}
        onChange={(event) => onOwnerChange(event.target.value)}
        aria-label={t('filters.owner.all')}
      >
        <option value="">{t('filters.owner.all')}</option>
        {owners.map((owner) => (
          <option key={owner.id} value={owner.id}>
            {owner.name}
          </option>
        ))}
      </select>
    </div>
  );
}
