import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { ChevronRight, Home, PanelLeftClose, PanelLeftOpen, type LucideIcon } from 'lucide-react';

import { useAppStore } from '@/app/store';
import { cn } from '@/lib/cn';
import { MODULES } from '@/lib/constants';

const inSection = (pathname: string, modPath: string) =>
  pathname === `/${modPath}` || pathname.startsWith(`/${modPath}/`);

export function Sidebar() {
  const collapsed = useAppStore((s) => s.sidebarCollapsed);
  const toggle = useAppStore((s) => s.toggleSidebar);
  const { pathname } = useLocation();

  const [openSections, setOpenSections] = useState<Set<string>>(() => {
    const set = new Set<string>();
    for (const mod of MODULES) {
      if (mod.children?.length && inSection(pathname, mod.path)) set.add(mod.id);
    }
    return set;
  });

  const prevPath = useRef(pathname);
  useEffect(() => {
    const prev = prevPath.current;
    prevPath.current = pathname;
    for (const mod of MODULES) {
      if (!mod.children?.length) continue;
      if (inSection(pathname, mod.path) && !inSection(prev, mod.path)) {
        setOpenSections((cur) => {
          if (cur.has(mod.id)) return cur;
          const next = new Set(cur);
          next.add(mod.id);
          return next;
        });
      }
    }
  }, [pathname]);

  const toggleSection = (id: string) =>
    setOpenSections((cur) => {
      const next = new Set(cur);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

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

      <nav className="flex-1 space-y-0.5 overflow-y-auto p-2">
        <NavItem to="/" icon={Home} label="Genel Bakış" collapsed={collapsed} end />
        <div className="my-1.5 border-t border-border" />
        {MODULES.map((mod) => {
          const base = `/${mod.path}`;
          const hasChildren = Boolean(mod.children?.length) && !collapsed;
          const isOpen = openSections.has(mod.id);
          return (
            <div key={mod.id}>
              <NavItem
                to={base}
                icon={mod.icon}
                label={mod.label}
                collapsed={collapsed}
                badge={!hasChildren && !mod.implemented ? 'soon' : undefined}
                expandable={hasChildren}
                expanded={isOpen}
                onClick={hasChildren ? () => toggleSection(mod.id) : undefined}
              />
              {hasChildren && (
                <div
                  className={cn(
                    'grid transition-[grid-template-rows] duration-200 ease-out',
                    isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
                  )}
                >
                  <div className="overflow-hidden">
                    <div className="mb-1 ml-[1.35rem] mt-0.5 space-y-0.5 border-l border-border pl-2">
                      {mod.children?.map((sub) => (
                        <SubNavItem key={sub.id} to={`${base}/${sub.path}`} label={sub.label} />
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
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
  expandable?: boolean | undefined;
  expanded?: boolean | undefined;
  onClick?: (() => void) | undefined;
}

function NavItem({
  to,
  icon: Icon,
  label,
  collapsed,
  end,
  badge,
  expandable,
  expanded,
  onClick,
}: NavItemProps): ReactNode {
  return (
    <NavLink
      to={to}
      end={end ?? false}
      onClick={onClick}
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
          {!collapsed && expandable && (
            <ChevronRight
              size={14}
              className={cn(
                'ml-auto shrink-0 text-fg-subtle transition-transform',
                expanded && 'rotate-90',
              )}
            />
          )}
          {!collapsed && !expandable && badge && (
            <span className="ml-auto text-[10px] uppercase text-fg-subtle">{badge}</span>
          )}
        </>
      )}
    </NavLink>
  );
}

function SubNavItem({ to, label }: { to: string; label: string }): ReactNode {
  return (
    <NavLink
      to={to}
      end
      className={({ isActive }) =>
        cn(
          'block truncate rounded-md px-2.5 py-1.5 text-[13px] transition-colors',
          isActive
            ? 'bg-surface-2 text-fg'
            : 'text-fg-subtle hover:bg-surface-2 hover:text-fg-muted',
        )
      }
    >
      {label}
    </NavLink>
  );
}
