'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import CredentialAuth from './components/CredentialAuth';
import { useI18n } from '@/lib/i18n/context';
import { LocaleSwitcher } from '@/lib/i18n/LocaleSwitcher';

interface AuthResult {
  reservationId: string;
  wherebyRoomUrl?: string | null;
}

export default function CheckinPage() {
  const { t } = useI18n();
  const router = useRouter();

  const handleAuthSuccess = (result: AuthResult) => {
    router.push(`/checkin/${result.reservationId}`);
  };

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
          {t('checkin.title')}
        </h1>
        <p className="text-text-secondary mb-10">
          {t('checkin.subtitle')}
        </p>

        <div className="animate-fade-in">
          <CredentialAuth onAuthSuccess={handleAuthSuccess} />
        </div>
      </div>
    </div>
  );
}
