import { Link, Navigate, useParams } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

import { ToolRunner } from './components/ToolRunner';
import { getDevTool } from './registry';

export default function ToolPage() {
  const { toolKey } = useParams();
  const config = getDevTool(toolKey);

  if (!config) return <Navigate to="/dev-tools" replace />;

  const Icon = config.icon;

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <div>
        <Link
          to="/dev-tools"
          className="inline-flex items-center gap-1 text-[11px] text-fg-subtle transition-colors hover:text-fg-muted"
        >
          <ChevronLeft size={12} />
          Araçlar
        </Link>
        <header className="mt-1.5 flex items-start gap-2.5">
          <span className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-md border border-border bg-surface-2 text-fg-muted">
            <Icon size={16} strokeWidth={1.75} />
          </span>
          <div>
            <h1 className="text-base font-semibold text-fg">{config.label}</h1>
            <p className="mt-0.5 text-xs text-fg-muted">{config.summary}</p>
          </div>
        </header>
      </div>

      <ToolRunner key={config.key} config={config} />
    </div>
  );
}
