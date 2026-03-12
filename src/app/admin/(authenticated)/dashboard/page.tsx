'use client';

import { useState, useEffect } from 'react';
import { Reservation } from '@/lib/supabase/types';
import ReservationList from '../components/ReservationList';
import CreateReservationForm from '../components/CreateReservationForm';
import { useI18n } from '@/lib/i18n/context';
import { useProperty } from '@/lib/context/property';
import Link from 'next/link';

type TabKey = 'reservations' | 'new';

export default function AdminDashboardPage() {
  const { t } = useI18n();
  const { selectedProperty, properties, isLoading: propertyLoading } = useProperty();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<TabKey>('reservations');

  const fetchReservations = async () => {
    setIsLoading(true);
    try {
      const params = selectedProperty ? `?property_id=${selectedProperty.id}` : '';
      const response = await fetch(`/api/reservations${params}`);
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
    if (!propertyLoading) fetchReservations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProperty?.id, propertyLoading]);

  const handleReservationCreated = (newReservation: Reservation) => {
    setReservations((prev) => [newReservation, ...prev]);
  };

  const tabs: { key: TabKey; label: string; count?: number }[] = [
    { key: 'reservations', label: '予約一覧', count: reservations.length },
    { key: 'new', label: '＋ 新規予約作成' },
  ];

  const checkedInCount = reservations.filter((r) => r.is_checked_in).length;
  const pendingCount = reservations.filter((r) => !r.is_checked_in).length;

  return (
    <div className="p-8">
      {/* Page header */}
      <div className="mb-8">
        {/* Current property banner */}
        {properties.length > 0 && (
          <div className="flex items-center gap-2 mb-3">
            {selectedProperty ? (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-foreground/5 border border-foreground/10 rounded-lg">
                <div className="w-5 h-5 rounded bg-foreground flex items-center justify-center text-[10px] font-bold text-background">
                  {selectedProperty.name.charAt(0)}
                </div>
                <span className="text-xs font-semibold text-foreground">{selectedProperty.name}</span>
                {selectedProperty.address && (
                  <span className="text-xs text-text-muted hidden sm:inline">— {selectedProperty.address}</span>
                )}
                {(selectedProperty.check_in_time || selectedProperty.check_out_time) && (
                  <span className="text-xs text-text-muted border-l border-border pl-2 hidden sm:inline">
                    CI {selectedProperty.check_in_time ?? '—'} / CO {selectedProperty.check_out_time ?? '—'}
                  </span>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/5 border border-amber-500/20 rounded-lg">
                <span className="text-xs text-amber-600">宿が選択されていません</span>
                <Link href="/admin/properties" className="text-xs font-medium text-amber-600 underline">
                  宿を選択する
                </Link>
              </div>
            )}
          </div>
        )}

        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">ダッシュボード</h1>
            <p className="text-sm text-text-secondary mt-1">
              {selectedProperty ? `${selectedProperty.name} の予約管理` : '予約の作成と管理'}
            </p>
          </div>
          {properties.length === 0 && (
            <Link
              href="/admin/properties"
              className="px-4 py-2 text-sm font-medium border border-dashed border-border rounded-lg text-text-secondary hover:text-foreground hover:border-foreground/30 transition-colors"
            >
              ＋ 宿を登録する
            </Link>
          )}
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-surface border border-border rounded-xl p-5">
          <p className="text-xs font-medium text-text-secondary uppercase tracking-widest mb-1">合計予約</p>
          <p className="text-3xl font-bold text-foreground">{reservations.length}</p>
        </div>
        <div className="bg-surface border border-border rounded-xl p-5">
          <p className="text-xs font-medium text-text-secondary uppercase tracking-widest mb-1">チェックイン済</p>
          <div className="flex items-end gap-2">
            <p className="text-3xl font-bold text-foreground">{checkedInCount}</p>
            {reservations.length > 0 && (
              <p className="text-sm text-text-muted mb-0.5">/ {reservations.length}</p>
            )}
          </div>
        </div>
        <div className="bg-surface border border-border rounded-xl p-5">
          <p className="text-xs font-medium text-text-secondary uppercase tracking-widest mb-1">未チェックイン</p>
          <p className="text-3xl font-bold text-foreground">{pendingCount}</p>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex items-center gap-1 border-b border-border mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-all -mb-px ${
              activeTab === tab.key
                ? 'border-foreground text-foreground'
                : 'border-transparent text-text-secondary hover:text-foreground'
            }`}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${
                activeTab === tab.key ? 'bg-foreground text-background' : 'bg-surface-secondary text-text-muted'
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
        {activeTab === 'reservations' && (
          <div className="ml-auto">
            <button
              onClick={fetchReservations}
              disabled={isLoading}
              className="px-3 py-1.5 text-xs font-medium border border-border rounded-lg text-foreground hover:bg-surface-secondary transition-colors disabled:opacity-50"
            >
              {isLoading ? '更新中…' : '↻ 更新'}
            </button>
          </div>
        )}
      </div>

      {/* Tab content */}
      {activeTab === 'reservations' && (
        <div>
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
            <ReservationList reservations={reservations} onRefresh={fetchReservations} />
          )}
        </div>
      )}

      {activeTab === 'new' && (
        <div className="max-w-lg">
          <h2 className="text-lg font-semibold text-foreground mb-6">{t('admin.createTitle')}</h2>
          <div className="bg-surface border border-border rounded-xl p-6">
            <CreateReservationForm
              onReservationCreated={handleReservationCreated}
              propertyId={selectedProperty?.id}
            />
          </div>
        </div>
      )}
    </div>
  );
}
