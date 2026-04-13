'use client';

import Link from 'next/link';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-background text-foreground max-w-3xl mx-auto px-6 py-16">
      <div className="mb-8">
        <Link href="/" className="text-sm text-text-secondary hover:text-foreground transition-colors flex items-center gap-2">
          &larr; ホームに戻る
        </Link>
      </div>
      
      <h1 className="text-3xl font-bold mb-8">プライバシーポリシー</h1>
      
      <div className="space-y-6 text-sm text-text-secondary leading-relaxed">
        <p>本施設は、お客様の個人情報の保護を最も重要な責務と認識し、以下の通りプライバシーポリシーを定めます。</p>
        
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-3">1. 個人情報の収集・利用</h2>
          <p>当施設は、チェックイン手続きおよび法令に基づく宿泊者名簿の作成のために、必要最小限のお客様情報（氏名、住所、連絡先等）を収集いたします。これらの情報は、宿泊管理およびお客様へのサービス提供の目的でのみ利用します。</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-3">2. 個人情報の管理と保護</h2>
          <p>収集した個人情報は、厳重に管理し、不正アクセス、紛失、破壊、改ざんおよび漏洩を防止するための適切なセキュリティ対策を講じます。データは暗号化通信（TLS）を使用して安全に送信・保存されます。</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-3">3. 第三者への開示</h2>
          <p>法令に基づく要請がある場合を除き、お客様の同意なく第三者へ個人情報を提供することはありません。</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-3">4. 個人情報の訂正・削除</h2>
          <p>お客様ご本人から個人情報の訂正、追加または削除のお申し出があった場合には、速やかに対応いたします。</p>
        </section>
        
        <p className="pt-8 text-xs text-text-muted mt-8 border-t border-border">
          制定日: 2026年4月
        </p>
      </div>
    </div>
  );
}
