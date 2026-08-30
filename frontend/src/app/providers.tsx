import { useState, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { I18nextProvider } from 'react-i18next';
import { RouterProvider } from 'react-router-dom';

import i18n from '@/i18n';
import { HttpError } from '@/services/http';

import { router } from './router';

function makeQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 10_000,
        retry: (failureCount, error) => {
          if (error instanceof HttpError && (error.status === 0 || error.status < 500))
            return false;
          return failureCount < 2;
        },
        refetchOnWindowFocus: false,
      },
    },
  });
}

export function AppProviders({ children }: { children?: ReactNode }) {
  const [queryClient] = useState(makeQueryClient);

  return (
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
        {children}
        {import.meta.env.DEV && (
          <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-right" />
        )}
      </QueryClientProvider>
    </I18nextProvider>
  );
}
