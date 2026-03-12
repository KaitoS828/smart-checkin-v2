'use client';

import { useState } from 'react';
import { Property } from '@/lib/supabase/types';
import { useProperty } from '@/lib/context/property';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-text-secondary mb-1">{label}</label>
      {children}
    </div>
  );
}

const inputCls = 'w-full text-sm text-foreground bg-background border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-foreground/20 focus:border-foreground/40';
const textareaCls = inputCls + ' resize-none';

interface PropertyFormData {
  name: string;
  address: string;
  description: string;
  check_in_time: string;
  check_out_time: string;
  wifi_ssid: string;
  wifi_password: string;
  notes: string;
}

const emptyForm: PropertyFormData = {
  name: '',
  address: '',
  description: '',
  check_in_time: '15:00',
  check_out_time: '11:00',
  wifi_ssid: '',
  wifi_password: '',
  notes: '',
};

function toForm(p: Property): PropertyFormData {
  return {
    name: p.name,
    address: p.address ?? '',
    description: p.description ?? '',
    check_in_time: p.check_in_time ?? '15:00',
    check_out_time: p.check_out_time ?? '11:00',
    wifi_ssid: p.wifi_ssid ?? '',
    wifi_password: p.wifi_password ?? '',
    notes: p.notes ?? '',
  };
}

function PropertyForm({
  initial,
  onSave,
  onCancel,
  isSaving,
}: {
  initial: PropertyFormData;
  onSave: (data: PropertyFormData) => void;
  onCancel: () => void;
  isSaving: boolean;
}) {
  const [form, setForm] = useState(initial);
  const set = (key: keyof PropertyFormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Field label="宿名 *">
          <input className={inputCls} value={form.name} onChange={set('name')} placeholder="例：森の奥ゲストハウス" />
        </Field>
        <Field label="住所">
          <input className={inputCls} value={form.address} onChange={set('address')} placeholder="例：北海道中川郡池田町..." />
        </Field>
      </div>
      <Field label="説明・紹介文">
        <textarea className={textareaCls} rows={2} value={form.description} onChange={set('description')} placeholder="宿の説明や特徴" />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="チェックイン時刻">
          <input className={inputCls} type="time" value={form.check_in_time} onChange={set('check_in_time')} />
        </Field>
        <Field label="チェックアウト時刻">
          <input className={inputCls} type="time" value={form.check_out_time} onChange={set('check_out_time')} />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Wi-Fi SSID">
          <input className={inputCls} value={form.wifi_ssid} onChange={set('wifi_ssid')} placeholder="ネットワーク名" />
        </Field>
        <Field label="Wi-Fi パスワード">
          <input className={inputCls} value={form.wifi_password} onChange={set('wifi_password')} placeholder="パスワード" />
        </Field>
      </div>
      <Field label="備考・内部メモ">
        <textarea className={textareaCls} rows={2} value={form.notes} onChange={set('notes')} placeholder="内部メモ（ゲストには非表示）" />
      </Field>
      <div className="flex gap-2 pt-2">
        <button
          onClick={() => onSave(form)}
          disabled={isSaving || !form.name.trim()}
          className="px-4 py-2 bg-foreground text-background text-sm font-medium rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {isSaving ? '保存中…' : '保存'}
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-2 border border-border text-sm font-medium rounded-lg text-text-secondary hover:text-foreground hover:bg-surface-secondary transition-colors"
        >
          キャンセル
        </button>
      </div>
    </div>
  );
}

