import type { ReactNode } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Badge } from '@/components/ui';
import { cn } from '@/lib/cn';
import { formatRelative } from '@/lib/format';

import { groupByOwner } from '../lib';
import type { TodoItem, TodoOwner, TodoPriority, TodoStatus } from '../types';
import { EmptyHint, LoadingLines, SectionHeading } from './kit';

interface TodoListProps {
  items: TodoItem[];
  owners: TodoOwner[];
  loading?: boolean | undefined;
  onEdit: (item: TodoItem) => void;
  onDelete: (item: TodoItem) => void;
}

const statusTone: Record<TodoStatus, 'neutral' | 'degraded' | 'up'> = {
  todo: 'neutral',
  'in-progress': 'degraded',
  done: 'up',
};

const priorityTone: Record<TodoPriority, 'neutral' | 'degraded' | 'down'> = {
  low: 'neutral',
  medium: 'degraded',
  high: 'down',
};

export function TodoList({ items, owners, loading, onEdit, onDelete }: TodoListProps) {
  const { t } = useTranslation('todo');

  if (loading) return <LoadingLines rows={4} />;
  if (items.length === 0) return <EmptyHint>{t('list.empty')}</EmptyHint>;

  const groups = groupByOwner(items, owners);

  return (
    <div className="space-y-4">
      {groups.map((group) => (
        <div key={group.owner.id} className="space-y-2">
          <SectionHeading>{group.owner.name}</SectionHeading>
          <div className="space-y-2">
            {group.items.map((item) => (
              <Row
                key={item.id}
                item={item}
                onEdit={() => onEdit(item)}
                onDelete={() => onDelete(item)}
                editLabel={t('list.editAria')}
                deleteLabel={t('list.deleteAria')}
                statusLabel={t(`status.${item.status}`)}
                priorityLabel={t(`priority.${item.priority}`)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function Row({
  item,
  onEdit,
  onDelete,
  editLabel,
  deleteLabel,
  statusLabel,
  priorityLabel,
}: {
  item: TodoItem;
  onEdit: () => void;
  onDelete: () => void;
  editLabel: string;
  deleteLabel: string;
  statusLabel: string;
  priorityLabel: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-surface px-3 py-2 transition-colors hover:border-border-strong">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'block truncate text-sm text-fg',
              item.status === 'done' && 'text-fg-muted line-through',
            )}
          >
            {item.title}
          </span>
          <Badge tone={priorityTone[item.priority]}>{priorityLabel}</Badge>
        </div>
        {item.description && (
          <span className="mt-0.5 block truncate text-[11px] text-fg-subtle">
            {item.description}
          </span>
        )}
      </div>
      {item.dueDate && (
        <span className="shrink-0 text-[11px] text-fg-subtle">{formatRelative(item.dueDate)}</span>
      )}
      <Badge tone={statusTone[item.status]}>{statusLabel}</Badge>
      <span className="flex shrink-0 items-center gap-0.5">
        <IconAction label={editLabel} onClick={onEdit}>
          <Pencil size={13} />
        </IconAction>
        <IconAction label={deleteLabel} onClick={onDelete}>
          <Trash2 size={13} />
        </IconAction>
      </span>
    </div>
  );
}

function IconAction({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="rounded p-1.5 text-fg-subtle hover:bg-surface-2 hover:text-fg"
    >
      {children}
    </button>
  );
}
