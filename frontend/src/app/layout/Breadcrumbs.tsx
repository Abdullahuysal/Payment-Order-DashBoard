import { Fragment } from 'react';
import { Link, useMatches } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

export function Breadcrumbs() {
  const matches = useMatches();
  const crumbs = matches.flatMap((m) => {
    const handle: unknown = m.handle;
    if (
      handle &&
      typeof handle === 'object' &&
      'crumb' in handle &&
      typeof handle.crumb === 'string'
    ) {
      return [{ id: m.id, path: m.pathname, label: handle.crumb }];
    }
    return [];
  });

  return (
    <nav aria-label="breadcrumb" className="flex items-center gap-1.5 text-sm">
      <Link to="/" className="text-fg-subtle hover:text-fg-muted">
        Ops
      </Link>
      {crumbs.map((c, i) => {
        const isLast = i === crumbs.length - 1;
        return (
          <Fragment key={c.id}>
            <ChevronRight size={13} className="text-fg-subtle" />
            {isLast ? (
              <span className="font-medium text-fg">{c.label}</span>
            ) : (
              <Link to={c.path} className="text-fg-muted hover:text-fg">
                {c.label}
              </Link>
            )}
          </Fragment>
        );
      })}
    </nav>
  );
}
