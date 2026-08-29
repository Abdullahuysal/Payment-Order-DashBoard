import { ComingSoon } from '@/components/ui';
import { MODULES } from '@/lib/constants';

const mod = MODULES.find((m) => m.id === 'errors')!;

export default function ErrorsPage() {
  return (
    <ComingSoon
      icon={mod.icon}
      title={mod.label}
      description={mod.description}
      planned={[
        'Son N saatteki hata imzaları: frekans, ilk / son görülme, etkilenen sipariş sayısı',
        'İmzaya tıkla: örnek stacktrace, ilgili traceId’ler, muhtemel servis',
        'Tek tık “ne oldu” AI özeti ve önerilen sahip',
        'Elasticsearch / Sentry kaynağından beslenir',
      ]}
    />
  );
}
