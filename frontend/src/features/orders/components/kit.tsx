import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Ban, PackageX } from 'lucide-react';
import { Trans, useTranslation } from 'react-i18next';

import { Card, CardBody } from '@/components/ui';
import { cn } from '@/lib/cn';

export function PanelHeading({ children }: { children: ReactNode }) {
  return (
    <h2 className="text-[11px] font-semibold uppercase tracking-wide text-fg-subtle">{children}</h2>
  );
}

export function InlineHint({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p
      className={cn(
        'rounded-lg border border-dashed border-border px-4 py-6 text-center text-xs text-fg-muted',
        className,
      )}
    >
      {children}
    </p>
  );
}

export function ProdDisabledNotice() {
  const { t } = useTranslation('orders');
  return (
    <Card className="mx-auto mt-4 max-w-xl">
      <CardBody className="flex flex-col items-center gap-3 py-10 text-center">
        <span className="flex h-11 w-11 items-center justify-center rounded-lg border border-border bg-surface-2 text-fg-muted">
          <Ban size={20} strokeWidth={1.75} />
        </span>
        <div className="space-y-1">
          <h2 className="text-sm font-semibold text-fg">{t('prodDisabled.title')}</h2>
          <p className="mx-auto max-w-sm text-xs leading-relaxed text-fg-muted">
            <Trans
              t={t}
              i18nKey="prodDisabled.body"
              components={{ k: <span className="tnum" /> }}
            />
          </p>
        </div>
      </CardBody>
    </Card>
  );
}

export function NotFoundState({ orderId }: { orderId: string }) {
  const { t } = useTranslation('orders');
  return (
    <Card className="mx-auto mt-4 max-w-xl">
      <CardBody className="flex flex-col items-center gap-3 py-10 text-center">
        <span className="flex h-11 w-11 items-center justify-center rounded-lg border border-border bg-surface-2 text-fg-muted">
          <PackageX size={20} strokeWidth={1.75} />
        </span>
        <div className="space-y-1">
          <h2 className="text-sm font-semibold text-fg">{t('notFound.title')}</h2>
          <p className="mx-auto max-w-sm text-xs leading-relaxed text-fg-muted">
            <Trans
              t={t}
              i18nKey="notFound.body"
              values={{ orderId }}
              components={{ k: <span className="tnum" /> }}
            />
          </p>
        </div>
        <Link
          to="/orders"
          className="inline-flex h-8 items-center rounded-md border border-border px-3 text-xs text-fg-muted transition-colors hover:border-border-strong hover:text-fg"
        >
          {t('notFound.back')}
        </Link>
      </CardBody>
    </Card>
  );
}

export function DossierSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-16 animate-pulse rounded-lg border border-border bg-surface motion-reduce:animate-none" />
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-20 animate-pulse rounded-lg border border-border bg-surface motion-reduce:animate-none"
          />
        ))}
      </div>
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="h-32 animate-pulse rounded-lg border border-border bg-surface motion-reduce:animate-none"
        />
      ))}
    </div>
  );
}
