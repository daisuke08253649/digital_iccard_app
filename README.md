# Digital IC Card App

Expo、Supabase（ローカル）、TypeScriptを使用したモバイルアプリケーション。

## 必要な環境

- Node.js (v22.12.0以上)
- npm (v10.9.0以上)
- Supabase CLI
- Docker Desktop (Supabase ローカル環境用)

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. ローカルSupabaseの起動

```bash
npm run supabase:start
```

初回起動時はDockerイメージのダウンロードに時間がかかります。
起動後、以下の情報が表示されます：

- API URL: http://127.0.0.1:54321
- Studio URL: http://127.0.0.1:54323
- DB URL: postgresql://postgres:postgres@127.0.0.1:54322/postgres

### 3. 環境変数の確認

`.env`ファイルにローカルSupabaseの接続情報が設定されています：

```
EXPO_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
```

## 開発

### アプリの起動

```bash
npm start
```

起動後、以下のオプションから選択できます：

- `a` - Androidエミュレーターで起動
- `i` - iOSシミュレーターで起動（macOSのみ）
- `w` - Webブラウザで起動

### Supabaseコマンド

```bash
# ローカルSupabaseの起動
npm run supabase:start

# ローカルSupabaseの停止
npm run supabase:stop

# ローカルSupabaseの状態確認
npm run supabase:status
```

### Supabase Studio

ローカルSupabaseが起動している間、以下のURLでSupabase Studioにアクセスできます：

http://127.0.0.1:54323

ここでデータベースのテーブル作成、データの閲覧・編集、認証の設定などができます。

## プロジェクト構成

```
digital_iccard_app/
├── App.tsx                 # メインアプリケーションファイル
├── lib/
│   └── supabase.ts        # Supabaseクライアント設定
├── supabase/
│   ├── config.toml        # Supabaseローカル設定
│   └── migrations/        # データベースマイグレーション
├── .env                   # 環境変数（gitignore対象）
├── .env.example           # 環境変数のサンプル
└── package.json
```

## 技術スタック

- **Expo** - React Nativeフレームワーク
- **TypeScript** - 型安全な開発
- **Supabase** - バックエンド（認証、データベース、ストレージ）
- **React Native** - モバイルアプリケーション開発
