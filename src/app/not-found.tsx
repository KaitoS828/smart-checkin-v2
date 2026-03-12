'use client';

import Link from 'next/link';
import { useI18n } from '@/lib/i18n/context';

export default function NotFound() {
  const { t } = useI18n();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="text-center animate-fade-in">
        <div className="text-6xl font-bold text-text-muted mb-4">404</div>
        <h1 className="text-2xl font-bold text-foreground mb-3">
          {t('notFound.title')}
        </h1>
        <p className="text-text-secondary mb-8">
          {t('notFound.description')}
        </p>
        <Link
          href="/"
          className="px-6 py-3 rounded-lg bg-foreground text-background font-medium hover:opacity-90 transition-opacity"
        >
          {t('common.back')}
        </Link>
      </div>
    </div>
  );
}
