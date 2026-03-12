# Smart Check-in v2

宿泊施設向けのセルフチェックインシステム。ゲストが事前に宿泊者情報を登録し、当日はシークレットコード + パスワード認証でセルフチェックインを完結させる非対面チェックインプラットフォーム。管理者はビデオ通話で本人確認を行い、複数物件の一元管理が可能。

---

## 目次

1. [システム概要](#システム概要)
2. [チェックインフロー](#チェックインフロー)
3. [技術スタック](#技術スタック)
4. [ディレクトリ構造](#ディレクトリ構造)
5. [データベース設計](#データベース設計)
6. [API 設計](#api-設計)
7. [セキュリティ対策](#セキュリティ対策)
8. [環境変数一覧](#環境変数一覧)
9. [ローカル開発](#ローカル開発)
10. [Supabase セットアップ](#supabase-セットアップ)
11. [Vercel デプロイ](#vercel-デプロイ)
12. [外部サービス設定](#外部サービス設定)
13. [多言語対応](#多言語対応)
14. [トラブルシューティング](#トラブルシューティング)

---

## システム概要

### 解決する課題

- 宿泊施設のフロント人件費・夜間対応の削減
- 宿泊者名簿のデジタル化・クラウド保管
- 非対面でも本人確認を完結（ビデオ通話）
- 複数拠点を 1 つの管理画面で一元管理

### 主な機能

| 機能 | 説明 |
|------|------|
| **事前登録** | ゲストが宿泊情報・パスポート情報を事前入力 |
| **セルフチェックイン** | シークレットコード + パスワード認証 |
| **ビデオ通話本人確認** | Whereby を使った非対面本人確認（別タブ起動） |
| **管理ダッシュボード** | 予約一覧・宿泊者情報・本人確認・清掃確認・備考メモ |
| **複数物件管理** | 1 つのシステムで複数の宿を管理・切り替え |
| **チェックイン通知** | ゲスト到着時に Gmail・LINE に即時通知 |
| **Google Calendar 連携** | 予約自動登録・削除 |
| **CSV エクスポート** | 宿泊者名簿の一括出力 |
| **多言語対応** | 日本語 / English / 中文 / 한국어 |

---

## チェックインフロー

```
【管理者】予約作成（/admin/dashboard）
    │
    ├─ シークレットコード自動生成（例: 9XB-D58-ALF）
    ├─ ドア解錠 PIN 設定
    ├─ Whereby ビデオ通話ルーム自動作成
    ├─ Google Calendar にイベント登録
    └─ 物件への紐付け
         │
         ▼
【管理者 → ゲスト】案内メール送信
    │  件名：ご予約確認とセルフチェックイン手順
    │  内容：事前登録 URL + シークレットコード
         │
         ▼
【ゲスト】事前登録（/register/:id）
    │
    ├─ 宿泊者情報入力
    │   氏名・ふりがな・住所・連絡先・職業・性別
    ├─ 外国人の場合：国籍・パスポート番号・パスポート画像アップロード
    └─ チェックイン用パスワード設定
         │
         ▼
【チェックイン当日】（/checkin）
    │
    ├─ シークレットコード入力
    ├─ パスワード認証（bcrypt 検証）
    └─ ビデオ通話本人確認画面へ
         │
         ├─ 「本人確認ビデオ通話を開始する」ボタン → Whereby が別タブで起動
         ├─ 【通知】管理者に Gmail + LINE で即時通知
         │
         ▼
【管理者】ダッシュボードでビデオ通話に応答
    │  ゲストの顔・パスポートを確認
    └─ 「本人確認完了」ボタンをクリック
         │
         ▼
【ゲスト】ドア解錠 PIN が表示される → 入室完了
```

---

## 技術スタック

| レイヤー | 技術 | バージョン |
|---------|------|-----------|
| **フレームワーク** | Next.js (App Router) | 16.x |
| **言語** | TypeScript | 5.x |
| **スタイリング** | Tailwind CSS | 4.x |
| **データベース** | Supabase (PostgreSQL) | 最新 |
| **認証** | Cookie ベース（HMAC-SHA256 署名付きセッション）| — |
| **バリデーション** | Zod | 4.x |
| **パスワードハッシュ** | bcryptjs | 3.x |
| **ビデオ通話** | Whereby Meetings API | — |
| **メール通知** | nodemailer (Gmail SMTP) | 8.x |
| **LINE 通知** | LINE Messaging API | — |
| **カレンダー** | Google Calendar API（Service Account）| — |
| **ファイルストレージ** | Supabase Storage | — |
| **デプロイ** | Vercel | — |
| **ランタイム** | Edge Runtime（middleware）+ Node.js（API Routes）| — |

---

## ディレクトリ構造

```
smart-checkin-v2/
├── src/
│   ├── app/
│   │   ├── admin/
│   │   │   ├── (authenticated)/          # 認証必須ページ（Sidebar レイアウト）
│   │   │   │   ├── dashboard/            # 予約ダッシュボード
│   │   │   │   ├── archive/              # アーカイブ済み予約
│   │   │   │   ├── calendar/             # カレンダービュー
│   │   │   │   ├── properties/           # 物件管理（追加・編集・削除）
│   │   │   │   ├── components/
│   │   │   │   │   ├── ReservationList.tsx   # 予約カード（左：宿泊者情報 / 右：操作）
│   │   │   │   │   └── CreateReservationForm.tsx
│   │   │   │   └── layout.tsx            # サイドバー + 物件セレクタードロップダウン
│   │   │   └── login/                    # 管理者ログイン（サイドバーなし）
│   │   │
│   │   ├── checkin/                      # ゲスト向けチェックイン
│   │   │   ├── [id]/                     # 予約 ID によるチェックイン
│   │   │   └── components/
│   │   │       ├── CredentialAuth.tsx    # パスワード認証
│   │   │       └── VideoCallVerification.tsx  # ビデオ通話（別タブで Whereby 起動）
│   │   │
│   │   ├── register/
│   │   │   └── [id]/                     # ゲスト事前登録
│   │   │       ├── components/
│   │   │       │   ├── GuestInfoForm.tsx # 宿泊者情報入力フォーム
│   │   │       │   └── PasswordSetup.tsx # パスワード設定
│   │   │       └── password/
│   │   │
│   │   └── api/
│   │       ├── admin/
│   │       │   ├── login/                # POST: 管理者ログイン（レート制限 + HMAC セッション）
│   │       │   └── logout/               # POST: ログアウト
│   │       ├── checkin/
│   │       │   ├── authenticate/         # POST: シークレットコード認証 + 通知送信
│   │       │   └── route.ts              # POST: 本人確認完了（管理者用）
│   │       ├── properties/
│   │       │   ├── route.ts              # GET / POST
│   │       │   └── [id]/route.ts         # PATCH / DELETE
│   │       ├── reservations/
│   │       │   ├── route.ts              # GET / POST / PATCH / DELETE
│   │       │   ├── checkin/              # POST: チェックイン処理（レート制限あり）
│   │       │   ├── export/               # GET: CSV エクスポート（管理者のみ）
│   │       │   └── [id]/
│   │       │       ├── route.ts          # GET（管理者）/ PATCH: 宿泊者情報更新
│   │       │       ├── meta/             # PATCH: 備考・清掃確認（管理者のみ）
│   │       │       ├── password/         # POST: パスワード設定
│   │       │       └── status/           # GET: チェックイン状態（ポーリング用）
│   │       ├── upload/passport/          # POST: パスポート画像アップロード
│   │       └── cron/cleanup-challenges/  # GET: 期限切れチャレンジ削除
│   │
│   ├── lib/
│   │   ├── auth/
│   │   │   └── session.ts                # HMAC-SHA256 セッショントークン（Web Crypto API / Edge 対応）
│   │   ├── context/
│   │   │   └── property.tsx              # 選択中の物件を管理する React Context（localStorage 永続化）
│   │   ├── notifications/
│   │   │   ├── gmail.ts                  # Gmail 通知（nodemailer + App Password）
│   │   │   ├── line.ts                   # LINE Messaging API Push 通知
│   │   │   └── index.ts                  # 並列通知ディスパッチャー（Promise.allSettled）
│   │   ├── rate-limit.ts                 # インメモリレート制限（IP ごと・期限付き）
│   │   ├── supabase/
│   │   │   ├── admin.ts                  # Service Role クライアント（RLS バイパス）
│   │   │   ├── server.ts                 # Server-side クライアント
│   │   │   ├── client.ts                 # Client-side クライアント
│   │   │   └── types.ts                  # DB 型定義（Property / Reservation / etc.）
│   │   ├── google-calendar/client.ts     # Google Calendar API（イベント作成・削除）
│   │   ├── i18n/                         # 多言語対応（ja / en / zh / ko）
│   │   └── utils/secret-code.ts          # シークレットコード生成（XXX-XXX-XXX 形式）
│   │
│   └── middleware.ts                      # 認証ガード + CSRF 保護（Edge Runtime）
│
├── next.config.ts                         # セキュリティヘッダー設定
├── package.json
└── README.md
```

---

## データベース設計

### テーブル一覧

#### `properties`（物件）

| カラム | 型 | 説明 |
|--------|-----|------|
| `id` | UUID | 主キー |
| `name` | TEXT | 宿名（必須）|
| `address` | TEXT | 住所 |
| `description` | TEXT | 説明文 |
| `check_in_time` | TEXT | CI 時刻（例: "15:00"）|
| `check_out_time` | TEXT | CO 時刻（例: "11:00"）|
| `wifi_ssid` | TEXT | Wi-Fi SSID |
| `wifi_password` | TEXT | Wi-Fi パスワード |
| `notes` | TEXT | 内部メモ |
| `created_at` | TIMESTAMPTZ | 作成日時 |
| `updated_at` | TIMESTAMPTZ | 更新日時 |

#### `reservations`（予約）

| カラム | 型 | 説明 |
|--------|-----|------|
| `id` | UUID | 主キー |
| `property_id` | UUID | 物件 ID（FK）|
| `secret_code` | TEXT UNIQUE | シークレットコード（自動生成）|
| `door_pin` | TEXT | ドア解錠 PIN |
| `check_in_date` | DATE | チェックイン日 |
| `check_out_date` | DATE | チェックアウト日 |
| `stay_type` | TEXT | 宿泊 / デイユース |
| `is_checked_in` | BOOLEAN | 本人確認完了フラグ |
| `is_archived` | BOOLEAN | アーカイブフラグ |
| `guest_name` | TEXT | 氏名 |
| `guest_name_kana` | TEXT | ふりがな |
| `guest_address` | TEXT | 住所 |
| `guest_contact` | TEXT | 連絡先 |
| `guest_occupation` | TEXT | 職業 |
| `guest_gender` | TEXT | 性別 |
| `is_foreign_national` | BOOLEAN | 外国人フラグ |
| `nationality` | TEXT | 国籍 |
| `passport_number` | TEXT | パスポート番号 |
| `passport_image_url` | TEXT | パスポート画像 URL |
| `password_hash` | TEXT | パスワードハッシュ（bcrypt）|
| `whereby_room_url` | TEXT | ゲスト用ビデオ通話 URL |
| `whereby_host_room_url` | TEXT | ホスト用ビデオ通話 URL |
| `google_calendar_event_id` | TEXT | Google Calendar イベント ID |
| `notes` | TEXT | 管理者備考メモ |
| `cleaning_confirmed` | BOOLEAN | 清掃確認フラグ |
| `created_at` | TIMESTAMPTZ | 作成日時 |

#### `challenges`（WebAuthn チャレンジ）

| カラム | 型 | 説明 |
|--------|-----|------|
| `id` | UUID | 主キー |
| `challenge` | TEXT | チャレンジ文字列 |
| `expires_at` | TIMESTAMPTZ | 有効期限（5 分）|

---

## API 設計

### 認証

| エンドポイント | メソッド | 認証 | 説明 |
|--------------|---------|------|------|
| `/api/admin/login` | POST | 不要 | 管理者ログイン（IP レート制限: 15 分 / 10 回）|
| `/api/admin/logout` | POST | 不要 | ログアウト（Cookie 削除）|

### 物件管理（管理者セッション必須）

| エンドポイント | メソッド | 説明 |
|--------------|---------|------|
| `/api/properties` | GET | 物件一覧取得 |
| `/api/properties` | POST | 物件作成 |
| `/api/properties/:id` | PATCH | 物件情報更新 |
| `/api/properties/:id` | DELETE | 物件削除 |

### 予約管理（管理者セッション必須）

| エンドポイント | メソッド | クエリパラメータ | 説明 |
|--------------|---------|----------------|------|
| `/api/reservations` | GET | `?property_id=`, `?archived=true` | 予約一覧（物件・アーカイブでフィルタ）|
| `/api/reservations` | POST | — | 予約作成（Whereby ルーム + Google Calendar 自動生成）|
| `/api/reservations` | PATCH | — | 一括アーカイブ / アンアーカイブ |
| `/api/reservations` | DELETE | — | 一括削除（Google Calendar イベントも削除）|
| `/api/reservations/:id` | GET | — | 予約詳細（管理者セッション必須）|
| `/api/reservations/:id` | PATCH | — | 宿泊者情報更新 |
| `/api/reservations/:id/meta` | PATCH | — | 備考・清掃確認更新 |
| `/api/reservations/export` | GET | `?ids=` | CSV エクスポート（管理者のみ）|

### ゲスト向け（認証不要）

| エンドポイント | メソッド | 説明 |
|--------------|---------|------|
| `/api/reservations/:id/password` | POST | パスワード設定（bcrypt ハッシュ化）|
| `/api/reservations/:id/status` | GET | チェックイン状態確認（3 秒ポーリング用）|
| `/api/reservations/checkin` | POST | シークレットコード検証 + チェックイン（レート制限あり）|
| `/api/checkin/authenticate` | POST | 認証 + 管理者への Gmail / LINE 通知送信 |
| `/api/upload/passport` | POST | パスポート画像 Supabase Storage へアップロード |

### バッチ（`CRON_SECRET` 必須）

| エンドポイント | メソッド | 説明 |
|--------------|---------|------|
| `/api/cron/cleanup-challenges` | GET | 期限切れ WebAuthn チャレンジ削除 |

---

## セキュリティ対策

### 1. 認証・セッション

**HMAC-SHA256 署名付きセッショントークン**

- Cookie 値は `{64文字乱数}.{HMAC署名}` の形式
- `SESSION_SECRET` 環境変数で署名。本番環境で未設定なら起動エラー
- 単純な文字列 Cookie による Cookie 偽装を防止（従来の `"authenticated"` 固定値から変更）
- Web Crypto API 使用により Edge Runtime（middleware）でも動作

**セッション Cookie 設定**

```
httpOnly: true       → JavaScript からアクセス不可
sameSite: strict     → クロスサイトリクエストを遮断
secure: true         → 本番環境では HTTPS のみ送信
maxAge: 28800        → 有効期限 8 時間
```

### 2. レート制限

インメモリレート制限（IP アドレス単位）：

| エンドポイント | 制限 | ウィンドウ |
|--------------|------|-----------|
| `POST /api/admin/login` | 10 回 | 15 分 |
| `POST /api/checkin/authenticate` | 20 回 | 10 分 |
| `POST /api/reservations/checkin` | 15 回 | 10 分 |

### 3. CSRF 保護

Middleware（`src/middleware.ts`）で全 `POST / PATCH / PUT / DELETE` リクエストの `Origin` ヘッダーを検証。`ALLOWED_ORIGINS` 環境変数で許可ドメインを明示的に制限。

### 4. HTTP セキュリティヘッダー

`next.config.ts` で全ページに適用：

```
X-Frame-Options: DENY                           → クリックジャッキング防止
X-Content-Type-Options: nosniff                 → MIME スニッフィング防止
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=()    → カメラ・マイク禁止
```

`/checkin/*` ページのみ：

```
Permissions-Policy: camera=*, microphone=*      → Whereby 通話用に許可
```

### 5. 入力バリデーション

全 API エンドポイントで **Zod** によるスキーマバリデーション。型の不一致・必須項目漏れを API レベルで排除。SQL インジェクション対策は Supabase クライアント（プリペアドステートメント）が担保。

### 6. パスワードセキュリティ

ゲストのパスワードは **bcrypt（salt rounds: 10）** でハッシュ化して保存。平文パスワードはどこにも保存しない。

### 7. 認証情報のデフォルト排除

`ADMIN_USERNAME` / `ADMIN_PASSWORD` が環境変数に未設定の場合、ログイン API は 500 を返す。`"admin123"` 等のフォールバック認証情報なし。

### 8. Cron エンドポイント保護

`CRON_SECRET` 未設定の場合、Cron API は 500 を返す（無認証アクセスを許可しない）。

---

## 環境変数一覧

`.env.local`（ローカル）または Vercel の環境変数に設定：

```env
# ── Supabase ──────────────────────────────────────────────
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...
SUPABASE_SERVICE_ROLE_KEY=sb_secret_...

# ── 管理者認証 ─────────────────────────────────────────────
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your-strong-password   # 必ず強力なパスワードを設定

# ── セッション署名（32 バイト以上のランダム文字列）──────────
# 生成例: node -e "require('crypto').randomBytes(32).toString('hex')|console.log"
SESSION_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# ── CSRF 保護 ──────────────────────────────────────────────
# 本番ではデプロイ先ドメインを設定（カンマ区切りで複数指定可）
ALLOWED_ORIGINS=https://your-domain.vercel.app

# ── WebAuthn ───────────────────────────────────────────────
NEXT_PUBLIC_RP_NAME=Smart Check-in
NEXT_PUBLIC_RP_ID=your-domain.com        # 本番: ドメイン名のみ（https:// なし）
NEXT_PUBLIC_ORIGIN=https://your-domain.vercel.app

# ── Whereby ────────────────────────────────────────────────
WHEREBY_API_KEY=eyJhbGciOiJIUzI1NiIs...

# ── Google Calendar ────────────────────────────────────────
GOOGLE_SERVICE_ACCOUNT_EMAIL=xxx@xxx-project.iam.gserviceaccount.com
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_CALENDAR_ID=your-calendar@gmail.com

# ── 通知（Gmail）──────────────────────────────────────────
# Google アカウントのアプリパスワードを使用（2 段階認証が必要）
GMAIL_USER=your@gmail.com
GMAIL_APP_PASSWORD=xxxx-xxxx-xxxx-xxxx   # 16 文字のアプリパスワード
NOTIFICATION_EMAIL=your@gmail.com        # 通知の送信先（管理者メール）

# ── 通知（LINE Messaging API）─────────────────────────────
LINE_CHANNEL_ACCESS_TOKEN=your-long-lived-channel-access-token
LINE_USER_ID=Uxxxxxxxxxxxxxxxxxxxxxxxxxxxx   # 管理者の LINE User ID

# ── Cron ───────────────────────────────────────────────────
CRON_SECRET=your-random-cron-secret

# ── 環境 ───────────────────────────────────────────────────
NODE_ENV=production
```

---

## ローカル開発

### 必要な環境

- Node.js 20 以上
- npm

### セットアップ

```bash
# 1. クローン
git clone https://github.com/KaitoS828/smart-checkin-v2.git
cd smart-checkin-v2

# 2. 依存パッケージのインストール
npm install

# 3. 環境変数ファイルを作成・編集
cp .env.example .env.local   # または手動で .env.local を作成

# 4. 開発サーバー起動
npm run dev
```

→ http://localhost:3000 で起動

### 主要コマンド

```bash
npm run dev         # 開発サーバー起動（webpack モード）
npm run build       # 本番ビルド
npm run lint        # ESLint チェック
npx tsc --noEmit    # TypeScript 型チェック
```

---

## Supabase セットアップ

### 1. プロジェクト作成

[supabase.com](https://supabase.com) でプロジェクトを作成し、以下を取得：
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

### 2. テーブル作成

Supabase ダッシュボード → **SQL Editor** で以下を実行：

```sql
-- 物件テーブル
CREATE TABLE properties (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name             TEXT NOT NULL,
  address          TEXT,
  description      TEXT,
  check_in_time    TEXT DEFAULT '15:00',
  check_out_time   TEXT DEFAULT '11:00',
  wifi_ssid        TEXT,
  wifi_password    TEXT,
  notes            TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- 予約テーブル
CREATE TABLE reservations (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id              UUID REFERENCES properties(id) ON DELETE SET NULL,
  secret_code              TEXT NOT NULL UNIQUE,
  door_pin                 TEXT NOT NULL,
  check_in_date            DATE,
  check_out_date           DATE,
  check_in_time            TIMESTAMPTZ,
  stay_type                TEXT DEFAULT '宿泊',
  is_checked_in            BOOLEAN DEFAULT FALSE,
  is_archived              BOOLEAN DEFAULT FALSE,
  guest_name               TEXT,
  guest_name_kana          TEXT,
  guest_address            TEXT,
  guest_contact            TEXT,
  guest_occupation         TEXT,
  guest_gender             TEXT,
  is_foreign_national      BOOLEAN DEFAULT FALSE,
  nationality              TEXT,
  passport_number          TEXT,
  passport_image_url       TEXT,
  password_hash            TEXT,
  whereby_room_url         TEXT,
  whereby_host_room_url    TEXT,
  google_calendar_event_id TEXT,
  notes                    TEXT,
  cleaning_confirmed       BOOLEAN NOT NULL DEFAULT FALSE,
  created_at               TIMESTAMPTZ DEFAULT NOW(),
  updated_at               TIMESTAMPTZ DEFAULT NOW()
);

-- WebAuthn チャレンジ
CREATE TABLE challenges (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge   TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  expires_at  TIMESTAMPTZ NOT NULL
);
```

### 3. Storage バケット作成

Supabase ダッシュボード → **Storage** → New bucket

- バケット名: `passport-images`
- Public: **OFF**（非公開）

---

## Vercel デプロイ

### 1. GitHub リポジトリを Vercel に接続

[vercel.com](https://vercel.com) → Add New Project → GitHub リポジトリを選択

### 2. 環境変数を設定

Vercel ダッシュボード → Settings → **Environment Variables** に `.env.local` の内容をすべて追加。

> **本番環境で必ず変更が必要な変数**
>
> ```
> NEXT_PUBLIC_RP_ID     → デプロイ先ドメイン（例: your-app.vercel.app）
> NEXT_PUBLIC_ORIGIN    → https://your-app.vercel.app
> ALLOWED_ORIGINS       → https://your-app.vercel.app
> NODE_ENV              → production
> ```

### 3. Cron Job 設定（オプション）

`vercel.json` に以下を追加することで WebAuthn チャレンジの定期削除を自動化：

```json
{
  "crons": [
    {
      "path": "/api/cron/cleanup-challenges",
      "schedule": "*/10 * * * *"
    }
  ]
}
```

### 4. デプロイ

main ブランチへの push で自動デプロイ。

---

## 外部サービス設定

### Whereby（ビデオ通話）

1. [whereby.com/business](https://whereby.com/business) でアカウント作成
2. API キーを発行 → `WHEREBY_API_KEY` に設定
3. 予約作成時に自動でビデオルームが生成される

### Gmail 通知（アプリパスワード）

1. Google アカウント → **セキュリティ** → 2 段階認証をオン
2. **アプリパスワード** を生成
   - Google アカウント → セキュリティ → アプリパスワード
   - アプリ名: `Smart Check-in`（任意）
3. 生成された **16 文字のパスワード**を `GMAIL_APP_PASSWORD` に設定

### LINE 通知（LINE Messaging API）

1. [LINE Developers](https://developers.line.biz) にログイン
2. プロバイダーを作成 → **Messaging API チャンネル** を作成
3. チャンネル設定 → **チャンネルアクセストークン（長期）** を発行 → `LINE_CHANNEL_ACCESS_TOKEN` に設定
4. 作成したボットを LINE で **友達追加**
5. LINE Developers コンソール「**Your user ID**」を `LINE_USER_ID` に設定
6. ゲストがチェックインを開始すると管理者 LINE にプッシュ通知が届く

### Google Calendar

1. Google Cloud Console でプロジェクト作成
2. **Google Calendar API** を有効化
3. **サービスアカウント**を作成し、JSON キーをダウンロード
4. 対象カレンダーの「設定と共有」→ サービスアカウントのメールアドレスに **編集権限** を付与
5. 環境変数に設定

---

## 多言語対応

`src/lib/i18n/translations.ts` で全テキストを管理。

| コード | 言語 |
|--------|------|
| `ja` | 日本語（デフォルト）|
| `en` | English |
| `zh` | 中文（简体）|
| `ko` | 한국어 |

言語設定は Cookie に保存し、ページ全体に即時反映。ゲスト向け・管理者向け両方に対応。

---

## トラブルシューティング

### カメラが起動しない（チェックイン画面）

- 「本人確認ビデオ通話を開始する」ボタンで **別タブ**が開きます
- 別タブで開いた Whereby のページでカメラ許可を行ってください
- iframe 埋め込みではなく別タブ起動方式を採用しているのは、ブラウザのカメラ権限制限を回避するためです

### セッションが無効になる

- `SESSION_SECRET` 環境変数が設定されているか確認
- サーバー再起動後はセッションが無効になります（再ログインが必要）

### LINE 通知が届かない

- `LINE_CHANNEL_ACCESS_TOKEN` が正しいか確認
- 対象の LINE ユーザーがボットを友達追加しているか確認
- `LINE_USER_ID` が `U` から始まる正しい形式か確認（例: `Uxxxxxxxxxxxxxxxxxxxxxxxxxxxx`）

### Gmail 通知が届かない

- 2 段階認証が有効になっているか確認
- 通常のパスワードではなく **アプリパスワード**（16 文字）を使用しているか確認
- 迷惑メールフォルダを確認

### Supabase 接続エラー

- `.env.local` の URL と Key が正しいか確認
- Supabase プロジェクトが一時停止していないか確認（無料プランは非アクティブで停止）

### `CRON_SECRET` 未設定エラー

- `/api/cron/cleanup-challenges` は `CRON_SECRET` が必須
- 環境変数に設定してから再起動してください

---

## ライセンス

Private — All rights reserved.
