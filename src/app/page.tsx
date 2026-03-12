'use client';

import Link from 'next/link';
import { useI18n } from '@/lib/i18n/context';
import { LocaleSwitcher } from '@/lib/i18n/LocaleSwitcher';

export default function Home() {
  const { t } = useI18n();

  return (
    <div className="min-h-screen bg-background">
      <nav className="max-w-3xl mx-auto px-6 py-8 flex items-center justify-between">
        <span className="text-lg font-semibold tracking-tight text-foreground">
          {t('common.appName')}
        </span>
        <div className="flex items-center gap-4">
          <LocaleSwitcher />
        </div>
      </nav>

      <section className="max-w-3xl mx-auto px-6 pt-16 pb-24">
        <div className="animate-fade-in">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-foreground leading-tight mb-6">
            {t('landing.headline')}
          </h1>
          <p className="text-lg text-text-secondary leading-relaxed max-w-xl mb-12">
            {t('landing.description')}
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/checkin"
              className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-foreground text-background font-medium hover:opacity-90 transition-opacity"
            >
              {t('landing.checkin')}
            </Link>
          </div>
        </div>
      </section>

      <div className="max-w-3xl mx-auto px-6">
        <div className="border-t border-border" />
      </div>

      <section className="max-w-3xl mx-auto px-6 py-24">
        <h2 className="text-sm font-semibold text-text-muted uppercase tracking-widest mb-12">
          {t('landing.howItWorks')}
        </h2>
        <div className="grid gap-12 sm:grid-cols-3">
          {[
            { num: '01', title: t('landing.step1Title'), desc: t('landing.step1Desc') },
            { num: '02', title: t('landing.step2Title'), desc: t('landing.step2Desc') },
            { num: '03', title: t('landing.step3Title'), desc: t('landing.step3Desc') },
          ].map((step) => (
            <div key={step.num}>
              <p className="text-xs text-text-muted font-mono mb-2">{step.num}</p>
              <h3 className="text-foreground font-semibold mb-2">{step.title}</h3>
              <p className="text-sm text-text-secondary leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="max-w-3xl mx-auto px-6">
        <div className="border-t border-border" />
      </div>

      <section className="max-w-3xl mx-auto px-6 py-24">
        <h2 className="text-sm font-semibold text-text-muted uppercase tracking-widest mb-8">
          {t('landing.security')}
        </h2>
        <ul className="space-y-3">
          {[
            t('landing.secFeature1'),
            t('landing.secFeature2'),
            t('landing.secFeature3'),
            t('landing.secFeature4'),
          ].map((feature, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="text-text-muted mt-0.5">✓</span>
              <span className="text-sm text-text-secondary">{feature}</span>
            </li>
          ))}
        </ul>
      </section>

      <footer className="border-t border-border">
        <div className="max-w-3xl mx-auto px-6 py-8 flex items-center justify-between">
          <span className="text-sm font-medium text-text-muted">{t('common.appName')}</span>
          <span className="text-sm text-text-muted">
            © {new Date().getFullYear()}
          </span>
        </div>
      </footer>
    </div>
  );
}
