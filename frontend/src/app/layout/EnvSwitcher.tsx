import { useAppStore } from '@/app/store';
import { cn } from '@/lib/cn';
import { APP_ENVIRONMENTS, ENV_LABELS } from '@/services/config';

export function EnvSwitcher() {
  const env = useAppStore((s) => s.environment);
  const setEnv = useAppStore((s) => s.setEnvironment);

  return (
    <div
      role="radiogroup"
      aria-label="Ortam"
      className="flex items-center rounded-md border border-border bg-surface p-0.5"
    >
      {APP_ENVIRONMENTS.map((option) => {
        const active = option === env;
        return (
          <button
            key={option}
            role="radio"
            aria-checked={active}
            onClick={() => setEnv(option)}
            className={cn(
              'rounded px-2 py-1 text-xs font-medium tnum transition-colors',
              active ? 'bg-surface-2 text-fg' : 'text-fg-subtle hover:text-fg-muted',
            )}
          >
            {ENV_LABELS[option]}
          </button>
        );
      })}
    </div>
  );
}
