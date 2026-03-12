'use client';

import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useI18n } from '@/lib/i18n/context';
import { LocaleSwitcher } from '@/lib/i18n/LocaleSwitcher';
import { PropertyProvider, useProperty } from '@/lib/context/property';

const NAV_ITEMS = [
  {
    href: '/admin/dashboard',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" />
        <rect x="14" y="3" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" />
      </svg>
    ),
    label: 'ダッシュボード',
    exact: true,
  },
  {
    href: '/admin/archive',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="21 8 21 21 3 21 3 8" />
        <rect x="1" y="3" width="22" height="5" />
        <line x1="10" y1="12" x2="14" y2="12" />
      </svg>
    ),
    label: 'アーカイブ',
    exact: false,
  },
  {
    href: '/admin/calendar',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
    label: 'カレンダー',
    exact: false,
  },
];

function SidebarContent() {
  const { t } = useI18n();
  const router = useRouter();
  const pathname = usePathname();
  const { properties, selectedProperty, setSelectedPropertyId, isLoading } = useProperty();

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.push('/admin/login');
  };

  const isActive = (href: string, exact: boolean) => {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  };

  return (
    <aside className="w-60 flex-shrink-0 border-r border-border bg-surface flex flex-col h-screen sticky top-0">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-border">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-foreground flex items-center justify-center">
            <span className="text-background text-sm font-bold">S</span>
          </div>
          <span className="text-sm font-semibold text-foreground group-hover:opacity-80 transition-opacity">
            Smart Check-in
          </span>
        </Link>
        <p className="text-[10px] text-text-muted mt-1 ml-10 uppercase tracking-widest font-medium">Admin</p>
      </div>

      {/* Property selector */}
      <div className="px-3 py-3 border-b border-border/50">
        {isLoading ? (
          <div className="px-3 py-2 text-xs text-text-muted animate-pulse">読み込み中…</div>
        ) : properties.length === 0 ? (
          <Link
            href="/admin/properties"
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-border text-xs text-text-muted hover:text-foreground hover:border-foreground/30 transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            宿を登録する
          </Link>
        ) : (
          <div className="space-y-1">
            <p className="text-[10px] font-semibold text-text-muted uppercase tracking-widest px-1 mb-2">管理中の宿</p>
            <select
              value={selectedProperty?.id ?? ''}
              onChange={(e) => setSelectedPropertyId(e.target.value)}
              className="w-full text-sm font-medium text-foreground bg-surface-secondary border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-foreground/20 cursor-pointer"
            >
              {properties.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.href, item.exact);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                active
                  ? 'bg-foreground text-background'
                  : 'text-text-secondary hover:text-foreground hover:bg-surface-secondary'
              }`}
            >
              <span className={active ? 'opacity-100' : 'opacity-60'}>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom actions */}
      <div className="px-3 py-4 border-t border-border space-y-1">
        {/* 宿を管理 */}
        <Link
          href="/admin/properties"
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
            isActive('/admin/properties', false)
              ? 'bg-foreground text-background'
              : 'text-text-secondary hover:text-foreground hover:bg-surface-secondary'
          }`}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
          宿を管理
        </Link>

        <div className="px-3 py-2">
          <LocaleSwitcher />
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-text-secondary hover:text-danger hover:bg-danger/5 transition-all"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          {t('admin.logout')}
        </button>
      </div>
    </aside>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <PropertyProvider>
      <div className="min-h-screen bg-background flex">
        <SidebarContent />
        <main className="flex-1 min-h-screen overflow-y-auto">
          {children}
        </main>
      </div>
    </PropertyProvider>
  );
}
