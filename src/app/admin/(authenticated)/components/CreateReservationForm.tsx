'use client';

import { useState } from 'react';
import { Reservation } from '@/lib/supabase/types';
import { useI18n } from '@/lib/i18n/context';

interface CreateReservationFormProps {
  onReservationCreated: (reservation: Reservation) => void;
  propertyId?: string;
}

export default function CreateReservationForm({
  onReservationCreated,
  propertyId,
}: CreateReservationFormProps) {
  const { t, locale } = useI18n();
  const [stayType, setStayType] = useState<'宿泊' | 'デイユース'>('宿泊');
  const [doorPin, setDoorPin] = useState('');
  const [checkInDate, setCheckInDate] = useState('');
  const [checkOutDate, setCheckOutDate] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [createdReservation, setCreatedReservation] = useState<Reservation | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showEmailPreview, setShowEmailPreview] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    setShowSuccess(false);
    setShowEmailPreview(false);

    try {
      const response = await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          door_pin: doorPin,
          check_in_date: checkInDate,
          check_out_date: stayType === 'デイユース' ? checkInDate : (checkOutDate || null),
          stay_type: stayType,
          property_id: propertyId ?? null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create reservation');
      }

      setCreatedReservation(data.reservation);
      setShowSuccess(true);
      setDoorPin('');
      setCheckInDate('');
      setCheckOutDate('');
      setStayType('宿泊');
      onReservationCreated(data.reservation);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.error'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const getRegistrationUrl = () => {
    if (!createdReservation) return '';
    return `${window.location.origin}/register/${createdReservation.id}`;
  };

  const generateEmailBody = () => {
    if (!createdReservation) return '';
    const url = getRegistrationUrl();

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

${createdReservation.secret_code}

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

${createdReservation.secret_code}

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
  };

  const handleOpenMailApp = () => {
    const subject = encodeURIComponent(t('admin.emailSubject'));
    const body = encodeURIComponent(generateEmailBody());
    window.open(`mailto:?subject=${subject}&body=${body}`);
  };

  const handleCopyEmail = () => {
    const subject = t('admin.emailSubject') + '\n\n';
    handleCopy(subject + generateEmailBody(), 'email');
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* 宿泊タイプ タブ */}
        <div className="flex rounded-lg border border-border overflow-hidden">
          {(['宿泊', 'デイユース'] as const).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setStayType(type)}
              className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                stayType === type
                  ? 'bg-foreground text-background'
                  : 'bg-surface text-text-secondary hover:bg-surface-secondary'
              }`}
            >
              {type}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="check_in_date" className="block text-sm font-medium text-foreground mb-1.5">
              {t('admin.checkInDate')} <span className="text-danger">*</span>
            </label>
            <input
              type="date"
              id="check_in_date"
              value={checkInDate}
              onChange={(e) => setCheckInDate(e.target.value)}
              className="block w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20 focus:border-foreground/40"
              required
              disabled={isLoading}
            />
          </div>
          <div>
            <label htmlFor="check_out_date" className="block text-sm font-medium text-foreground mb-1.5">
              {t('admin.checkOutDate')}
              {stayType === 'デイユース' && (
                <span className="ml-2 text-xs text-text-muted font-normal">（自動設定）</span>
              )}
            </label>
            <input
              type="date"
              id="check_out_date"
              value={stayType === 'デイユース' ? checkInDate : checkOutDate}
              onChange={(e) => setCheckOutDate(e.target.value)}
              className="block w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20 focus:border-foreground/40 disabled:opacity-60"
              disabled={isLoading || stayType === 'デイユース'}
            />
          </div>
        </div>

        <div>
          <label htmlFor="door_pin" className="block text-sm font-medium text-foreground mb-1.5">
            {t('admin.doorPin')} <span className="text-danger">*</span>
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              id="door_pin"
              value={doorPin}
              onChange={(e) => setDoorPin(e.target.value)}
              className="flex-1 rounded-lg border border-border bg-surface px-4 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20 focus:border-foreground/40 font-mono"
              placeholder="123456"
              required
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => setDoorPin(String(Math.floor(100000 + Math.random() * 900000)))}
              disabled={isLoading}
              className="px-3 py-2.5 rounded-lg border border-border text-xs font-medium text-foreground hover:bg-surface-secondary transition-colors whitespace-nowrap"
            >
              ランダム生成
            </button>
          </div>
          <p className="mt-1.5 text-xs text-text-muted">
            {t('admin.doorPinHint')}
          </p>
        </div>

        {error && (
          <div className="rounded-lg bg-danger/5 border border-danger/20 p-3">
            <p className="text-sm text-danger">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3 px-4 rounded-lg bg-foreground text-background text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? t('admin.creating') : t('admin.createButton')}
        </button>
      </form>

      {showSuccess && createdReservation && (
        <div className="rounded-lg border-2 border-success/30 bg-success/5 p-5 space-y-4 animate-fade-in">
          <p className="text-sm font-semibold text-success">{t('admin.created')}</p>

          <div>
            <p className="text-xs font-medium text-text-secondary mb-1.5">{t('admin.regUrl')}</p>
            <div className="flex gap-2">
              <input type="text" value={getRegistrationUrl()} readOnly className="flex-1 px-3 py-2 bg-surface border border-border rounded-lg text-xs font-mono text-foreground" />
              <button onClick={() => handleCopy(getRegistrationUrl(), 'url')} className="px-3 py-2 border border-border rounded-lg text-xs font-medium text-foreground hover:bg-surface-secondary transition-colors">
                {copiedField === 'url' ? t('common.copied') : t('common.copy')}
              </button>
            </div>
          </div>

          <div>
            <p className="text-xs font-medium text-text-secondary mb-1.5">Secret Code</p>
            <div className="flex gap-2">
              <input type="text" value={createdReservation.secret_code} readOnly className="flex-1 px-3 py-2 bg-surface border border-border rounded-lg text-lg font-bold font-mono text-foreground" />
              <button onClick={() => handleCopy(createdReservation.secret_code, 'code')} className="px-3 py-2 border border-border rounded-lg text-xs font-medium text-foreground hover:bg-surface-secondary transition-colors">
                {copiedField === 'code' ? t('common.copied') : t('common.copy')}
              </button>
            </div>
          </div>

          <div className="border-t border-border pt-4 space-y-2">
            <p className="text-xs font-medium text-text-secondary mb-2">{t('admin.emailTitle')}</p>
            <button onClick={handleOpenMailApp} className="w-full py-2.5 px-4 rounded-lg bg-foreground text-background text-sm font-medium hover:opacity-90 transition-opacity">
              {t('admin.emailApp')}
            </button>
            <button onClick={handleCopyEmail} className="w-full py-2.5 px-4 rounded-lg border border-border text-foreground text-sm font-medium hover:bg-surface-secondary transition-colors">
              {copiedField === 'email' ? t('admin.emailCopied') : t('admin.emailCopy')}
            </button>
            <button onClick={() => setShowEmailPreview(!showEmailPreview)} className="w-full py-2 px-4 text-xs text-text-secondary hover:text-foreground transition-colors">
              {showEmailPreview ? t('admin.emailPreviewClose') : t('admin.emailPreview')}
            </button>
          </div>

          {showEmailPreview && (
            <div className="border border-border rounded-lg overflow-hidden animate-fade-in">
              <div className="bg-surface-secondary px-4 py-2 border-b border-border">
                <p className="text-xs font-semibold text-foreground">
                  Subject: {t('admin.emailSubject')}
                </p>
              </div>
              <pre className="px-4 py-3 text-xs text-text-secondary whitespace-pre-wrap font-sans leading-relaxed max-h-80 overflow-y-auto">
                {generateEmailBody()}
              </pre>
            </div>
          )}

          <div className="bg-warning/5 border border-warning/20 rounded-lg p-3">
            <p className="text-xs text-warning">
              <strong>{t('admin.important')}</strong> {t('admin.importantNote')}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
