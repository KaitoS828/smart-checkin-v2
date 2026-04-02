import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="text-center animate-fade-in">
        <div className="text-6xl font-bold text-text-muted mb-4">404</div>
        <h1 className="text-2xl font-bold text-foreground mb-3">
          ページが見つかりません
        </h1>
        <p className="text-text-secondary mb-8">
          お探しのページは存在しないか、移動した可能性があります。
        </p>
        <Link
          href="/"
          className="px-6 py-3 rounded-lg bg-foreground text-background font-medium hover:opacity-90 transition-opacity"
        >
          トップへ戻る
        </Link>
      </div>
    </div>
  );
}
