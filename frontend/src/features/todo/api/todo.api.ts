import { apiClient } from '@/services/http';

import type { TodoItem, TodoItemInput, TodoItemQuery, TodoOwner, TodoOwnerInput } from '../types';

const R = '/api/v1/todo';

type QueryValue = string | number | boolean | null | undefined;

const seg = (value: string): string => encodeURIComponent(value);

export interface TodoApi {
  listOwners(signal?: AbortSignal): Promise<TodoOwner[]>;
  createOwner(input: TodoOwnerInput): Promise<TodoOwner>;
  listItems(query?: TodoItemQuery, signal?: AbortSignal): Promise<TodoItem[]>;
  saveItem(input: TodoItemInput, itemId?: string): Promise<TodoItem>;
  deleteItem(itemId: string): Promise<void>;
}

export const todoApi: TodoApi = {
  listOwners(signal) {
    return apiClient().get<TodoOwner[]>(`${R}/owners`, signal ? { signal } : {});
  },

  createOwner(input) {
    return apiClient().post<TodoOwner>(`${R}/owners`, input);
  },

  listItems(query, signal) {
    return apiClient().get<TodoItem[]>(`${R}/items`, {
      ...(query ? { query: query as Record<string, QueryValue> } : {}),
      ...(signal ? { signal } : {}),
    });
  },

  saveItem(input, itemId) {
    return itemId
      ? apiClient().put<TodoItem>(`${R}/items/${seg(itemId)}`, input)
      : apiClient().post<TodoItem>(`${R}/items`, input);
  },

  deleteItem(itemId) {
    return apiClient().delete<void>(`${R}/items/${seg(itemId)}`);
  },
};
