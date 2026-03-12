'use client';

import { useState, useCallback } from 'react';
import { Reservation } from '@/lib/supabase/types';
import { useI18n } from '@/lib/i18n/context';

function generateEmailBody(r: Reservation, locale: string): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const url = `${origin}/register/${r.id}`;

  if (locale === 'en') {
    return `Thank you for your reservation.

No front desk procedure is required on check-in day.
Please complete pre-registration beforehand and use self-check-in upon arrival.

━━━━━━━━━━━━━━━━━━━━
■ Pre-registration (Before arrival)
━━━━━━━━━━━━━━━━━━━━

Access the following URL:
${url}

Steps:
1. Enter guest information (name, address, contact)
2. Register biometric device (Touch ID / Face ID, etc.)
3. A Secret Code will be displayed → please save it

━━━━━━━━━━━━━━━━━━━━
■ Secret Code
━━━━━━━━━━━━━━━━━━━━

${r.secret_code}

* Required for check-in. Please save this code.

━━━━━━━━━━━━━━━━━━━━
■ Check-in on the day
━━━━━━━━━━━━━━━━━━━━

1. Access the check-in page
2. Authenticate with your registered device
3. Enter the Secret Code
4. The door unlock PIN will be displayed

If you have any questions, please don't hesitate to contact us.
We look forward to welcoming you.`;
  }

  return `この度はご予約いただきありがとうございます。

チェックイン当日はフロントでのお手続きは不要です。
以下の手順で事前登録をお済ませの上、当日セルフチェックインをご利用ください。

━━━━━━━━━━━━━━━━━━━━
■ 事前登録（ご到着前にお済ませください）
━━━━━━━━━━━━━━━━━━━━

以下のURLにアクセスしてください：
${url}

手順：
1. 宿泊者情報（お名前・ご住所・連絡先）を入力
2. チェックイン用パスワードを設定
3. Secret Code が表示されます → 必ず控えてください

━━━━━━━━━━━━━━━━━━━━
■ Secret Code
━━━━━━━━━━━━━━━━━━━━

${r.secret_code}

※ チェックイン時に必要です。必ずお控えください。

━━━━━━━━━━━━━━━━━━━━
■ 当日のチェックイン方法
━━━━━━━━━━━━━━━━━━━━

1. チェックイン画面にアクセス
2. Secret Codeと設定したパスワードを入力して認証
3. 本人確認（ビデオ通話）
4. ドア解錠PINが表示されます

ご不明な点がございましたら、お気軽にお問い合わせください。
それでは、お会いできることを楽しみにしております。`;
}

interface ReservationListProps {
  reservations: Reservation[];
  onRefresh: () => void;
  isArchiveView?: boolean;
}

function InfoRow({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-[10px] font-semibold text-text-muted uppercase tracking-widest mb-0.5">{label}</p>
      <p className="text-sm text-foreground break-all">{value}</p>
    </div>
  );
}

