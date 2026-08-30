import { useTranslation } from 'react-i18next';

import { ComingSoon } from '@/components/ui';
import { MODULES } from '@/lib/constants';

const mod = MODULES.find((m) => m.id === 'test-data')!;

export default function TestDataPage() {
  const { t } = useTranslation('nav');
  return (
    <ComingSoon
      icon={mod.icon}
      title={t('modules.test-data.label')}
      description={t('modules.test-data.description')}
      planned={t('modules.test-data.planned', { returnObjects: true })}
    />
  );
}
