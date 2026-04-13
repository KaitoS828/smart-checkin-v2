'use client';

import { useState } from 'react';
import { useProperty } from '@/lib/context/property';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function PropertiesPage() {
  const { properties, selectedProperty, setSelectedPropertyId, reload } = useProperty();
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [newName, setNewName] = useState('');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setIsSaving(true);
    try {
      const res = await fetch('/api/properties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName }),
      });
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      await reload();
      setSelectedPropertyId(data.property.id);
      router.push(`/admin/properties/${data.property.id}/settings`);
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
    <div className="p-8 max-w-3xl border-l-[0px]">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">宿を管理</h1>
          <p className="text-sm text-text-secondary mt-1">登録された宿の設定・管理</p>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          className="px-4 py-2 bg-foreground text-background text-sm font-medium rounded-lg hover:opacity-90 transition-opacity"
        >
          ＋ 宿を追加
        </button>
      </div>

      {isCreating && (
        <form onSubmit={handleCreate} className="mb-6 bg-surface border border-foreground/20 rounded-xl p-6">
          <h2 className="text-sm font-semibold text-foreground mb-4">新しい宿を追加</h2>
          <div className="mb-4">
            <label className="block text-xs font-medium text-text-secondary mb-1">宿名 *</label>
            <input
              autoFocus
              className="w-full text-sm text-foreground bg-background border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-foreground/20 focus:border-foreground/40"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="例：森の奥ゲストハウス"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isSaving || !newName.trim()}
              className="px-4 py-2 bg-foreground text-background text-sm font-medium rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {isSaving ? '作成中…' : '作成して設定画面へ'}
            </button>
            <button
              type="button"
              onClick={() => { setIsCreating(false); setNewName(''); }}
              className="px-4 py-2 border border-border text-sm font-medium rounded-lg text-text-secondary hover:text-foreground hover:bg-surface-secondary transition-colors"
            >
              キャンセル
            </button>
          </div>
        </form>
      )}

      {properties.length === 0 && !isCreating ? (
        <div className="text-center py-16 text-sm text-text-muted border border-dashed border-border rounded-xl">
          宿が登録されていません。「＋ 宿を追加」から登録してください。
        </div>
      ) : (
        <div className="space-y-4">
          {properties.map((p) => {
            const isSelected = selectedProperty?.id === p.id;
            return (
              <div key={p.id} className={`bg-surface border rounded-xl overflow-hidden transition-all ${isSelected ? 'border-foreground/40 shadow-sm' : 'border-border'}`}>
                <div className="px-6 py-4 flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0 ${isSelected ? 'bg-foreground text-background' : 'bg-surface-secondary text-text-secondary'}`}>
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
                    <Link
                      href={`/admin/properties/${p.id}/settings`}
                      className="px-3 py-1.5 text-xs font-medium border border-border bg-surface text-foreground rounded-lg hover:bg-surface-secondary transition-colors inline-block text-center min-w-[60px]"
                    >
                      設定
                    </Link>
                    <button
                      onClick={() => handleDelete(p.id, p.name)}
                      disabled={deletingId === p.id}
                      className="px-3 py-1.5 text-xs font-medium text-danger border border-danger/20 rounded-lg hover:bg-danger/5 transition-colors disabled:opacity-50"
                    >
                      削除
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