function formatDate(dateStr: string | null | undefined) {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString('ja-JP', { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function ReservationList({
  reservations,
  onRefresh,
  isArchiveView = false,
}: ReservationListProps) {
  const { t, locale } = useI18n();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isProcessing, setIsProcessing] = useState(false);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [cleaningId, setCleaningId] = useState<string | null>(null);
  const [copiedEmailId, setCopiedEmailId] = useState<string | null>(null);
  const [emailPreviewId, setEmailPreviewId] = useState<string | null>(null);
  // notes: reservationId → draft text
  const [notesDraft, setNotesDraft] = useState<Record<string, string>>({});
  const [savingNotesId, setSavingNotesId] = useState<string | null>(null);

  const handleConfirmIdentity = async (reservationId: string) => {
    if (!confirm('この予約の本人確認を完了にしますか？')) return;
    setConfirmingId(reservationId);
    try {
      const response = await fetch('/api/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reservation_id: reservationId }),
      });
      if (!response.ok) throw new Error('Failed to confirm identity');
      onRefresh();
    } catch {
      alert(t('common.error'));
    } finally {
      setConfirmingId(null);
    }
  };

  const handleCleaningConfirm = async (r: Reservation) => {
    const next = !r.cleaning_confirmed;
    if (!confirm(next ? '清掃完了にしますか？' : '清掃確認を取り消しますか？')) return;
    setCleaningId(r.id);
    try {
      const res = await fetch(`/api/reservations/${r.id}/meta`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cleaning_confirmed: next }),
      });
      if (!res.ok) throw new Error('Failed');
      onRefresh();
    } catch {
      alert(t('common.error'));
    } finally {
      setCleaningId(null);
    }
  };

  const handleSaveNotes = useCallback(async (reservationId: string, notes: string) => {
    setSavingNotesId(reservationId);
    try {
      const res = await fetch(`/api/reservations/${reservationId}/meta`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: notes || null }),
      });
      if (!res.ok) throw new Error('Failed');
      // Clear draft after save
      setNotesDraft((prev) => { const next = { ...prev }; delete next[reservationId]; return next; });
      onRefresh();
    } catch {
      alert(t('common.error'));
    } finally {
      setSavingNotesId(null);
    }
  }, [onRefresh, t]);

  const handleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelectedIds(next);
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedIds(e.target.checked ? new Set(reservations.map((r) => r.id)) : new Set());
  };

  const handleExportCsv = () => {
    if (selectedIds.size === 0) return;
    window.open(`/api/reservations/export?ids=${Array.from(selectedIds).join(',')}`, '_blank');
  };

  const handleArchive = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(isArchiveView ? t('admin.confirmUnarchive') : t('admin.confirmArchive'))) return;
    setIsProcessing(true);
    try {
      const res = await fetch('/api/reservations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selectedIds), is_archived: !isArchiveView }),
      });
      if (!res.ok) throw new Error('Failed');
      setSelectedIds(new Set());
      onRefresh();
    } catch {
      alert(t('common.error'));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(t('admin.confirmDelete'))) return;
    setIsProcessing(true);
    try {
      const res = await fetch('/api/reservations', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selectedIds) }),
      });
      if (!res.ok) throw new Error('Failed');
      setSelectedIds(new Set());
      onRefresh();
    } catch {
      alert(t('common.error'));
    } finally {
      setIsProcessing(false);
    }
  };

  if (reservations.length === 0) {
    return (
      <div className="text-center py-16 text-sm text-text-muted">
        {t('admin.noReservations')}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Bulk action bar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-2 px-4 py-2.5 bg-surface border border-border rounded-lg">
          <span className="text-xs font-medium text-text-secondary">{selectedIds.size} 件選択中</span>
          <div className="flex-1" />
          <button onClick={handleExportCsv} disabled={isProcessing} className="px-3 py-1.5 text-xs font-medium border border-border rounded-md text-foreground hover:bg-surface-secondary transition-colors">
            {t('admin.exportSelected')}
          </button>
          {isArchiveView ? (
            <>
              <button onClick={handleArchive} disabled={isProcessing} className="px-3 py-1.5 text-xs font-medium bg-foreground text-background rounded-md hover:opacity-80 transition-opacity">
                {t('admin.unarchiveSelected')}
              </button>
              <button onClick={handleDelete} disabled={isProcessing} className="px-3 py-1.5 text-xs font-medium bg-danger text-white rounded-md hover:bg-danger/90 transition-opacity">
                {t('admin.deleteSelected')}
              </button>
            </>
          ) : (
            <button onClick={handleArchive} disabled={isProcessing} className="px-3 py-1.5 text-xs font-medium bg-foreground text-background rounded-md hover:opacity-80 transition-opacity">
              {t('admin.archiveSelected')}
            </button>
          )}
        </div>
      )}

      {/* Select all row */}
      <div className="flex items-center gap-3 px-4 py-2 text-xs text-text-muted">
        <input type="checkbox" className="rounded border-border" onChange={handleSelectAll} checked={reservations.length > 0 && selectedIds.size === reservations.length} />
        <span>すべて選択</span>
      </div>

      {/* Reservation cards */}
      {reservations.map((r) => {
        const isRegistered = !!r.guest_name;
        const notesValue = notesDraft[r.id] !== undefined ? notesDraft[r.id] : (r.notes ?? '');
        const notesChanged = notesDraft[r.id] !== undefined && notesDraft[r.id] !== (r.notes ?? '');

        return (
          <div
            key={r.id}
            className={`bg-surface border rounded-xl transition-all overflow-hidden ${
              selectedIds.has(r.id) ? 'border-foreground/40 shadow-sm' : 'border-border hover:border-foreground/20'
            }`}
          >
            {/* Card header */}
            <div className="flex items-start gap-3 px-5 py-4">
              <input type="checkbox" className="mt-0.5 rounded border-border" checked={selectedIds.has(r.id)} onChange={() => handleSelect(r.id)} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="font-semibold text-foreground text-base">
                    {r.guest_name ?? <span className="text-text-muted text-sm font-normal italic">{t('admin.unregistered')}</span>}
                  </span>
                  {r.guest_name_kana && <span className="text-xs text-text-muted">{r.guest_name_kana}</span>}
                  {r.is_foreign_national && r.nationality && (
                    <span className="text-xs bg-blue-500/10 text-blue-600 border border-blue-500/20 px-2 py-0.5 rounded-full">
                      🌏 {r.nationality}
                    </span>
                  )}
                  <div className="ml-auto flex items-center gap-2">
                    {r.cleaning_confirmed && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-purple-500/10 text-purple-600 border border-purple-500/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-500 inline-block" />
                        清掃済
                      </span>
                    )}
                    {r.is_checked_in ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500/10 text-green-600 border border-green-500/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
                        {t('admin.checkedIn')}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-600 border border-amber-500/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block animate-pulse" />
                        {t('admin.notCheckedIn')}
                      </span>
                    )}
                  </div>
                </div>
                {r.guest_occupation && <p className="text-xs text-text-muted mt-0.5">{r.guest_occupation}</p>}
              </div>
            </div>

            {/* Main body: 2-column layout */}
            <div className="border-t border-border/50 grid grid-cols-2 divide-x divide-border/50">

              {/* ── LEFT: 宿泊者情報 ── */}
              <div className="px-5 py-4 space-y-4">
                <p className="text-[10px] font-semibold text-text-muted uppercase tracking-widest">宿泊者情報</p>

                {/* Dates */}
                <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                  <div>
                    <p className="text-[10px] font-semibold text-text-muted uppercase tracking-widest mb-0.5">チェックイン</p>
                    <p className="text-sm text-foreground">{formatDate(r.check_in_date) ?? '—'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-text-muted uppercase tracking-widest mb-0.5">チェックアウト</p>
                    <p className="text-sm text-foreground">{formatDate(r.check_out_date) ?? '—'}</p>
                  </div>
                </div>

                {/* Secret Code */}
                <div>
                  <p className="text-[10px] font-semibold text-text-muted uppercase tracking-widest mb-1">Secret Code</p>
                  <code className="text-sm font-mono font-bold text-foreground tracking-widest bg-surface-secondary px-2 py-0.5 rounded">
                    {r.secret_code}
                  </code>
                </div>

                {/* Guest details */}
                {isRegistered && (
                  <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                    <InfoRow label="氏名（カナ）" value={r.guest_name_kana} />
                    <InfoRow label="性別" value={r.guest_gender} />
                    <InfoRow label="住所" value={r.guest_address} />
                    <InfoRow label="連絡先" value={r.guest_contact} />
                    <InfoRow label="職業" value={r.guest_occupation} />
                    {r.is_foreign_national && (
                      <>
                        <InfoRow label="国籍" value={r.nationality} />
                        <InfoRow label="パスポート番号" value={r.passport_number} />
                      </>
                    )}
                  </div>
                )}

                {r.passport_image_url && (
                  <div>
                    <p className="text-[10px] font-semibold text-text-muted uppercase tracking-widest mb-1">パスポート画像</p>
                    <a href={r.passport_image_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-500 hover:text-blue-400 underline">
                      🪪 画像を確認する
                    </a>
                  </div>
                )}

                {/* Registration status */}
                <div className="pt-1 border-t border-border/40 flex items-center gap-2">
                  <p className="text-[10px] font-semibold text-text-muted uppercase tracking-widest">宿泊者登録</p>
                  <p className={`text-xs font-medium ${isRegistered ? 'text-green-600' : 'text-text-muted'}`}>
                    {isRegistered ? '✓ 登録済み' : '未登録'}
                  </p>
                  <p className="text-[10px] text-text-muted ml-auto">
                    登録日: {new Date(r.created_at).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })}
                  </p>
                </div>

                {/* Email actions */}
                <div className="pt-1 border-t border-border/40 space-y-2">
                  <p className="text-[10px] font-semibold text-text-muted uppercase tracking-widest">ゲスト案内メール</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        const subject = encodeURIComponent(t('admin.emailSubject'));
                        const body = encodeURIComponent(generateEmailBody(r, locale));
                        window.open(`mailto:?subject=${subject}&body=${body}`);
                      }}
                      className="flex-1 py-1.5 px-2 rounded-lg bg-foreground text-background text-xs font-medium hover:opacity-90 transition-opacity"
                    >
                      {t('admin.emailApp')}
                    </button>
                    <button
                      onClick={() => {
                        const subject = t('admin.emailSubject') + '\n\n';
                        navigator.clipboard.writeText(subject + generateEmailBody(r, locale));
                        setCopiedEmailId(r.id);
                        setTimeout(() => setCopiedEmailId(null), 2000);
                      }}
                      className="flex-1 py-1.5 px-2 rounded-lg border border-border text-foreground text-xs font-medium hover:bg-surface-secondary transition-colors"
                    >
                      {copiedEmailId === r.id ? t('admin.emailCopied') : t('admin.emailCopy')}
                    </button>
                  </div>
                  <button onClick={() => setEmailPreviewId(emailPreviewId === r.id ? null : r.id)} className="w-full py-1 text-xs text-text-secondary hover:text-foreground transition-colors">
                    {emailPreviewId === r.id ? t('admin.emailPreviewClose') : t('admin.emailPreview')}
                  </button>
                  {emailPreviewId === r.id && (
                    <div className="border border-border rounded-lg overflow-hidden">
                      <div className="bg-surface px-3 py-2 border-b border-border">
                        <p className="text-[10px] font-semibold text-text-muted">Subject: {t('admin.emailSubject')}</p>
                      </div>
                      <pre className="px-3 py-2 text-xs text-text-secondary whitespace-pre-wrap font-sans leading-relaxed max-h-48 overflow-y-auto">
                        {generateEmailBody(r, locale)}
                      </pre>
                    </div>
                  )}
                </div>
              </div>

              {/* ── RIGHT: アクション + 備考 ── */}
              <div className="px-5 py-4 space-y-5">
                <p className="text-[10px] font-semibold text-text-muted uppercase tracking-widest">操作</p>

                {/* Video call */}
                <div className="space-y-2">
                  <p className="text-xs font-medium text-text-secondary">ビデオ通話</p>
                  {r.whereby_host_room_url ? (
                    <a
                      href={r.whereby_host_room_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-blue-600 text-white hover:bg-blue-500 transition-colors"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M15 10l4.553-2.369A1 1 0 0121 8.56v6.88a1 1 0 01-1.447.89L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/>
                      </svg>
                      ホストとして入室
                    </a>
                  ) : (
                    <p className="text-xs text-text-muted">通話URLなし</p>
                  )}
                </div>

                {/* Identity confirmation */}
                <div className="space-y-2">
                  <p className="text-xs font-medium text-text-secondary">本人確認</p>
                  {r.is_checked_in ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-green-500/10 text-green-600 border border-green-500/20">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                      本人確認済み
                    </span>
                  ) : (
                    <button
                      onClick={() => handleConfirmIdentity(r.id)}
                      disabled={confirmingId === r.id}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-green-600 text-white hover:bg-green-500 transition-colors disabled:opacity-50"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                      {confirmingId === r.id ? '処理中…' : '本人確認完了'}
                    </button>
                  )}
                </div>

                {/* Cleaning confirmation */}
                <div className="space-y-2">
                  <p className="text-xs font-medium text-text-secondary">清掃確認</p>
                  <button
                    onClick={() => handleCleaningConfirm(r)}
                    disabled={cleaningId === r.id}
                    className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 ${
                      r.cleaning_confirmed
                        ? 'bg-purple-500/10 text-purple-600 border border-purple-500/20 hover:bg-purple-500/20'
                        : 'bg-surface-secondary text-text-secondary border border-border hover:border-foreground/30 hover:text-foreground'
                    }`}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
                    </svg>
                    {cleaningId === r.id ? '処理中…' : r.cleaning_confirmed ? '清掃完了済み' : '清掃確認'}
                  </button>
                </div>

                {/* Notes */}
                <div className="space-y-2 pt-1 border-t border-border/40">
                  <p className="text-xs font-medium text-text-secondary">備考</p>
                  <textarea
                    value={notesValue}
                    onChange={(e) => setNotesDraft((prev) => ({ ...prev, [r.id]: e.target.value }))}
                    placeholder="メモを入力..."
                    rows={3}
                    className="w-full text-xs text-foreground bg-surface border border-border rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-foreground/20 focus:border-foreground/40 placeholder:text-text-muted"
                  />
                  {notesChanged && (
                    <button
                      onClick={() => handleSaveNotes(r.id, notesDraft[r.id])}
                      disabled={savingNotesId === r.id}
                      className="w-full py-1.5 rounded-lg bg-foreground text-background text-xs font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                    >
                      {savingNotesId === r.id ? '保存中…' : '備考を保存'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
