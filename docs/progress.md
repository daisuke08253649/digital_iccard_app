# プロジェクト進捗管理

最終更新: 2026-01-17 15:30

## 現在の状態

### 完了したフェーズ

- [x] Phase 0: プロジェクト計画

  - [x] CLAUDE.md 作成
  - [x] requirements.md 作成
  - [x] design_spec.md 作成
  - [x] tasks.md 作成
  - [x] progress.md 作成（このファイル）

- [x] Phase 1: 環境構築と初期セットアップ

  1.  **プロジェクトの初期化**

  - [x] Expo プロジェクトの作成 (`expo init`)
  - [x] Supabase プロジェクトの作成と初期設定
  - [x] Git リポジトリの作成と初期コミット

  2.  **基本技術スタックのセットアップ**

  - [x] React Native (Expo) 環境設定
  - [x] Supabase クライアントライブラリのインストールと設定 (`@supabase/supabase-js`)
  - [x] UI コンポーネントライブラリの選定と導入 (例: React Native Paper)

  3.  **認証機能の初期セットアップ**

  - [x] Supabase Authentication の基本設定（メール/パスワード）

- [x] Phase 2: バックエンド (Supabase) の開発

  1.  **データベーススキーマの設計と実装**

  - [x] `users` テーブルの作成
  - [x] `accounts` テーブルの作成と `users` とのリレーション設定
  - [x] `payment_methods` テーブルの作成と `users` とのリレーション設定 (モック決済用に必要最低限の情報を保持)
  - [x] `transactions` テーブルの作成と `accounts` とのリレーション設定
  - [x] `commuter_passes` テーブルの作成と `accounts` とのリレーション設定
  - [x] `qr_tickets` テーブルの作成と `accounts` とのリレーション設定
  - [x] 各テーブルへのインデックス設定、制約（NOT NULL, UNIQUE）の定義

  2.  **Row Level Security (RLS) の設定**

  - [x] 各テーブルに対し、適切な RLS ポリシーを設定し、データアクセス権限を制御

### 現在作業中のフェーズ

- [ ] Phase 3: フロントエンド (React Native) の開発 - UI/UX と基本機能 ← **次回ここから開始**

### 次のフェーズ

- [ ] Phase 4: 決済機能の開発 **(モック実装)**
- [ ] Phase 5: 定期券・QR コード切符機能の開発
- [ ] Phase 6: テストとデバッグ、学習/検証

## 最新の作業内容

### 2026-01-17 セッション（Phase 2 完了）

**実装したもの:**

- データベースマイグレーションファイルの作成（`supabase/migrations/20260117061912_create_initial_schema.sql`）
- 全6テーブルの作成（users, accounts, payment_methods, transactions, commuter_passes, qr_tickets）
- 各テーブルへの適切なインデックス設定
- 外部キー制約とチェック制約の設定
- Row Level Security (RLS) の有効化と各テーブルへのポリシー設定
- updated_at自動更新トリガーの実装
- .gitignoreへの一時ファイルパターン追加

**発生した問題:**

1. 最初のマイグレーション適用時に認証エラーが発生
   - 解決策: Supabaseを完全停止して再起動することで解決
2. Docker volumeの重複エラー
   - 解決策: `--no-backup`オプションで停止し、クリーンな状態から再起動

**CodeRabbit CLI の指摘:**
Phase 2ではSQLマイグレーションファイルのみのため、チェック対象外

**次回やること:**

- Phase 3: フロントエンド (React Native) の開発開始
- ナビゲーションの実装
- 認証 UI/UX の実装

## 技術的な決定事項

### 採用した技術・パターン

- フレームワーク: React Native (Expo)
- バックエンド: Supabase
- 状態管理: Context API（小規模プロジェクトのため）
- UI ライブラリ: React Native Paper
- ルーティング: Expo Router
- テスト: Jest + React Native Testing Library

### データベース設計の決定

- PostgreSQL 17を使用
- すべてのテーブルにUUID主キーを使用（`gen_random_uuid()`）
- updated_atカラムの自動更新にはトリガー関数を使用
- RLSポリシーで`auth.uid()`を使用してユーザー認証を実装
- 外部キー制約に`ON DELETE CASCADE`を設定し、ユーザー削除時の整合性を保証
- NUMERIC(10, 2)型で金額を管理（小数点以下2桁まで）
- CHECK制約で残高・価格が負にならないよう制御
- ステータスフィールドにはENUM的なCHECK制約を使用

## 未解決の課題

現時点ではなし

## ブランチ情報

- 現在のブランチ: `main`
- 次に作成予定: `develop`ブランチを作成し、以降は feature ブランチで作業

## 重要なファイル

### ドキュメント

- `CLAUDE.md` - Claude Code 用の開発ガイド
- `docs/requirements.md` - 要件定義
- `docs/design_spec.md` - 設計書
- `docs/tasks.md` - タスク一覧
- `docs/progress.md` - 進捗管理（このファイル）

## メモ・気づき

- このプロジェクトは学習・技術検証目的のプロトタイプ
- 実際の金銭取引は行わない（モック実装）
- CodeRabbit CLI と CodeRabbit を活用した 2 段階レビューフロー
- セッション開始時は必ずこのファイルを確認すること
