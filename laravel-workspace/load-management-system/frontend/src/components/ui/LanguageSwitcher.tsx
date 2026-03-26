'use client';

import { useTranslation } from '@/i18n';
import { Globe } from 'lucide-react';

export default function LanguageSwitcher() {
  const { locale, setLocale, t } = useTranslation();

  return (
    <button
      onClick={() => setLocale(locale === 'en' ? 'bn' : 'en')}
      className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium
                 bg-gray-200 dark:bg-white/10 backdrop-blur-sm
                 border border-gray-300 dark:border-white/20
                 text-gray-700 dark:text-gray-200
                 transition-all duration-300 hover:scale-105 active:scale-95
                 hover:bg-gray-300 dark:hover:bg-white/20"
      title={t('common.language')}
    >
      <Globe size={16} />
      <span>{locale === 'en' ? t('common.bangla') : t('common.english')}</span>
    </button>
  );
}
