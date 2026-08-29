import { createBrowserRouter, Navigate } from 'react-router-dom';

import HomePage from '@/app/HomePage';
import { AppShell } from '@/app/layout/AppShell';
import { TEST_RUN_SCENARIOS } from '@/lib/constants';

import HealthPage from '@/features/health/HealthPage';
import TestRunsPage from '@/features/test-runs/TestRunsPage';
import ScenarioPage from '@/features/test-runs/ScenarioPage';
import TestDataPage from '@/features/test-data/TestDataPage';
import OrdersPage from '@/features/orders/OrdersPage';
import QueuesPage from '@/features/queues/QueuesPage';
import ErrorsPage from '@/features/errors/ErrorsPage';
import LogsPage from '@/features/logs/LogsPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <HomePage /> },
      {
        path: 'health',
        handle: { crumb: 'Servis Sağlığı' },
        element: <HealthPage />,
      },
      {
        path: 'test-runs',
        handle: { crumb: 'Test Koşumları' },
        children: [
          { index: true, element: <TestRunsPage /> },
          ...TEST_RUN_SCENARIOS.map((sc) => ({
            path: sc.path,
            handle: { crumb: sc.label },
            element: <ScenarioPage scenarioId={sc.id} />,
          })),
        ],
      },
      {
        path: 'test-data',
        handle: { crumb: 'Test Verisi Üretici' },
        element: <TestDataPage />,
      },
      {
        path: 'orders',
        handle: { crumb: 'Sipariş Kontrol' },
        element: <OrdersPage />,
      },
      {
        path: 'queues',
        handle: { crumb: 'Mesaj Kuyrukları & DLQ' },
        element: <QueuesPage />,
      },
      {
        path: 'errors',
        handle: { crumb: 'Hata Panosu' },
        element: <ErrorsPage />,
      },
      {
        path: 'logs',
        handle: { crumb: 'Log & AI' },
        element: <LogsPage />,
      },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
]);
