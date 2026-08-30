import { useTranslation } from 'react-i18next';

import { ComingSoon } from '@/components/ui';
import { MODULES } from '@/lib/constants';

const mod = MODULES.find((m) => m.id === 'errors')!;

export default function ErrorsPage() {
  const { t } = useTranslation('nav');
  return (
    <ComingSoon
      icon={mod.icon}
      title={t('modules.errors.label')}
      description={t('modules.errors.description')}
      planned={t('modules.errors.planned', { returnObjects: true })}
    />
  );
}
