import { Drawer } from '@/components/ui';

import type { Scenario } from '../types';
import { KindBadge } from './KindBadge';

interface ScenarioChooserProps {
  open: boolean;
  onClose: () => void;
  scenarios: Scenario[];
  variableKey: string;
  onPick: (scenario: Scenario) => void;
}

export function ScenarioChooser({
  open,
  onClose,
  scenarios,
  variableKey,
  onPick,
}: ScenarioChooserProps) {
  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={`“${variableKey}” değerini taşı`}
      subtitle="Seçtiğin senaryonun aynı isimli alanı bu değerle ön-doldurulur."
    >
      <ul className="space-y-2">
        {scenarios.map((scenario) => (
          <li key={scenario.id}>
            <button
              type="button"
              onClick={() => onPick(scenario)}
              className="flex w-full items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-left transition-colors hover:border-border-strong"
            >
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm text-fg">{scenario.name}</span>
                <span className="block truncate text-[11px] text-fg-subtle">
                  {scenario.description}
                </span>
              </span>
              <KindBadge kind={scenario.kind} />
            </button>
          </li>
        ))}
      </ul>
    </Drawer>
  );
}
