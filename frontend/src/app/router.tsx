import { createBrowserRouter, Navigate } from 'react-router-dom';

import HomePage from '@/app/HomePage';
import { AppShell } from '@/app/layout/AppShell';

import HealthPage from '@/features/health/HealthPage';
import TestRunsPage from '@/features/test-runs/TestRunsPage';
import ScenarioPage from '@/features/test-runs/ScenarioPage';
import RunPage from '@/features/test-runs/RunPage';
import RunHistoryPage from '@/features/test-runs/RunHistoryPage';
import TestDataPage from '@/features/test-data/TestDataPage';
import TodoPage from '@/features/todo/TodoPage';
import OrdersPage from '@/features/orders/OrdersPage';
import OrderDossierPage from '@/features/orders/OrderDossierPage';
import QueuesPage from '@/features/queues/QueuesPage';
import ErrorsPage from '@/features/errors/ErrorsPage';
import LogsPage from '@/features/logs/LogsPage';
import DevToolsPage from '@/features/dev-tools/DevToolsPage';
import ToolPage from '@/features/dev-tools/ToolPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <HomePage /> },
      {
        path: 'health',
        handle: { crumbKey: 'nav:modules.health.label' },
        element: <HealthPage />,
      },
      {
        path: 'test-runs',
        handle: { crumbKey: 'nav:modules.test-runs.label' },
        children: [
          { index: true, element: <TestRunsPage /> },
          {
            path: 'history',
            handle: { crumbKey: 'nav:crumbs.runHistory' },
            element: <RunHistoryPage />,
          },
          { path: 'runs/:runId', handle: { crumbKey: 'nav:crumbs.run' }, element: <RunPage /> },
          { path: ':key', element: <ScenarioPage /> },
        ],
      },
      {
        path: 'test-data',
        handle: { crumbKey: 'nav:modules.test-data.label' },
        element: <TestDataPage />,
      },
      {
        path: 'orders',
        handle: { crumbKey: 'nav:modules.orders.label' },
        children: [
          { index: true, element: <OrdersPage /> },
          {
            path: ':orderId',
            handle: { crumbKey: 'nav:crumbs.order' },
            element: <OrderDossierPage />,
          },
        ],
      },
      {
        path: 'queues',
        handle: { crumbKey: 'nav:modules.queues.label' },
        element: <QueuesPage />,
      },
      {
        path: 'errors',
        handle: { crumbKey: 'nav:modules.errors.label' },
        element: <ErrorsPage />,
      },
      {
        path: 'logs',
        handle: { crumbKey: 'nav:modules.logs.label' },
        element: <LogsPage />,
      },
      {
        path: 'dev-tools',
        handle: { crumbKey: 'nav:modules.dev-tools.label' },
        children: [
          { index: true, element: <DevToolsPage /> },
          { path: ':toolKey', element: <ToolPage /> },
        ],
      },
      {
        path: 'todo',
        handle: { crumbKey: 'nav:modules.todo.label' },
        element: <TodoPage />,
      },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
]);
