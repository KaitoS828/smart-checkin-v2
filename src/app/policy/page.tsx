'use client';

import Link from 'next/link';

export default function CancellationPolicyPage() {
  return (
    <div className="min-h-screen bg-background text-foreground max-w-3xl mx-auto px-6 py-16">
      <div className="mb-8">
        <Link href="/" className="text-sm text-text-secondary hover:text-foreground transition-colors flex items-center gap-2">
          &larr; ホームに戻る
        </Link>
      </div>
      
      <h1 className="text-3xl font-bold mb-8">キャンセルポリシー</h1>
      
      <div className="space-y-6 text-sm text-text-secondary leading-relaxed">
        <p>ご宿泊のキャンセルにつきましては、以下の通りキャンセル料を申し受けます。日程の変更やキャンセルの場合は、お早めにご連絡くださいますようお願いいたします。</p>
        
        <div className="overflow-hidden rounded-xl border border-border bg-surface my-6">
          <table className="w-full text-left">
            <thead className="bg-surface-secondary">
              <tr>
                <th className="px-6 py-4 font-semibold text-foreground border-b border-border">キャンセルの時期</th>
                <th className="px-6 py-4 font-semibold text-foreground border-b border-border text-right">キャンセル料</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              <tr>
                <td className="px-6 py-4">ご宿泊日の 7日前～4日前</td>
                <td className="px-6 py-4 text-right">宿泊料金の 30%</td>
              </tr>
              <tr>
                <td className="px-6 py-4">ご宿泊日の 3日前～前日</td>
                <td className="px-6 py-4 text-right">宿泊料金の 50%</td>
              </tr>
              <tr>
                <td className="px-6 py-4">当日 / 無連絡での不泊</td>
                <td className="px-6 py-4 text-right">宿泊料金の 100%</td>
              </tr>
            </tbody>
          </table>
        </div>

        <section className="mt-8">
          <h2 className="text-lg font-semibold text-foreground mb-3">特記事項</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>天災や交通機関の事故など、やむを得ない事情によるキャンセルの場合は、状況に応じて柔軟に対応させていただきます。施設まで直接ご相談ください。</li>
            <li>OTA（宿泊予約サイト）経由でご予約された場合、そのサイトのキャンセルポリシーが優先して適用される場合がございます。予約先のご案内をご確認ください。</li>
            <li>連泊でご予約の場合、初日をご連絡なく不泊とされた時点で、全日程をキャンセルとみなす場合がございます。</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
