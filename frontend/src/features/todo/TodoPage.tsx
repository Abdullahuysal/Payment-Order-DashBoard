import { useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button, Card, CardBody, CardHeader, CardTitle, Drawer } from '@/components/ui';

import { TodoFilters } from './components/TodoFilters';
import { TodoForm } from './components/TodoForm';
import { ErrorHint, LoadingLines } from './components/kit';
import { TodoList } from './components/TodoList';
import { useDeleteTodoItem, useSaveTodoItem, useTodoItems, useTodoOwners } from './hooks/useTodo';
import type { TodoItem, TodoItemQuery, TodoStatus } from './types';

type StatusFilter = TodoStatus | 'all';
type DrawerState = { mode: 'new' } | { mode: 'edit'; item: TodoItem } | null;

export default function TodoPage() {
  const { t } = useTranslation('todo');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [ownerId, setOwnerId] = useState('');
  const [drawer, setDrawer] = useState<DrawerState>(null);

  const query: TodoItemQuery = useMemo(
    () => ({
      ...(status !== 'all' ? { status } : {}),
      ...(ownerId ? { ownerId } : {}),
    }),
    [status, ownerId],
  );

  const ownersQuery = useTodoOwners();
  const itemsQuery = useTodoItems(query);
  const saveItem = useSaveTodoItem();
  const deleteItem = useDeleteTodoItem();

  const owners = ownersQuery.data ?? [];

  const removeItem = (item: TodoItem) => {
    if (!window.confirm(t('list.deleteConfirm', { title: item.title }))) return;
    deleteItem.mutate(item.id);
  };

  return (
    <div className="mx-auto max-w-3xl py-4">
      <div className="mt-2 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-fg">{t('page.title')}</h1>
          <p className="mt-1 max-w-2xl text-sm text-fg-muted">{t('page.description')}</p>
        </div>
        <Button variant="primary" onClick={() => setDrawer({ mode: 'new' })}>
          <Plus size={13} />
          {t('page.newItem')}
        </Button>
      </div>

      <div className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>{t('page.title')}</CardTitle>
          </CardHeader>
          <CardBody className="space-y-4">
            <TodoFilters
              status={status}
              onStatusChange={setStatus}
              owners={owners}
              ownerId={ownerId}
              onOwnerChange={setOwnerId}
            />

            {itemsQuery.isLoading ? (
              <LoadingLines rows={4} />
            ) : itemsQuery.isError ? (
              <ErrorHint error={itemsQuery.error} onRetry={() => void itemsQuery.refetch()} />
            ) : (
              <TodoList
                items={itemsQuery.data ?? []}
                owners={owners}
                onEdit={(item) => setDrawer({ mode: 'edit', item })}
                onDelete={removeItem}
              />
            )}
          </CardBody>
        </Card>
      </div>

      {drawer && (
        <Drawer
          open
          onClose={() => setDrawer(null)}
          width="md"
          title={drawer.mode === 'new' ? t('form.newTitle') : t('form.editTitle')}
        >
          <TodoForm
            owners={owners}
            item={drawer.mode === 'edit' ? drawer.item : undefined}
            pending={saveItem.isPending}
            error={saveItem.error}
            onCancel={() => setDrawer(null)}
            onSubmit={(input) =>
              saveItem.mutate(
                { input, itemId: drawer.mode === 'edit' ? drawer.item.id : undefined },
                { onSuccess: () => setDrawer(null) },
              )
            }
          />
        </Drawer>
      )}
    </div>
  );
}
