export default function Loading() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center animate-fade-in">
        <div className="relative w-10 h-10 mx-auto mb-4">
          <div className="absolute inset-0 rounded-full border-2 border-border" />
          <div className="absolute inset-0 rounded-full border-2 border-foreground border-t-transparent animate-spin" />
        </div>
        <p className="text-sm text-text-secondary">読込中...</p>
      </div>
    </div>
  );
}
