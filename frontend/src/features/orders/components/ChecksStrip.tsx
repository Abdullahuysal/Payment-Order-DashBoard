import { Link } from 'react-router-dom';

import { cn } from '@/lib/cn';

import { stateIcon, stateLabel, stateTone } from '../lib';
import type { BadgeTone } from '../lib';
import type { CheckItem } from '../types';

const CARD_TONE: Record<BadgeTone, string> = {
  up: 'border-status-up/30 bg-status-up/5',
  degraded: 'border-status-degraded/30 bg-status-degraded/5',
  down: 'border-status-down/30 bg-status-down/5',
  logs: 'border-accent-logs/30 bg-accent-logs/5',
  neutral: 'border-border bg-surface',
};

const ICON_TONE: Record<BadgeTone, string> = {
  up: 'text-status-up',
  degraded: 'text-status-degraded',
  down: 'text-status-down',
  logs: 'text-accent-logs',
  neutral: 'text-fg-subtle',
};

export function ChecksStrip({ checks }: { checks: readonly CheckItem[] }) {
  if (checks.length === 0) return null;

  return (
    <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
      {checks.map((check) => {
        const tone = stateTone(check.state);
        const Icon = stateIcon(check.state);
        const faded = check.state === 'na';

        return (
          <li
            key={check.key}
            className={cn(
              'flex flex-col gap-1 rounded-lg border px-2.5 py-2',
              CARD_TONE[tone],
              faded && 'opacity-60',
            )}
          >
            <div className="flex items-center gap-1.5">
              <Icon size={14} strokeWidth={2} className={cn('shrink-0', ICON_TONE[tone])} />
              <span className="min-w-0 flex-1 truncate text-xs font-semibold text-fg">
                {check.label}
              </span>
            </div>
            <span className="text-[11px] font-medium text-fg-muted">{stateLabel(check.state)}</span>
            {check.value && (
              <span className="break-words text-[11px] text-fg-muted">{check.value}</span>
            )}
            {check.detail && (
              <span className="break-words text-[11px] leading-snug text-fg-subtle">
                {check.detail}
              </span>
            )}
            {check.links && check.links.length > 0 && (
              <div className="mt-0.5 flex flex-wrap gap-x-2 gap-y-0.5">
                {check.links.map((link) => (
                  <CheckLinkItem
                    key={`${link.label}-${link.href}`}
                    href={link.href}
                    label={link.label}
                  />
                ))}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

function CheckLinkItem({ href, label }: { href: string; label: string }) {
  const className = 'text-[11px] text-accent-logs underline underline-offset-2 hover:no-underline';
  if (href.startsWith('/')) {
    return (
      <Link to={href} className={className}>
        {label}
      </Link>
    );
  }
  return (
    <a href={href} target="_blank" rel="noreferrer" className={className}>
      {label}
    </a>
  );
}
