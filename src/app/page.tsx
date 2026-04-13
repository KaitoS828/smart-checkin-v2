'use client';

import Link from 'next/link';
import { useI18n } from '@/lib/i18n/context';
import { LocaleSwitcher } from '@/lib/i18n/LocaleSwitcher';

export default function Home() {
  const { t } = useI18n();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <nav className="max-w-3xl w-full mx-auto px-6 py-8 flex items-center justify-between">
        <span className="text-lg font-semibold tracking-tight text-foreground">
          {t('common.appName')}
        </span>
        <div className="flex items-center gap-4">
          <LocaleSwitcher />
        </div>
      </nav>

      <main className="flex-1">
        <section className="max-w-3xl mx-auto px-6 pt-20 pb-24 h-full flex flex-col justify-center">
          <div className="animate-fade-in text-center sm:text-left">
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-foreground leading-tight mb-6">
              Welcome to<br/>Our Smart Check-in
            </h1>
            <p className="text-lg text-text-secondary leading-relaxed max-w-xl mx-auto sm:mx-0 mb-12">
              スムーズなご案内のため、スマートフォンから事前のチェックイン手続きをお願いいたします。フロントでの待ち時間なく、スムーズにお部屋へご案内いたします。
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center sm:justify-start">
              <Link
                href="/checkin"
                className="inline-flex items-center justify-center px-8 py-4 rounded-xl bg-foreground text-background font-bold text-lg shadow-lg hover:opacity-90 hover:scale-[1.02] transition-all"
              >
                チェックイン手続きへ進む &rarr;
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border mt-auto bg-surface">
        <div className="max-w-3xl mx-auto px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-6 text-xs text-text-muted">
            <Link href="/privacy" className="hover:text-foreground transition-colors">
              プライバシーポリシー
            </Link>
            <Link href="/policy" className="hover:text-foreground transition-colors">
              キャンセルポリシー
            </Link>
          </div>
          <span className="text-xs text-text-muted">
            © {new Date().getFullYear()} {t('common.appName')}
          </span>
        </div>
      </footer>
    </div>
  );
}
