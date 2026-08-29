import { createBrowserRouter, Navigate } from 'react-router-dom';

import HomePage from '@/app/HomePage';
import { AppShell } from '@/app/layout/AppShell';

import HealthPage from '@/features/health/HealthPage';
import TestRunsPage from '@/features/test-runs/TestRunsPage';
import OrdersPage from '@/features/orders/OrdersPage';
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
        element: <TestRunsPage />,
      },
      {
        path: 'orders',
        handle: { crumb: 'Sipariş Kontrol' },
        element: <OrdersPage />,
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
