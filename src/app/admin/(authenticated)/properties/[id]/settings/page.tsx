'use client';

import { useState, useEffect, use } from 'react';
import { Property } from '@/lib/supabase/types';
import Link from 'next/link';

function Field({ label, children, description }: { label: string; children: React.ReactNode; description?: string }) {
  return (
    <div className="mb-5">
      <label className="block text-sm font-bold text-foreground mb-1.5">{label}</label>
      {description && <p className="text-xs text-text-secondary mb-2">{description}</p>}
      {children}
    </div>
  );
}

const inputCls = 'w-full text-sm text-foreground bg-background border border-border rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-foreground/20 focus:border-foreground/40 transition-shadow';
const textareaCls = inputCls + ' resize-y min-h-[80px]';

export default function PropertySettingsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [property, setProperty] = useState<Property | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState<Partial<Property>>({});

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/properties');
        if (res.ok) {
          const data = await res.json();
          const target = data.properties.find((p: Property) => p.id === id);
          if (target) {
            setProperty(target);
            setForm(target);
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [id]);

  const set = (key: keyof Property) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [key]: e.target.value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch(`/api/properties/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error('Failed to save');
      alert('保存しました');
    } catch {
      alert('保存に失敗しました');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <div className="p-8 text-text-secondary">読み込み中...</div>;
  if (!property) return <div className="p-8 text-danger">宿が見つかりません。</div>;

  return (
    <div className="p-8 max-w-4xl mx-auto md:ml-0 md:mr-auto">
      <div className="mb-6 flex space-x-4 items-center">
        <Link href="/admin/properties" className="text-text-secondary hover:text-foreground flex items-center justify-center w-8 h-8 rounded-full hover:bg-surface border border-transparent hover:border-border transition-colors">
          &larr;
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">宿の設定: {property.name}</h1>
          <p className="text-sm text-text-secondary mt-1">基本情報や各種APIの連携を設定します</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-8">
        <div className="bg-surface border border-border rounded-xl p-6">
          <h2 className="text-lg font-bold text-foreground mb-4">基本情報</h2>
          <Field label="宿名">
            <input className={inputCls} required value={form.name || ''} onChange={set('name')} />
          </Field>
          <Field label="住所">
            <input className={inputCls} value={form.address || ''} onChange={set('address')} />
          </Field>
          <Field label="説明・紹介文" description="施設の特徴や案内文など">
            <textarea className={textareaCls} value={form.description || ''} onChange={set('description')} />
          </Field>
          <Field label="備考（内部メモ）" description="ゲストには表示されない管理者用のメモです">
            <textarea className={textareaCls} value={form.notes || ''} onChange={set('notes')} />
          </Field>
        </div>

        <div className="bg-surface border border-border rounded-xl p-6">
          <h2 className="text-lg font-bold text-foreground mb-4">滞在オプション</h2>
          <div className="grid grid-cols-2 gap-4">
            <Field label="チェックイン時刻">
              <input className={inputCls} type="time" value={form.check_in_time || ''} onChange={set('check_in_time')} />
            </Field>
            <Field label="チェックアウト時刻">
              <input className={inputCls} type="time" value={form.check_out_time || ''} onChange={set('check_out_time')} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-4">
            <Field label="Wi-Fi SSID">
              <input className={inputCls} value={form.wifi_ssid || ''} onChange={set('wifi_ssid')} />
            </Field>
            <Field label="Wi-Fi パスワード">
              <input className={inputCls} value={form.wifi_password || ''} onChange={set('wifi_password')} />
            </Field>
          </div>
        </div>

        <div className="bg-surface border border-border rounded-xl p-6">
          <h2 className="text-lg font-bold text-foreground mb-4">API連携・外部サービス</h2>
          <Field label="Google Calendar ID" description="予約を同期するGoogleカレンダーのID（例: sample@group.calendar.google.com）">
            <input className={inputCls} value={form.google_calendar_id || ''} onChange={set('google_calendar_id')} placeholder="xxx@group.calendar.google.com" />
          </Field>
          <Field label="iCal URL" description="AirbnbやBooking.comなどのiCal連携用URL">
            <input className={inputCls} value={form.ical_url || ''} onChange={set('ical_url')} placeholder="https://..." />
          </Field>
          <Field label="SwitchBot キーパッド デバイスID" description="スマートロックと連携する場合に入力します">
            <input className={inputCls} value={form.switchbot_keypad_device_id || ''} onChange={set('switchbot_keypad_device_id')} placeholder="F76A7198EAD4" />
          </Field>
        </div>

        <div className="pt-4 flex justify-end">
          <button
             type="submit"
             disabled={isSaving}
             className="px-6 py-3 bg-foreground text-background font-bold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 min-w-[120px]"
          >
            {isSaving ? '保存中...' : '設定を保存'}
          </button>
        </div>
      </form>
    </div>
  );
}
