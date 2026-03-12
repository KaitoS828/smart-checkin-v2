'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Reservation } from '@/lib/supabase/types';
import GuestInfoForm from './components/GuestInfoForm';
import { useI18n } from '@/lib/i18n/context';
import { LocaleSwitcher } from '@/lib/i18n/LocaleSwitcher';

export default function RegisterPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { t } = useI18n();
  const router = useRouter();
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [guestInfoSubmitted, setGuestInfoSubmitted] = useState(false);

  useEffect(() => {
    fetchReservation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchReservation = async () => {
    try {
      const response = await fetch(`/api/reservations/${id}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch reservation');
      }

      setReservation(data.reservation);
      setGuestInfoSubmitted(Boolean(data.reservation.guest_name));
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.error'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuestInfoSubmitted = (updatedReservation: Reservation) => {
    setReservation(updatedReservation);
    setGuestInfoSubmitted(true);
    // モーダルの「次へ進む」等で遷移させるため、ここでの自動遷移は行いません。
    // GuestInfoForm 内から router.push 等が呼ばれる想定です。
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <div className="relative w-10 h-10 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full border-2 border-border" />
            <div className="absolute inset-0 rounded-full border-2 border-foreground border-t-transparent animate-spin" />
          </div>
          <p className="text-sm text-text-secondary">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (error || !reservation) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center animate-fade-in">
          <div className="text-5xl mb-6">⚠</div>
          <h1 className="text-2xl font-bold text-foreground mb-3">
            {t('register.notFound')}
          </h1>
          <p className="text-text-secondary mb-8">
            {error || t('register.notFoundDesc')}
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

  return (
    <div className="min-h-screen bg-background">
      <nav className="max-w-2xl mx-auto px-6 py-8 flex items-center justify-between">
        <Link href="/" className="text-lg font-semibold tracking-tight text-foreground">
          {t('common.appName')}
        </Link>
        <LocaleSwitcher />
      </nav>

      <div className="max-w-2xl mx-auto px-6 pb-16">
        <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2">
          {t('register.title')}
        </h1>
        <p className="text-text-secondary mb-10">
          {t('register.subtitle')}
        </p>

        {!guestInfoSubmitted ? (
          <GuestInfoForm
            reservation={reservation}
            onGuestInfoSubmitted={handleGuestInfoSubmitted}
          />
        ) : (
          <div className="text-center py-8 animate-fade-in">
            <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">
              {t('register.complete')}
            </h2>
            <p className="text-text-secondary mb-8">
              {t('register.completeDesc')}
            </p>

            <div className="border-2 border-foreground rounded-xl p-6 max-w-xs mx-auto mb-8">
              <p className="text-xs font-semibold text-text-secondary uppercase tracking-widest mb-3">
                Secret Code
              </p>
              <p className="text-3xl font-bold font-mono text-foreground tracking-widest">
                {reservation.secret_code}
              </p>
              <p className="text-xs text-text-muted mt-3">
                チェックイン時に必要です。必ず控えてください。
              </p>
            </div>

            <div className="bg-surface-secondary rounded-lg p-4 max-w-sm mx-auto text-left">
              <p className="text-sm text-foreground font-medium mb-2">{t('register.howToCheckin')}</p>
              <ol className="text-sm text-text-secondary space-y-1 list-decimal list-inside">
                <li>{t('register.howStep1')}</li>
                <li>{t('register.howStep2')}</li>
                <li>{t('register.howStep3')}</li>
              </ol>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
