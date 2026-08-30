import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';

import type { LinkItem } from '../types';

export function LinksRow({ links }: { links: readonly LinkItem[] }) {
  if (links.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {links.map((link) => {
        const className =
          'inline-flex items-center gap-1 rounded-md border border-border bg-surface px-2.5 py-1.5 text-xs text-fg-muted transition-colors hover:border-border-strong hover:text-fg';
        return link.href.startsWith('/') ? (
          <Link key={link.key} to={link.href} className={className}>
            {link.label}
            <ArrowUpRight size={12} className="text-fg-subtle" />
          </Link>
        ) : (
          <a key={link.key} href={link.href} target="_blank" rel="noreferrer" className={className}>
            {link.label}
            <ArrowUpRight size={12} className="text-fg-subtle" />
          </a>
        );
      })}
    </div>
  );
}
