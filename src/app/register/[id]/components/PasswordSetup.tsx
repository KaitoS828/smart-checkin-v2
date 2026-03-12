'use client';

import { useState } from 'react';
import { Reservation } from '@/lib/supabase/types';
import { useI18n } from '@/lib/i18n/context';

interface PasswordSetupProps {
  reservation: Reservation;
  onPasswordSetupComplete: () => void;
}

export default function PasswordSetup({ reservation, onPasswordSetupComplete }: PasswordSetupProps) {
  const { t } = useI18n();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError(t('register.passwordTooShort') || 'パスワードは6文字以上で設定してください');
      return;
    }

    if (password !== confirmPassword) {
      setError(t('register.passwordMismatch') || 'パスワードが一致しません');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`/api/reservations/${reservation.id}/password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to set password');
      }

      onPasswordSetupComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.error'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-surface rounded-2xl p-6 border border-border shadow-sm animate-fade-in">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-12 h-12 bg-surface-secondary rounded-xl flex items-center justify-center text-xl border border-border">
          🔒
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">
            {t('register.passwordSetupTitle') || 'チェックイン用パスワードの設定'}
          </h2>
          <p className="text-sm text-text-secondary mt-1">
            {t('register.passwordSetupDesc') || '当日のチェックイン時に使用するパスワードを設定します。'}
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
          <label className="block text-sm font-medium text-text mt-4 mb-1" htmlFor="password">
            {t('register.password') || 'パスワード (6文字以上)'}
          </label>
          <input
            type="password"
            id="password"
            className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-foreground focus:border-transparent outline-none transition-all text-foreground"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
            required
            minLength={6}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-text mb-1" htmlFor="confirm-password">
            {t('register.confirmPassword') || 'パスワード (確認不要)'}
          </label>
          <input
            type="password"
            id="confirm-password"
            className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-foreground focus:border-transparent outline-none transition-all text-foreground"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={isLoading}
            required
            minLength={6}
          />
        </div>

        <button
          type="submit"
          disabled={isLoading || !password || !confirmPassword}
          className="w-full py-4 bg-foreground text-background rounded-xl font-semibold text-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-6"
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-background border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              {t('register.setupPassword') || 'パスワードを設定する'}
              <span>→</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
