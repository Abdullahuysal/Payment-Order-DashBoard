import { prettyValue } from '../lib';
import { CopyButton } from './kit';

export function JsonView({
  label,
  value,
  defaultOpen = false,
}: {
  label: string;
  value: unknown;
  defaultOpen?: boolean;
}) {
  if (value == null) return null;
  const text = prettyValue(value);

  return (
    <details open={defaultOpen} className="rounded-md border border-border">
      <summary className="flex cursor-pointer items-center justify-between gap-2 px-2.5 py-1.5 text-[11px] text-fg-subtle hover:text-fg-muted">
        <span className="font-semibold uppercase tracking-wide">{label}</span>
        <span onClick={(event) => event.preventDefault()}>
          <CopyButton value={text} idleLabel="kopyala" />
        </span>
      </summary>
      <pre className="tnum max-h-72 overflow-auto border-t border-border bg-bg px-2.5 py-2 text-[11px] leading-relaxed text-fg-muted">
        {text}
      </pre>
    </details>
  );
}
