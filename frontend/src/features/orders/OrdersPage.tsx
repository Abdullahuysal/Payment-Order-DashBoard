import { ComingSoon } from '@/components/ui';
import { MODULES } from '@/lib/constants';

const mod = MODULES.find((m) => m.id === 'orders')!;

export default function OrdersPage() {
  return (
    <ComingSoon
      icon={mod.icon}
      title={mod.label}
      description={mod.description}
      planned={[
        'Sipariş no / müşteri / tarih ile arama (read-only)',
        'Sipariş durumu, ödeme ve kargo adımlarının zaman çizelgesi',
        'İlgili servis loglarına ve AI yorumuna kısayol',
      ]}
    />
  );
}
