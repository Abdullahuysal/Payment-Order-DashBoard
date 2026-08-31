import { useMutation, useQuery, useQueryClient, type UseQueryResult } from '@tanstack/react-query';

import { todoApi } from '../api/todo.api';
import type { TodoItem, TodoItemInput, TodoItemQuery, TodoOwner, TodoOwnerInput } from '../types';

export const todoKeys = {
  owners: ['todo', 'owners'] as const,
  items: (query: TodoItemQuery) => ['todo', 'items', query] as const,
};

export function useTodoOwners(): UseQueryResult<TodoOwner[]> {
  return useQuery({
    queryKey: todoKeys.owners,
    queryFn: ({ signal }) => todoApi.listOwners(signal),
    staleTime: 30_000,
  });
}

export function useCreateTodoOwner() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: TodoOwnerInput) => todoApi.createOwner(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: todoKeys.owners }),
  });
}

export function useTodoItems(query: TodoItemQuery): UseQueryResult<TodoItem[]> {
  return useQuery({
    queryKey: todoKeys.items(query),
    queryFn: ({ signal }) => todoApi.listItems(query, signal),
    staleTime: 10_000,
  });
}

export function useSaveTodoItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ input, itemId }: { input: TodoItemInput; itemId?: string | undefined }) =>
      todoApi.saveItem(input, itemId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['todo', 'items'] }),
  });
}

export function useDeleteTodoItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (itemId: string) => todoApi.deleteItem(itemId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['todo', 'items'] }),
  });
}
