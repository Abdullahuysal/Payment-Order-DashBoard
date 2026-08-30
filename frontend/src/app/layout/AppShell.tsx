import { Outlet } from 'react-router-dom';

import { useApplyTheme } from '@/app/hooks/useApplyTheme';
import { useApplyLocale } from '@/i18n/useApplyLocale';

import { AppShellErrorBoundary } from './AppShellErrorBoundary';
import { CommandPalette } from './CommandPalette';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

export function AppShell() {
  useApplyTheme();
  useApplyLocale();

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-bg text-fg">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="flex-1 overflow-y-auto px-6 py-5">
          <AppShellErrorBoundary>
            <Outlet />
          </AppShellErrorBoundary>
        </main>
      </div>
      <CommandPalette />
    </div>
  );
}
