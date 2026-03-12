'use client';

import { useState, useEffect } from 'react';
import { Reservation } from '@/lib/supabase/types';
import { useI18n } from '@/lib/i18n/context';

export default function CalendarPage() {
  const { t } = useI18n();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Date state
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/reservations');
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed');
        setReservations(data.reservations);
      } catch (e) {
        setError(e instanceof Error ? e.message : t('common.error'));
      } finally {
        setIsLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Calendar logic
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-11
  
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  
  const startDayOfWeek = firstDayOfMonth.getDay(); // 0 (Sun) - 6 (Sat)
  const daysInMonth = lastDayOfMonth.getDate();
  
  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const today = () => setCurrentDate(new Date());

  // Helper to format date as YYYY-MM-DD
  const formatDate = (year: number, month: number, day: number) => {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  // Group reservations by check_in_date
  const reservationsByDate = reservations.reduce((acc, r) => {
    if (r.check_in_date) {
      if (!acc[r.check_in_date]) acc[r.check_in_date] = [];
      acc[r.check_in_date].push(r);
    }
    return acc;
  }, {} as Record<string, Reservation[]>);

  // Generate calendar grid
  const renderCalendarDays = () => {
    const days = [];
    
    // Empty cells before the 1st of the month
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(<div key={`empty-${i}`} className="min-h-[100px] border border-border/50 bg-surface-secondary/20 p-2"></div>);
    }
    
    // Actual days
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = formatDate(year, month, day);
      const isToday = formatDate(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()) === dateStr;
      const dayReservations = reservationsByDate[dateStr] || [];
      
      days.push(
        <div 
          key={dateStr} 
          className={`min-h-[120px] border border-border/50 p-2 flex flex-col gap-1 transition-colors hover:bg-surface-secondary/30 ${
            isToday ? 'bg-primary/5 border-primary/20' : 'bg-surface'
          }`}
        >
          <div className="flex justify-between items-start mb-1">
            <span className={`text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full ${
              isToday ? 'bg-foreground text-background' : 'text-text-secondary'
            }`}>
              {day}
            </span>
            {dayReservations.length > 0 && (
              <span className="text-[10px] bg-foreground/10 text-foreground px-1.5 rounded-sm font-medium">
                {dayReservations.length}件
              </span>
            )}
          </div>
          
          <div className="flex-1 overflow-y-auto space-y-1.5 no-scrollbar">
            {dayReservations.map((r) => (
              <div 
                key={r.id}
                className="text-xs px-2 py-1.5 rounded bg-surface border border-border/80 shadow-sm truncate hover:border-foreground/30 hover:shadow transition-all group relative cursor-default"
                title={`${r.guest_name || '未登録'} (${r.secret_code})`}
              >
                <div className="flex items-center justify-between gap-1 mb-0.5">
                  <span className="font-semibold text-foreground truncate">
                    {r.guest_name || <span className="text-text-muted italic">{t('admin.unregistered')}</span>}
                  </span>
                  {r.is_checked_in && (
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0" />
                  )}
                </div>
                <div className="text-[10px] text-text-muted font-mono truncate">
                  {r.secret_code}
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }
    
    return days;
  };

  return (
    <div className="p-8 h-full flex flex-col max-h-screen">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t('admin.calendarTitle')}</h1>
          <p className="text-sm text-text-secondary mt-1">
            予約状況をカレンダーで確認できます
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={today}
            className="px-3 py-1.5 text-xs font-medium border border-border rounded-lg text-foreground hover:bg-surface-secondary transition-colors"
          >
            今日
          </button>
          <div className="flex items-center gap-2 bg-surface border border-border rounded-lg p-1">
            <button 
              onClick={prevMonth}
              className="p-1 rounded-md hover:bg-surface-secondary text-text-secondary hover:text-foreground transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <span className="w-24 text-center font-semibold text-sm">
              {year}年 {month + 1}月
            </span>
            <button 
              onClick={nextMonth}
              className="p-1 rounded-md hover:bg-surface-secondary text-text-secondary hover:text-foreground transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {isLoading && (
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="inline-block w-6 h-6 border-2 border-border border-t-foreground rounded-full animate-spin" />
          <p className="mt-3 text-sm text-text-secondary">{t('common.loading')}</p>
        </div>
      )}

      {error && (
        <div className="rounded-lg bg-danger/5 border border-danger/20 p-4 mb-6">
          <p className="text-sm text-danger">{error}</p>
        </div>
      )}

      {!isLoading && !error && (
        <div className="flex-1 border border-border rounded-xl overflow-hidden bg-surface flex flex-col min-h-0">
          <div className="grid grid-cols-7 border-b border-border bg-surface-secondary/50">
            {['日', '月', '火', '水', '木', '金', '土'].map((day, i) => (
              <div 
                key={day} 
                className={`py-2 text-center text-xs font-semibold ${
                  i === 0 ? 'text-red-500' : i === 6 ? 'text-blue-500' : 'text-text-secondary'
                }`}
              >
                {day}
              </div>
            ))}
          </div>
          <div className="flex-1 overflow-y-auto no-scrollbar">
            <div className="grid grid-cols-7 auto-rows-fr h-full min-h-[500px]">
              {renderCalendarDays()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
