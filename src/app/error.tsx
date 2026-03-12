'use client';

import { useI18n } from '@/lib/i18n/context';

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useI18n();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="text-center animate-fade-in">
        <div className="text-5xl mb-6">⚠</div>
        <h1 className="text-2xl font-bold text-foreground mb-3">
          {t('error.title')}
        </h1>
        <p className="text-text-secondary mb-8">
          {t('error.description')}
        </p>
        <button
          onClick={reset}
          className="px-6 py-3 rounded-lg bg-foreground text-background font-medium hover:opacity-90 transition-opacity"
        >
          {t('error.retry')}
        </button>
      </div>
    </div>
  );
}
