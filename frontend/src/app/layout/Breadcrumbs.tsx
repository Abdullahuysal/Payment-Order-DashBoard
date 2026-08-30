import { Fragment } from 'react';
import { Link, useMatches } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function Breadcrumbs() {
  const { t } = useTranslation('common');
  const matches = useMatches();
  const crumbs = matches.flatMap((m) => {
    const handle: unknown = m.handle;
    if (
      handle &&
      typeof handle === 'object' &&
      'crumbKey' in handle &&
      typeof handle.crumbKey === 'string'
    ) {
      return [{ id: m.id, path: m.pathname, crumbKey: handle.crumbKey }];
    }
    return [];
  });

  return (
    <nav aria-label={t('breadcrumb.aria')} className="flex items-center gap-1.5 text-sm">
      <Link to="/" className="text-fg-subtle hover:text-fg-muted">
        {t('breadcrumb.root')}
      </Link>
      {crumbs.map((c, i) => {
        const isLast = i === crumbs.length - 1;
        const label: string = t(c.crumbKey as never);
        return (
          <Fragment key={c.id}>
            <ChevronRight size={13} className="text-fg-subtle" />
            {isLast ? (
              <span className="font-medium text-fg">{label}</span>
            ) : (
              <Link to={c.path} className="text-fg-muted hover:text-fg">
                {label}
              </Link>
            )}
          </Fragment>
        );
      })}
    </nav>
  );
}
