import type { LucideIcon } from 'lucide-react';

import { Card, CardBody } from './Card';

export interface ComingSoonProps {
  icon: LucideIcon;
  title: string;
  description: string;
  planned?: string[];
}

export function ComingSoon({ icon: Icon, title, description, planned }: ComingSoonProps) {
  return (
    <Card className="mx-auto mt-4 max-w-xl">
      <CardBody className="flex flex-col items-center gap-3 py-10 text-center">
        <span className="flex h-11 w-11 items-center justify-center rounded-lg border border-border bg-surface-2 text-fg-muted">
          <Icon size={20} strokeWidth={1.75} />
        </span>
        <div className="space-y-1">
          <h2 className="text-sm font-semibold text-fg">{title}</h2>
          <p className="text-xs text-fg-muted">{description}</p>
        </div>
        <span className="rounded border border-border px-2 py-0.5 text-[11px] uppercase tracking-wide text-fg-subtle">
          Yakında
        </span>
        {planned && planned.length > 0 && (
          <ul className="mt-2 space-y-1 text-left text-xs text-fg-muted">
            {planned.map((item) => (
              <li key={item} className="flex gap-2">
                <span className="text-fg-subtle">–</span>
                {item}
              </li>
            ))}
          </ul>
        )}
      </CardBody>
    </Card>
  );
}
