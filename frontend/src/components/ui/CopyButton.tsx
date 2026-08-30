import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { cn } from '@/lib/cn';

export interface CopyButtonProps {
  value: string;
  label?: string | undefined;
  idleLabel?: string | undefined;
  className?: string | undefined;
}

export function CopyButton({ value, label, idleLabel, className }: CopyButtonProps) {
  const { t } = useTranslation('common');
  const [done, setDone] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setDone(true);
      window.setTimeout(() => setDone(false), 1200);
    } catch {
      setDone(false);
    }
  };

  const text = label ?? (done ? t('actions.copied') : idleLabel);

  return (
    <button
      type="button"
      onClick={() => void copy()}
      aria-label={t('copyAria', { value })}
      className={cn(
        'inline-flex h-6 shrink-0 items-center gap-1 rounded border border-border px-1.5 text-[11px] text-fg-subtle transition-colors hover:text-fg focus-visible:outline-none focus-visible:border-border-strong',
        className,
      )}
    >
      {done ? <Check size={11} className="text-status-up" /> : <Copy size={11} />}
      {text != null && <span>{text}</span>}
    </button>
  );
}
