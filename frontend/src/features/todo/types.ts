export type TodoStatus = 'todo' | 'in-progress' | 'done';

export type TodoPriority = 'low' | 'medium' | 'high';

export interface TodoOwner {
  id: string;
  name: string;
}

export interface TodoOwnerInput {
  name: string;
}

export interface TodoItem {
  id: string;
  title: string;
  description?: string | undefined;
  ownerId: string;
  ownerName: string;
  status: TodoStatus;
  priority: TodoPriority;
  dueDate?: string | undefined;
  createdAt: string;
  updatedAt: string;
}

export interface TodoItemInput {
  title: string;
  description?: string | undefined;
  ownerId: string;
  status: TodoStatus;
  priority: TodoPriority;
  dueDate?: string | undefined;
}

export interface TodoItemQuery {
  status?: TodoStatus | undefined;
  ownerId?: string | undefined;
}
