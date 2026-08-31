import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui';

import { useCreateTodoOwner } from '../hooks/useTodo';
import type { TodoOwner } from '../types';
import { controlClass, FieldShell } from './kit';

interface TodoOwnerPickerProps {
  owners: TodoOwner[];
  ownerId: string;
  onChange: (ownerId: string) => void;
  error?: string | undefined;
}

export function TodoOwnerPicker({ owners, ownerId, onChange, error }: TodoOwnerPickerProps) {
  const { t } = useTranslation('todo');
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [nameError, setNameError] = useState<string | undefined>(undefined);
  const createOwner = useCreateTodoOwner();

  const submitNewOwner = () => {
    const trimmed = name.trim();
    if (trimmed === '') {
      setNameError(t('owner.nameRequired'));
      return;
    }
    createOwner.mutate(
      { name: trimmed },
      {
        onSuccess: (owner) => {
          onChange(owner.id);
          setAdding(false);
          setName('');
          setNameError(undefined);
        },
      },
    );
  };

  return (
    <FieldShell id="todo-owner" label={t('form.fields.owner')} required error={error}>
      {adding ? (
        <div className="flex items-center gap-2">
          <input
            id="todo-owner"
            className={controlClass}
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              setNameError(undefined);
            }}
            placeholder={t('owner.namePlaceholder')}
            autoFocus
          />
          <Button
            size="sm"
            variant="secondary"
            onClick={submitNewOwner}
            disabled={createOwner.isPending}
          >
            {t('owner.add')}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setAdding(false)}>
            ×
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <select
            id="todo-owner"
            className={controlClass}
            value={ownerId}
            onChange={(event) => onChange(event.target.value)}
          >
            <option value="">{t('owner.none')}</option>
            {owners.map((owner) => (
              <option key={owner.id} value={owner.id}>
                {owner.name}
              </option>
            ))}
          </select>
          <Button size="sm" variant="ghost" onClick={() => setAdding(true)}>
            <Plus size={13} />
            {t('owner.addNew')}
          </Button>
        </div>
      )}
      {nameError && (
        <p role="alert" className="text-[11px] text-status-down">
          {nameError}
        </p>
      )}
    </FieldShell>
  );
}
