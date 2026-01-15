# プロジェクト進捗管理

最終更新: 2026-01-17 13:00

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

### 現在作業中のフェーズ

- [ ] Phase 2: バックエンド (Supabase) の開発 ← **次回ここから開始**

  1.  **データベーススキーマの設計と実装**

  - [ ] `users` テーブルの作成
  - [ ] `accounts` テーブルの作成と `users` とのリレーション設定
  - [ ] `payment_methods` テーブルの作成と `users` とのリレーション設定 (モック決済用に必要最低限の情報を保持)
  - [ ] `transactions` テーブルの作成と `accounts` とのリレーション設定
  - [ ] `commuter_passes` テーブルの作成と `accounts` とのリレーション設定
  - [ ] `qr_tickets` テーブルの作成と `accounts` とのリレーション設定
  - [ ] 各テーブルへのインデックス設定、制約（NOT NULL, UNIQUE）の定義

  2.  **Row Level Security (RLS) の設定**

  - [ ] 各テーブルに対し、適切な RLS ポリシーを設定し、データアクセス権限を制御

### 次のフェーズ

- [ ] Phase 3: フロントエンド (React Native) の開発 - UI/UX と基本機能
- [ ] Phase 4: 決済機能の開発 **(モック実装)**

## 最新の作業内容

### 2026-01-17 セッション

**実装したもの:**

- progress.md の初期テンプレート作成
- プロジェクト計画の整理

**発生した問題:**
なし

**CodeRabbit CLI の指摘:**
まだコード未作成のため、なし

**次回やること:**

- データベーススキーマの設計と実装
- Row Level Security (RLS) の設定

## 技術的な決定事項

### 採用した技術・パターン

- フレームワーク: React Native (Expo)
- バックエンド: Supabase
- 状態管理: Context API（小規模プロジェクトのため）
- UI ライブラリ: React Native Paper
- ルーティング: Expo Router
- テスト: Jest + React Native Testing Library

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
