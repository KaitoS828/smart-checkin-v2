'use client';

import { useState } from 'react';
import { useI18n } from '@/lib/i18n/context';

interface AuthResult {
  reservationId: string;
  wherebyRoomUrl?: string | null;
}

interface CredentialAuthProps {
  onAuthSuccess: (result: AuthResult) => void;
}

export default function CredentialAuth({ onAuthSuccess }: CredentialAuthProps) {
  const { t } = useI18n();
  const [secretCode, setSecretCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/checkin/authenticate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ secretCode }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      onAuthSuccess({
        reservationId: data.reservationId,
        wherebyRoomUrl: data.wherebyRoomUrl,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.error'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-surface rounded-2xl p-6 border border-border shadow-sm">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-12 h-12 bg-surface-secondary rounded-xl flex items-center justify-center text-xl border border-border">
          🔑
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">
            {t('checkin.stepAuth') || '本人確認'}
          </h2>
          <p className="text-sm text-text-secondary mt-1">
            {t('checkin.authDesc') || 'Secret Codeを入力してください'}
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-text mb-1" htmlFor="secretCode">
            {t('secret.title') || 'Secret Code'}
          </label>
          <input
            type="text"
            id="secretCode"
            placeholder={t('secret.placeholder') || 'XXX-XXX-XX0'}
            className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-foreground focus:border-transparent outline-none transition-all text-foreground uppercase"
            value={secretCode}
            onChange={(e) => setSecretCode(e.target.value)}
            disabled={isLoading}
            required
          />
        </div>
        <button
          type="submit"
          disabled={isLoading || !secretCode}
          className="w-full py-4 bg-foreground text-background rounded-xl font-semibold text-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-6"
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-background border-t-transparent rounded-full animate-spin" />
          ) : (
             t('secret.submit') || '認証する'
          )}
        </button>
      </form>
    </div>
  );
}
