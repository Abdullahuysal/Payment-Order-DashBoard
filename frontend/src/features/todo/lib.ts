import type { TodoItem, TodoOwner, TodoPriority, TodoStatus } from './types';

export const STATUS_ORDER: readonly TodoStatus[] = ['todo', 'in-progress', 'done'];

export const PRIORITY_ORDER: readonly TodoPriority[] = ['high', 'medium', 'low'];

const priorityWeight: Record<TodoPriority, number> = { high: 0, medium: 1, low: 2 };
const statusWeight: Record<TodoStatus, number> = { todo: 0, 'in-progress': 1, done: 2 };

export interface OwnerGroup {
  owner: TodoOwner;
  items: TodoItem[];
}

export function groupByOwner(
  items: readonly TodoItem[],
  owners: readonly TodoOwner[],
): OwnerGroup[] {
  const byId = new Map(owners.map((owner) => [owner.id, owner] as const));
  const buckets = new Map<string, TodoItem[]>();

  for (const item of items) {
    const bucket = buckets.get(item.ownerId);
    if (bucket) bucket.push(item);
    else buckets.set(item.ownerId, [item]);
  }

  const groups: OwnerGroup[] = [];
  for (const [ownerId, ownerItems] of buckets) {
    const owner = byId.get(ownerId) ?? { id: ownerId, name: ownerItems[0]?.ownerName ?? ownerId };
    groups.push({
      owner,
      items: [...ownerItems].sort(
        (a, b) =>
          statusWeight[a.status] - statusWeight[b.status] ||
          priorityWeight[a.priority] - priorityWeight[b.priority],
      ),
    });
  }

  return groups.sort((a, b) => a.owner.name.localeCompare(b.owner.name));
}

export function defaultTodoItemValues(): {
  title: string;
  description: string;
  ownerId: string;
  status: TodoStatus;
  priority: TodoPriority;
  dueDate: string;
} {
  return {
    title: '',
    description: '',
    ownerId: '',
    status: 'todo',
    priority: 'medium',
    dueDate: '',
  };
}
