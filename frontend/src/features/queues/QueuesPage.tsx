import { ComingSoon } from '@/components/ui';
import { MODULES } from '@/lib/constants';

const mod = MODULES.find((m) => m.id === 'queues')!;

export default function QueuesPage() {
  return (
    <ComingSoon
      icon={mod.icon}
      title={mod.label}
      description={mod.description}
      planned={[
        'Topic / kuyruk listesi: derinlik, consumer lag, hata oranı',
        'DLQ mesajlarını görüntüle: payload + header + hata sebebi',
        'Seçili mesajı yeniden kuyruğa al veya at (test / preprod)',
        'Bir orderId’ye ait mesajları filtrele',
      ]}
    />
  );
}
