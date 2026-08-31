import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button, Segmented } from '@/components/ui';

import { defaultTodoItemValues, PRIORITY_ORDER, STATUS_ORDER } from '../lib';
import type { TodoItem, TodoItemInput, TodoOwner, TodoPriority, TodoStatus } from '../types';
import { controlClass, ErrorHint, FieldShell } from './kit';
import { TodoOwnerPicker } from './TodoOwnerPicker';

interface TodoFormProps {
  owners: TodoOwner[];
  item?: TodoItem | undefined;
  pending?: boolean | undefined;
  error?: unknown;
  onSubmit: (input: TodoItemInput) => void;
  onCancel: () => void;
}

export function TodoForm({ owners, item, pending, error, onSubmit, onCancel }: TodoFormProps) {
  const { t } = useTranslation(['todo', 'common']);
  const defaults = defaultTodoItemValues();

  const [title, setTitle] = useState(item?.title ?? defaults.title);
  const [description, setDescription] = useState(item?.description ?? defaults.description);
  const [ownerId, setOwnerId] = useState(item?.ownerId ?? defaults.ownerId);
  const [status, setStatus] = useState<TodoStatus>(item?.status ?? defaults.status);
  const [priority, setPriority] = useState<TodoPriority>(item?.priority ?? defaults.priority);
  const [dueDate, setDueDate] = useState(item?.dueDate ?? defaults.dueDate);
  const [titleError, setTitleError] = useState<string | undefined>(undefined);
  const [ownerError, setOwnerError] = useState<string | undefined>(undefined);

  const submit = () => {
    const trimmedTitle = title.trim();
    let valid = true;
    if (trimmedTitle === '') {
      setTitleError(t('form.titleRequired'));
      valid = false;
    }
    if (ownerId === '') {
      setOwnerError(t('form.ownerRequired'));
      valid = false;
    }
    if (!valid) return;

    onSubmit({
      title: trimmedTitle,
      description: description.trim() === '' ? undefined : description.trim(),
      ownerId,
      status,
      priority,
      dueDate: dueDate === '' ? undefined : dueDate,
    });
  };

  return (
    <form
      className="space-y-5"
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
    >
      <FieldShell id="todo-title" label={t('form.fields.title')} required error={titleError}>
        <input
          id="todo-title"
          className={controlClass}
          value={title}
          onChange={(event) => {
            setTitle(event.target.value);
            setTitleError(undefined);
          }}
          placeholder={t('form.fields.titlePlaceholder')}
        />
      </FieldShell>

      <FieldShell id="todo-description" label={t('form.fields.description')}>
        <textarea
          id="todo-description"
          className={`${controlClass} h-20 resize-none py-2`}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder={t('form.fields.descriptionPlaceholder')}
        />
      </FieldShell>

      <TodoOwnerPicker
        owners={owners}
        ownerId={ownerId}
        onChange={(value) => {
          setOwnerId(value);
          setOwnerError(undefined);
        }}
        error={ownerError}
      />

      <FieldShell id="todo-status" label={t('form.fields.status')}>
        <Segmented
          ariaLabel={t('form.fields.status')}
          value={status}
          onChange={setStatus}
          options={STATUS_ORDER.map((value) => ({ value, label: t(`status.${value}`) }))}
        />
      </FieldShell>

      <FieldShell id="todo-priority" label={t('priority.label')}>
        <Segmented
          ariaLabel={t('priority.label')}
          value={priority}
          onChange={setPriority}
          options={PRIORITY_ORDER.map((value) => ({ value, label: t(`priority.${value}`) }))}
        />
      </FieldShell>

      <FieldShell id="todo-due-date" label={t('form.fields.dueDate')}>
        <input
          id="todo-due-date"
          type="date"
          className={controlClass}
          value={dueDate}
          onChange={(event) => setDueDate(event.target.value)}
        />
      </FieldShell>

      {error != null && <ErrorHint error={error} />}

      <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
        <Button variant="ghost" onClick={onCancel} disabled={pending ?? false}>
          {t('common:actions.cancel')}
        </Button>
        <Button type="submit" variant="primary" disabled={pending ?? false}>
          {pending ? t('form.saving') : t('form.save')}
        </Button>
      </div>
    </form>
  );
}
