'use client';

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="text-center animate-fade-in">
        <div className="text-5xl mb-6">⚠</div>
        <h1 className="text-2xl font-bold text-foreground mb-3">
          エラーが発生しました
        </h1>
        <p className="text-text-secondary mb-8">
          問題が発生しました。もう一度お試しください。
        </p>
        <button
          onClick={reset}
          className="px-6 py-3 rounded-lg bg-foreground text-background font-medium hover:opacity-90 transition-opacity"
        >
          再試行
        </button>
      </div>
    </div>
  );
}
