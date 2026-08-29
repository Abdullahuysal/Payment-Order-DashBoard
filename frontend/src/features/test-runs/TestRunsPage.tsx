import { ComingSoon } from '@/components/ui';
import { MODULES } from '@/lib/constants';

const mod = MODULES.find((m) => m.id === 'test-runs')!;

export default function TestRunsPage() {
  return (
    <ComingSoon
      icon={mod.icon}
      title={mod.label}
      description={mod.description}
      planned={[
        'QA senaryo kataloğu ve seçili ortama karşı tetikleme',
        'Koşum başına pass/fail + adım bazlı çıktı',
        'Son koşumların geçmişi ve tekrar çalıştırma',
      ]}
    />
  );
}
