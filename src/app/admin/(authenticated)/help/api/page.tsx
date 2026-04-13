'use client';

export default function ApiHelpPage() {
  return (
    <div className="p-8 max-w-3xl mx-auto md:ml-0 md:mr-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">API・外部連携 セットアップガイド</h1>
        <p className="text-sm text-text-secondary mt-1">Smart Check-in を導入・運用する際の各種APIセットアップ手順です。</p>
      </div>

      <div className="space-y-8">
        {/* Google Calendar */}
        <section className="bg-surface border border-border rounded-xl p-6">
          <h2 className="text-lg font-bold text-foreground mb-4 border-b border-border/50 pb-2 flex items-center gap-2">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
            Google Calendar 連携
          </h2>
          <div className="text-sm text-foreground space-y-6">
            <div>
              <h3 className="font-semibold text-text-secondary mb-2">ステップ 1: アプリの初期セットアップ（GCPでのAPIキー取得）</h3>
              <p className="mb-2 text-text-secondary">システム導入時（OSSデプロイ時）は、まず Google Cloud Console でサービスアカウントを発行し、システムに認証させる必要があります。</p>
              <ol className="list-decimal pl-5 space-y-2 text-text-secondary">
                <li><a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer" className="text-foreground underline hover:opacity-80 transition-opacity">Google Cloud Console</a> で新しいプロジェクトを作成します。</li>
                <li>「APIとサービス」&gt;「ライブラリ」から <strong>Google Calendar API</strong> を検索し、有効化します。</li>
                <li>「APIとサービス」&gt;「認証情報」から「+ 認証情報を作成」をクリックし、<strong>サービスアカウント</strong>を作成します。</li>
                <li>作成したサービスアカウントの「キー」タブへ行き、「新しいキーを追加」から <strong>JSON形式</strong> でダウンロードします。</li>
                <li>システムの <code>.env.local</code> に <code>GOOGLE_SERVICE_ACCOUNT_EMAIL</code> と <code>GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY</code> を設定し、サーバーを再起動します。</li>
              </ol>
            </div>

            <div className="border-t border-border/50 pt-4">
              <h3 className="font-semibold text-text-secondary mb-2">ステップ 2: 宿ごとのカレンダー共有設定</h3>
              <p className="mb-2 text-text-secondary">ステップ1が完了したら、システムが各宿のカレンダーにアクセスできるよう権限を付与します。</p>
              <ol className="list-decimal pl-5 space-y-2 text-text-secondary">
                <li>普段利用している Google カレンダーを開き、連携したいカレンダーの左メニューから「設定と共有」を開きます。</li>
                <li>「特定のユーザーとの共有」セクションで「ユーザーを追加」をクリックします。</li>
                <li>
                  以下のアドレス（ステップ1で作成したサービスアカウント）を追加し、権限を<strong>「予定の変更」</strong>に設定します。
                  <div className="mt-2 mb-2 p-2 bg-surface-secondary border border-border rounded font-mono text-[11px] break-all">
                    {process.env.NEXT_PUBLIC_GOOGLE_SERVICE_ACCOUNT_EMAIL || "システムのサービスアカウントアドレスが見つかりません (.env.localを確認してください)"}
                  </div>
                </li>
                <li>「カレンダーの統合」セクションにある <strong>カレンダーID</strong>（xxx@group.calendar.google.com など）をコピーします。</li>
                <li>当システムの「宿を管理」→「設定」画面から、コピーしたカレンダーIDを登録して設定完了です。</li>
              </ol>
            </div>
          </div>
        </section>

        {/* SwitchBot */}
        <section className="bg-surface border border-border rounded-xl p-6">
          <h2 className="text-lg font-bold text-foreground mb-4 border-b border-border/50 pb-2 flex items-center gap-2">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="5" y="2" width="14" height="20" rx="2" ry="2" /><path d="M12 18h.01" /></svg>
            SwitchBot スマートロック連携
          </h2>
          <div className="text-sm text-foreground space-y-3">
            <p>
              チェックイン時に自動でパスコードを発行・設定するため、SwitchBot キーパッドと連携します。
            </p>
            <ol className="list-decimal pl-5 space-y-2 text-text-secondary mt-4">
              <li>スマートフォンで SwitchBot アプリを開き、プロフィール設定から「開発者向けオプション」を有効にします。</li>
              <li>「トークン」を取得し、システムの <code>.env.local</code> に設定します。（現在はシステム全体で1つのアカウントを使用）</li>
              <li>キーパッドのデバイス設定から <strong>デバイスID</strong> (例: F76A7198EAD4) を確認します。</li>
              <li>当システムの「宿を管理」→「設定」画面にて、デバイスIDを登録します。</li>
            </ol>
          </div>
        </section>

        {/* Whereby */}
        <section className="bg-surface border border-border rounded-xl p-6">
          <h2 className="text-lg font-bold text-foreground mb-4 border-b border-border/50 pb-2 flex items-center gap-2">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15.6 11.6L22 7v10l-6.4-4.5v-1zM4 5h9a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7c0-1.1.9-2 2-2z"/></svg>
            Whereby (ビデオ通話) 連携
          </h2>
          <div className="text-sm text-foreground space-y-3">
            <p>
              本人確認のためのビデオ通話は、Whereby APIを利用して動的にルームを生成しています。<br/>
              <code>.env.local</code> の <code>WHEREBY_API_KEY</code> を使用して、システム全体で通話部屋を作成します。
            </p>
          </div>
        </section>

      </div>
    </div>
  );
}
