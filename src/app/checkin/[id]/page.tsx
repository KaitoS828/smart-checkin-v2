'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import VideoCallVerification from '../components/VideoCallVerification';
import { useI18n } from '@/lib/i18n/context';
import { LocaleSwitcher } from '@/lib/i18n/LocaleSwitcher';

type CheckinStep = 'video_call' | 'complete';

interface CheckinResult {
  doorPin: string;
}

export default function CheckinRoomPage() {
  const { t } = useI18n();
  const params = useParams();
  const reservationId = params.id as string;

  const [currentStep, setCurrentStep] = useState<CheckinStep>('video_call');
  const [wherebyRoomUrl, setWherebyRoomUrl] = useState<string | null>(null);
  const [checkinResult, setCheckinResult] = useState<CheckinResult | null>(null);

  useEffect(() => {
    const fetchRoomUrl = async () => {
      const response = await fetch(`/api/reservations/${reservationId}/status`);
      if (!response.ok) return;
      const data = await response.json();
      setWherebyRoomUrl(data.whereby_room_url ?? null);
    };
    fetchRoomUrl();
  }, [reservationId]);

  const handleVerificationComplete = (doorPin: string) => {
    setCheckinResult({ doorPin });
    setCurrentStep('complete');
  };

  const steps = [
    { key: 'video_call', label: t('checkin.videoCall') || 'ビデオ通話' },
    { key: 'complete', label: t('checkin.stepComplete') || '完了' },
  ];
  const currentIndex = steps.findIndex((s) => s.key === currentStep);

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

        {/* Progress */}
        <div className="flex items-center gap-2 mb-10">
          {steps.map((step, i) => (
            <div key={step.key} className="flex items-center gap-2">
              <div
                className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-semibold ${
                  i <= currentIndex
                    ? 'bg-foreground text-background'
                    : 'bg-surface-secondary text-text-muted border border-border'
                }`}
              >
                {i < currentIndex ? '✓' : i + 1}
              </div>
              <span className={`text-sm ${i <= currentIndex ? 'text-foreground font-medium' : 'text-text-muted'}`}>
                {step.label}
              </span>
              {i < steps.length - 1 && (
                <div className={`w-8 h-px ${i < currentIndex ? 'bg-foreground' : 'bg-border'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="animate-fade-in">
          {currentStep === 'video_call' && (
            <VideoCallVerification
              reservationId={reservationId}
              roomUrl={wherebyRoomUrl}
              onVerificationComplete={handleVerificationComplete}
            />
          )}

          {currentStep === 'complete' && checkinResult && (
            <div className="text-center py-8 animate-fade-in">
              <div className="text-5xl mb-4">🎉</div>
              <h2 className="text-2xl font-bold text-foreground mb-2">
                {t('complete.title')}
              </h2>
              <p className="text-text-secondary mb-8">
                ご確認ありがとうございます
              </p>
              <div className="border-2 border-foreground rounded-xl p-6 max-w-xs mx-auto mb-8">
                <p className="text-xs font-semibold text-text-secondary uppercase tracking-widest mb-2">
                  {t('complete.doorPin')}
                </p>
                <p className="text-4xl font-bold font-mono text-foreground tracking-widest">
                  {checkinResult.doorPin}
                </p>
                <p className="text-xs text-text-muted mt-3">
                  {t('complete.doorPinNote')}
                </p>
              </div>
              <Link
                href="/"
                className="text-sm text-text-secondary hover:text-foreground transition-colors"
              >
                {t('complete.backToTop')}
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
