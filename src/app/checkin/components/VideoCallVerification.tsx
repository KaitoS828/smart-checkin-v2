'use client';

import { useI18n } from '@/lib/i18n/context';
import { useState, useEffect, useRef, useCallback } from 'react';
// Note: Whereby SDK removed — video call opens in new tab for camera permission compatibility

interface VideoCallVerificationProps {
  reservationId: string;
  roomUrl: string | null;
  onVerificationComplete: (doorPin: string) => void;
}

export default function VideoCallVerification({
  reservationId,
  roomUrl,
  onVerificationComplete,
}: VideoCallVerificationProps) {
  const { t } = useI18n();
  const [pollingError, setPollingError] = useState('');
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // スタッフが管理画面で本人確認完了ボタンを押したかをポーリングで確認
  const checkVerificationStatus = useCallback(async () => {
    try {
      const response = await fetch(`/api/reservations/${reservationId}/status`);
      if (!response.ok) return;

      const data = await response.json();
      if (data.is_checked_in && data.door_pin) {
        // スタッフが確認完了 → ポーリング停止してdoor_pinを渡す
        if (pollingRef.current) {
          clearInterval(pollingRef.current);
        }
        onVerificationComplete(data.door_pin);
      }
    } catch (err) {
      console.error('Polling error:', err);
      setPollingError('確認中にエラーが発生しました。');
    }
  }, [reservationId, onVerificationComplete]);

  useEffect(() => {
    // 3秒ごとにスタッフの確認状態をポーリング
    pollingRef.current = setInterval(checkVerificationStatus, 3000);

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, [checkVerificationStatus]);

  if (!roomUrl) {
    return (
      <div className="bg-surface rounded-2xl p-6 border border-border shadow-sm text-center">
        <p className="text-red-500 mb-4">
          {t('checkin.noRoomUrl') || '通話ルームのURLが見つかりません。フロントにお問い合わせください。'}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-surface rounded-2xl border border-border shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-6 text-center border-b border-border">
        <h2 className="text-xl font-bold text-foreground mb-2">
          {t('checkin.videoCall') || 'フロントスタッフとのビデオ通話'}
        </h2>
        <p className="text-sm text-text-secondary">
          ボタンを押してビデオ通話を開始してください。スタッフが本人確認を行います。
        </p>
      </div>

      {/* Main action */}
      <div className="p-6 flex flex-col items-center gap-4">
        {pollingError && (
          <div className="w-full px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm text-center">
            {pollingError}
          </div>
        )}

        {/* Open video call button */}
        <a
          href={roomUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-3 px-8 py-4 rounded-xl bg-blue-600 text-white text-base font-semibold hover:bg-blue-500 active:scale-95 transition-all shadow-md"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
            <path d="M15 10l4.553-2.369A1 1 0 0121 8.56v6.88a1 1 0 01-1.447.89L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/>
          </svg>
          本人確認ビデオ通話を開始する
        </a>

        <p className="text-xs text-text-muted text-center">
          別タブでビデオ通話が開きます。通話終了後もこの画面はそのままにしてください。
        </p>

        {/* Waiting indicator */}
        <div className="w-full mt-2 flex items-center gap-2 justify-center text-xs text-text-muted">
          <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse flex-shrink-0" />
          スタッフが本人確認を完了するまでこの画面でお待ちください
        </div>
      </div>

      {/* Contact info */}
      <div className="mx-6 mb-6 px-4 py-3 bg-surface-secondary border border-border rounded-lg">
        <p className="text-xs text-text-secondary text-center">
          カメラが起動できない場合や通話が繋がらない場合はお電話ください
        </p>
        <a
          href="tel:08058304957"
          className="block text-center text-lg font-bold text-foreground mt-1 hover:opacity-70 transition-opacity"
        >
          📞 080-5830-4957
        </a>
      </div>
    </div>
  );
}
