import type { ReactNode } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Home, PanelLeftClose, PanelLeftOpen, type LucideIcon } from 'lucide-react';

import { useAppStore } from '@/app/store';
import { cn } from '@/lib/cn';
import { MODULES } from '@/lib/constants';

export function Sidebar() {
  const collapsed = useAppStore((s) => s.sidebarCollapsed);
  const toggle = useAppStore((s) => s.toggleSidebar);

  return (
    <aside
      className={cn(
        'flex shrink-0 flex-col border-r border-border bg-surface transition-[width] duration-200',
        collapsed ? 'w-[var(--spacing-sidebar-collapsed)]' : 'w-[var(--spacing-sidebar)]',
      )}
    >
      <Link
        to="/"
        className={cn(
          'flex h-[var(--spacing-topbar)] items-center border-b border-border',
          collapsed ? 'justify-center px-0' : 'px-3',
        )}
      >
        <span className="h-2.5 w-2.5 rounded-full bg-primary" />
        {!collapsed && (
          <span className="ml-2 text-sm font-semibold tracking-tight">
            Payment&nbsp;·&nbsp;Order Ops
          </span>
        )}
      </Link>

      <nav className="flex-1 space-y-0.5 p-2">
        <NavItem to="/" icon={Home} label="Genel Bakış" collapsed={collapsed} end />
        <div className="my-1.5 border-t border-border" />
        {MODULES.map((mod) => (
          <NavItem
            key={mod.id}
            to={`/${mod.path}`}
            icon={mod.icon}
            label={mod.label}
            collapsed={collapsed}
            badge={!mod.implemented ? 'soon' : undefined}
          />
        ))}
      </nav>

      <button
        type="button"
        onClick={toggle}
        aria-label={collapsed ? 'Menüyü genişlet' : 'Menüyü daralt'}
        className={cn(
          'flex items-center gap-2 border-t border-border px-3 py-2.5 text-xs text-fg-subtle hover:text-fg-muted',
          collapsed && 'justify-center px-0',
        )}
      >
        {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
        {!collapsed && <span>Daralt</span>}
      </button>
    </aside>
  );
}

interface NavItemProps {
  to: string;
  icon: LucideIcon;
  label: string;
  collapsed: boolean;
  end?: boolean;
  badge?: string | undefined;
}

function NavItem({ to, icon: Icon, label, collapsed, end, badge }: NavItemProps): ReactNode {
  return (
    <NavLink
      to={to}
      end={end ?? false}
      title={collapsed ? label : undefined}
      className={({ isActive }) =>
        cn(
          'group flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors',
          collapsed && 'justify-center px-0',
          isActive ? 'bg-surface-2 text-fg' : 'text-fg-muted hover:bg-surface-2 hover:text-fg',
        )
      }
    >
      {({ isActive }) => (
        <>
          <Icon
            size={16}
            strokeWidth={1.75}
            className={cn(isActive ? 'text-fg' : 'text-fg-subtle group-hover:text-fg-muted')}
          />
          {!collapsed && <span className="truncate">{label}</span>}
          {!collapsed && badge && (
            <span className="ml-auto text-[10px] uppercase text-fg-subtle">{badge}</span>
          )}
        </>
      )}
    </NavLink>
  );
}
