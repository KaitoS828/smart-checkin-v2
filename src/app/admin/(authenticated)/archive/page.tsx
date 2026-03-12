'use client';

import { useState, useEffect } from 'react';
import { Reservation } from '@/lib/supabase/types';
import ReservationList from '../components/ReservationList';
import { useI18n } from '@/lib/i18n/context';

export default function ArchivePage() {
  const { t } = useI18n();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchReservations = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/reservations?archived=true');
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to fetch reservations');
      setReservations(data.reservations);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.error'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReservations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="p-8">
      {/* Page header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">アーカイブ</h1>
          <p className="text-sm text-text-secondary mt-1">アーカイブ済みの予約一覧</p>
        </div>
        <button
          onClick={fetchReservations}
          disabled={isLoading}
          className="px-3 py-1.5 text-xs font-medium border border-border rounded-lg text-foreground hover:bg-surface-secondary transition-colors disabled:opacity-50"
        >
          {isLoading ? '更新中…' : '↻ 更新'}
        </button>
      </div>

      {/* Stats card */}
      <div className="grid grid-cols-1 gap-4 mb-8 max-w-xs">
        <div className="bg-surface border border-border rounded-xl p-5">
          <p className="text-xs font-medium text-text-secondary uppercase tracking-widest mb-1">アーカイブ件数</p>
          <p className="text-3xl font-bold text-foreground">{reservations.length}</p>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-danger/5 border border-danger/20 p-4">
          <p className="text-sm text-danger">{error}</p>
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-16">
          <div className="inline-block w-6 h-6 border-2 border-border border-t-foreground rounded-full animate-spin" />
          <p className="mt-3 text-sm text-text-secondary">{t('common.loading')}</p>
        </div>
      ) : (
        <ReservationList
          reservations={reservations}
          onRefresh={fetchReservations}
          isArchiveView={true}
        />
      )}
    </div>
  );
}
