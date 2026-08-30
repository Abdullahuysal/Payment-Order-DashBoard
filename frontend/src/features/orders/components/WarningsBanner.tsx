import { TriangleAlert } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function WarningsBanner({ warnings }: { warnings: readonly string[] }) {
  const { t } = useTranslation('orders');
  if (warnings.length === 0) return null;

  return (
    <div
      role="alert"
      className="rounded-lg border border-status-degraded/30 bg-status-degraded/5 px-3 py-2.5 text-xs text-fg-muted"
    >
      <div className="flex items-center gap-1.5 font-semibold text-status-degraded">
        <TriangleAlert size={13} strokeWidth={2} />
        {t('warnings.title')}
      </div>
      <ul className="mt-1 list-disc space-y-0.5 pl-5">
        {warnings.map((warning) => (
          <li key={warning}>{warning}</li>
        ))}
      </ul>
    </div>
  );
}