export default function PropertiesPage() {
  const { properties, selectedProperty, setSelectedPropertyId, reload } = useProperty();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleCreate = async (form: PropertyFormData) => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/properties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          address: form.address || null,
          description: form.description || null,
          wifi_ssid: form.wifi_ssid || null,
          wifi_password: form.wifi_password || null,
          notes: form.notes || null,
        }),
      });
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      setIsCreating(false);
      await reload();
      setSelectedPropertyId(data.property.id);
    } catch {
      alert('保存に失敗しました');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdate = async (id: string, form: PropertyFormData) => {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/properties/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          address: form.address || null,
          description: form.description || null,
          wifi_ssid: form.wifi_ssid || null,
          wifi_password: form.wifi_password || null,
          notes: form.notes || null,
        }),
      });
      if (!res.ok) throw new Error('Failed');
      setEditingId(null);
      await reload();
    } catch {
      alert('保存に失敗しました');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`「${name}」を削除しますか？\n関連する予約の宿情報は削除されます。`)) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/properties/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed');
      await reload();
    } catch {
      alert('削除に失敗しました');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="p-8 max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">宿を管理</h1>
          <p className="text-sm text-text-secondary mt-1">登録された宿の設定・管理</p>
        </div>
        <button
          onClick={() => { setIsCreating(true); setEditingId(null); }}
          className="px-4 py-2 bg-foreground text-background text-sm font-medium rounded-lg hover:opacity-90 transition-opacity"
        >
          ＋ 宿を追加
        </button>
      </div>

      {/* New property form */}
      {isCreating && (
        <div className="mb-6 bg-surface border border-foreground/20 rounded-xl p-6">
          <h2 className="text-sm font-semibold text-foreground mb-4">新しい宿を追加</h2>
          <PropertyForm
            initial={emptyForm}
            onSave={handleCreate}
            onCancel={() => setIsCreating(false)}
            isSaving={isSaving}
          />
        </div>
      )}

      {/* Property list */}
      {properties.length === 0 && !isCreating ? (
        <div className="text-center py-16 text-sm text-text-muted border border-dashed border-border rounded-xl">
          宿が登録されていません。「＋ 宿を追加」から登録してください。
        </div>
      ) : (
        <div className="space-y-4">
          {properties.map((p) => {
            const isSelected = selectedProperty?.id === p.id;
            const isEditing = editingId === p.id;

            return (
              <div
                key={p.id}
                className={`bg-surface border rounded-xl overflow-hidden transition-all ${
                  isSelected ? 'border-foreground/40 shadow-sm' : 'border-border'
                }`}
              >
                {/* Property header */}
                <div className="px-6 py-4 flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                      isSelected ? 'bg-foreground text-background' : 'bg-surface-secondary text-text-secondary'
                    }`}
                  >
                    {p.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-foreground truncate">{p.name}</p>
                      {isSelected && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-foreground text-background rounded font-medium uppercase tracking-wide">
                          選択中
                        </span>
                      )}
                    </div>
                    {p.address && <p className="text-xs text-text-muted truncate mt-0.5">{p.address}</p>}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {!isSelected && (
                      <button
                        onClick={() => setSelectedPropertyId(p.id)}
                        className="px-3 py-1.5 text-xs font-medium border border-border rounded-lg text-text-secondary hover:text-foreground hover:bg-surface-secondary transition-colors"
                      >
                        選択
                      </button>
                    )}
                    <button
                      onClick={() => setEditingId(isEditing ? null : p.id)}
                      className="px-3 py-1.5 text-xs font-medium border border-border rounded-lg text-text-secondary hover:text-foreground hover:bg-surface-secondary transition-colors"
                    >
                      {isEditing ? '閉じる' : '編集'}
                    </button>
                    <button
                      onClick={() => handleDelete(p.id, p.name)}
                      disabled={deletingId === p.id}
                      className="px-3 py-1.5 text-xs font-medium text-danger border border-danger/20 rounded-lg hover:bg-danger/5 transition-colors disabled:opacity-50"
                    >
                      削除
                    </button>
                  </div>
                </div>

                {/* Info chips */}
                {!isEditing && (p.check_in_time || p.check_out_time || p.wifi_ssid) && (
                  <div className="px-6 pb-4 flex flex-wrap gap-2">
                    {p.check_in_time && (
                      <span className="text-xs bg-surface-secondary text-text-secondary px-2.5 py-1 rounded-full border border-border">
                        CI {p.check_in_time}
                      </span>
                    )}
                    {p.check_out_time && (
                      <span className="text-xs bg-surface-secondary text-text-secondary px-2.5 py-1 rounded-full border border-border">
                        CO {p.check_out_time}
                      </span>
                    )}
                    {p.wifi_ssid && (
                      <span className="text-xs bg-surface-secondary text-text-secondary px-2.5 py-1 rounded-full border border-border">
                        Wi-Fi: {p.wifi_ssid}
                      </span>
                    )}
                  </div>
                )}

                {/* Edit form */}
                {isEditing && (
                  <div className="px-6 pb-6 border-t border-border/50 pt-4">
                    <PropertyForm
                      initial={toForm(p)}
                      onSave={(form) => handleUpdate(p.id, form)}
                      onCancel={() => setEditingId(null)}
                      isSaving={isSaving}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
