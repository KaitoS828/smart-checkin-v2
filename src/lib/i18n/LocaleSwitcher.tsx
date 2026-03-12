'use client';

import { useI18n } from './context';
import { Locale } from './translations';

const LOCALES: { value: Locale; label: string }[] = [
  { value: 'ja', label: 'JA' },
  { value: 'en', label: 'EN' },
  { value: 'zh', label: 'ZH' },
  { value: 'ko', label: 'KO' },
];

export function LocaleSwitcher() {
  const { locale, setLocale } = useI18n();

  return (
    <div className="flex items-center gap-1">
      {LOCALES.map(({ value, label }) => (
        <button
          key={value}
          onClick={() => setLocale(value)}
          className={`text-xs font-medium px-2 py-1 rounded-md border transition-colors ${
            locale === value
              ? 'border-foreground/40 text-foreground bg-foreground/8'
              : 'border-transparent text-text-secondary hover:text-foreground'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
