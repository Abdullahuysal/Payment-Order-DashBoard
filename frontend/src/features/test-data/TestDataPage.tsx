import { ComingSoon } from '@/components/ui';
import { MODULES } from '@/lib/constants';

const mod = MODULES.find((m) => m.id === 'test-data')!;

export default function TestDataPage() {
  return (
    <ComingSoon
      icon={mod.icon}
      title={mod.label}
      description={mod.description}
      planned={[
        'Senaryo seç: tek müşteri, dolu sepet, ödenmiş sipariş, iade edilebilir sipariş…',
        'Seçili ortama test verisi bas; üretilen id’ler (müşteri no, sipariş no) listelenir',
        'Tek tıkla ilgili Test Koşumu senaryosuna devret',
        'Üretilen kayıtları etiketle ve toplu temizle',
      ]}
    />
  );
}
