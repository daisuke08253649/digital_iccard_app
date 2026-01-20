# プロジェクト進捗管理

最終更新: 2026-01-20 19:00

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

- [x] Phase 3: フロントエンド (React Native) の開発 - UI/UX と基本機能
  1.  **ナビゲーションの実装**
  - [x] Expo Routerを用いた画面遷移とタブナビゲーションの実装
  - [x] 認証フローの自動ナビゲーション
  2.  **認証 UI/UX の実装**
  - [x] ログイン、サインアップ画面の作成とSupabase Authenticationとの連携
  - [x] 認証コンテキスト（AuthContext）の実装
  3.  **メイン画面の UI/UX 実装**
  - [x] 残高表示コンポーネントの実装とSupabaseからのデータフェッチ
  - [x] 定期券情報表示コンポーネントの実装とデータフェッチ
  - [x] QRコード切符表示コンポーネントの実装と表示条件のロジック
  4.  **利用履歴機能の実装**
  - [x] 利用履歴一覧画面の作成
  - [x] Supabaseからのトランザクションデータフェッチと表示
  5.  **設定画面の基本実装**
  - [x] ユーザー情報表示、ログアウト機能

- [x] Phase 4: 決済機能の開発 **(モック実装)**
  1.  **支払い方法管理機能の実装 (モック)**
  - [x] 支払い方法の追加・削除 UI
  - [x] Supabaseの`payment_methods`テーブルに仮想の支払い方法情報を保存
  2.  **チャージ機能の実装 (モック)**
  - [x] チャージ金額入力 UI
  - [x] 内部的に残高を増加させるモックロジックを実装
  - [x] Supabase `accounts` テーブルの残高更新ロジック
  - [x] `transactions` テーブルへのチャージ履歴記録

- [x] Phase 5: 定期券・QR コード切符機能の開発
  1.  **定期券機能の実装**
  - [x] 定期券購入画面（区間・期間選択UI）
  - [x] 定期券サービスレイヤー（購入・キャンセル・一覧取得）
  - [x] 価格計算（1ヶ月/3ヶ月/6ヶ月、割引適用）
  2.  **QRコード切符機能の実装**
  - [x] QRチケット発券画面（区間選択UI）
  - [x] QRチケットサービスレイヤー（発券・使用・キャンセル）
  - [x] QRコード表示（react-native-qrcode-svg）
  3.  **ホーム画面の拡張**
  - [x] クイックアクションボタン（定期券購入・QRチケット発券へのナビゲーション）
  - [x] 定期券・QRチケット情報の表示

### 現在作業中のフェーズ

なし（Phase 5まで完了）

### 次のフェーズ

- [ ] Phase 6: テストとデバッグ、学習/検証

## 最新の作業内容

### 2026-01-20 セッション（Phase 5 完了）

**実装したもの:**

- 定期券サービスレイヤー（src/services/commuterPassService.ts）
  - purchaseCommuterPass: 定期券購入（残高減算、トランザクション記録）
  - cancelCommuterPass: 定期券キャンセル（払い戻し、所有権検証付き）
  - getCommuterPasses: 定期券一覧取得
  - calculatePassPrice: 価格計算（1ヶ月/3ヶ月/6ヶ月、割引適用）
  - SAMPLE_STATIONS: デモ用駅一覧
  - DURATION_LABELS: 期間表示ラベル
- QRチケットサービスレイヤー（src/services/qrTicketService.ts）
  - issueQRTicket: QRチケット発券（運賃計算、残高減算）
  - useQRTicket: チケット使用処理（更新件数検証付き）
  - cancelQRTicket: チケットキャンセル（払い戻し、所有権検証付き）
  - getQRTickets: チケット一覧取得
  - generateQRCodeData: QRコード用データ生成
  - calculateFare: 運賃計算（決定論的ハッシュベース）
- 定期券購入画面（src/app/commuter-pass.tsx）
  - 駅選択（Picker）
  - 期間選択（RadioButton）
  - 価格確認・購入フロー
- QRチケット発券画面（src/app/qr-ticket.tsx）
  - 駅選択（Picker）
  - 運賃表示・発券フロー
- ホーム画面の拡張（src/app/(tabs)/index.tsx）
  - クイックアクションボタン（定期券購入、QRチケット発券）
  - 定期券情報表示
  - QRチケットのQRコード表示（react-native-qrcode-svg）

**追加した依存関係:**

- `@react-native-picker/picker`: 駅選択用Picker
- `react-native-qrcode-svg`: QRコード表示

**ブランチ戦略:**

- `feature/commuter-pass-qr`ブランチを`develop`から作成
- PR #3 作成: https://github.com/daisuke08253649/digital_iccard_app/pull/3
- CodeRabbitレビュー対応後、developにマージ完了

**CodeRabbitの指摘と対応（計7件）:**

| 回 | 指摘数 | 主な内容 |
|----|--------|----------|
| 1回目 | 3件 | calculateFare決定論化、useQRTicket更新件数検証、ロールバックエラーログ追加 |
| 2回目 | 3件 | レースコンディション警告（モックでは許容）、cancelCommuterPass払い戻し追加、cancelQRTicketフォールバックエラー処理 |
| 3回目 | 1件 | cancelCommuterPass/cancelQRTicketに所有権検証追加（セキュリティ修正） |

**次回やること:**

1. Phase 6（テストとデバッグ）の検討
2. NFC機能の実験的実装（オプション）

---

### 2026-01-20 セッション（Phase 4 完了）

**実装したもの:**

- 支払い方法サービスレイヤー（src/services/paymentMethodService.ts）
  - getPaymentMethods: 支払い方法一覧取得
  - getDefaultPaymentMethod: デフォルト支払い方法取得
  - addPaymentMethod: 支払い方法追加
  - deletePaymentMethod: 支払い方法削除
  - setDefaultPaymentMethod: デフォルト設定
  - getPaymentTypeDisplayName: 表示名取得ヘルパー
- チャージ機能（src/services/accountService.ts に追加）
  - executeCharge: モックチャージ実行
  - executePayment: モック支払い実行（Phase 5用に準備）
  - ChargeResult型定義
- 支払い方法管理画面（src/app/payment-methods.tsx）
  - 支払い方法一覧表示
  - モーダルによる新規追加UI
  - 削除機能（確認ダイアログ付き）
  - デフォルト設定機能
- チャージ画面の完全実装（src/app/(tabs)/charge.tsx を更新）
  - 現在の残高表示
  - 支払い方法選択・変更
  - チャージ実行（1000〜10000円の選択肢）
  - バリデーション（上限チェック含む）

**技術的な特徴:**

- 金額バリデーション
  - 1回のチャージ上限: 50,000円
  - 残高上限: 200,000円
- トランザクション記録
  - type: 'demo_charge' でデモチャージとして記録
  - 支払い時は 'demo_purchase' として記録
- useFocusEffectを使用して画面フォーカス時にデータを再取得

**ブランチ戦略:**

- `feature/payment-charge`ブランチを`develop`から作成
- PR #2 作成: https://github.com/daisuke08253649/digital_iccard_app/pull/2
- CodeRabbitレビュー対応後、developにマージ完了

**CodeRabbitの指摘と対応（計14件）:**

| 回 | 指摘数 | 主な内容 |
|----|--------|----------|
| 1回目 | 5件 | .coderabbit.yaml設定修正、ローディング解除、エラーハンドリング追加 |
| 2回目 | 4件 | try/finally追加（例外時のフラグ解除保証） |
| 3回目 | 2件 | エラーメッセージ改善（成功時警告表示、ログイン/入力必須分離） |
| 4回目 | 3件 | ログアウト後の情報クリア、nullチェック強化 |

**コミット履歴:**

- `38b89f0` feat: Phase 4 - 決済機能のモック実装
- `75cf9f2` docs: Phase 4完了をprogress.mdに記録
- `21cca03` fix: CodeRabbit設定を修正
- `56f8112` fix: CodeRabbitの指摘に対応
- `ac2eb04` fix: 非同期処理の例外時にフラグが解除されない問題を修正
- `2611602` fix: CodeRabbitの指摘に対応（エラーメッセージ改善）
- `b9f44d3` fix: ログアウト後の情報露出とnullチェックを修正

**次回やること:**

1. Phase 5: 定期券・QRコード切符機能の開発開始
   - 定期券の発行・管理機能
   - QRコード切符の発券・利用機能
   - NFC機能の実験的実装（オプション）

---

### 2026-01-17 セッション（Phase 3 完了 + CodeRabbit対応完了）

**実装したもの:**

- プロジェクト構造のセットアップ（src/components, hooks, services, contexts, types, utils, constants）
- TypeScript型定義ファイル（src/types/database.ts）
- 認証コンテキスト（src/contexts/AuthContext.tsx）
- ルートレイアウト（src/app/\_layout.tsx）による認証フローの自動ナビゲーション
- ログイン画面（src/app/login.tsx）
- サインアップ画面（src/app/signup.tsx）
- タブナビゲーション（src/app/(tabs)/\_layout.tsx）
- ホーム画面（src/app/(tabs)/index.tsx）
- 利用履歴画面（src/app/(tabs)/history.tsx）
- チャージ画面（src/app/(tabs)/charge.tsx - Phase 4実装予定の表示）
- 設定画面（src/app/(tabs)/settings.tsx）
- Supabaseサービスレイヤー（src/services/accountService.ts）
- 新規ユーザー登録時のアカウント自動作成トリガー

**発生した問題と解決方法:**

1. **TypeScriptコンパイルエラー**
   - `./src/app`モジュールが見つからない → index.tsを削除（Expo Routerが自動処理）
   - `@expo/vector-icons`が見つからない → 明示的にインストール

2. **認証ルーティングの無限ループバグ**
   - `segments[0] === '(auth)'`が存在しないグループを参照 → `segments[0] === 'login' || segments[0] === 'signup'`に修正

3. **@types/react-nativeの非推奨問題**
   - React Native 0.81には型定義が組み込み済み → `npm uninstall @types/react-native`で削除

4. **Alert APIの誤用**
   - グローバル`alert()`はWeb API → React Native標準の`Alert.alert()`に変更

5. **setTimeoutのメモリリーク**
   - アンマウント後もタイマーが発火 → `useRef`と`useEffect`クリーンアップで管理

6. **getSession()のエラーハンドリング欠如**
   - エラー時に`setLoading(false)`が実行されない → `.catch()`と`.finally()`を追加

7. **カード番号生成の精度問題**
   - `RANDOM()`の浮動小数点精度喪失 → 4桁ずつ生成して連結、重複チェック付きループ実装

**ブランチ戦略:**

- `develop`ブランチを`main`から作成
- `feature/phase3-ui-ux`ブランチを`develop`から作成
- PR作成: https://github.com/daisuke08253649/digital_iccard_app/pull/1
- CodeRabbit指摘対応後、プッシュ完了

**CodeRabbitの指摘と対応状況:**

✅ **7件の重大な指摘をすべて対応完了**

1. 認証ルーティングの無限ループバグ → 修正完了
2. @types/react-nativeの削除 → 削除完了
3. Alert APIの修正 → 修正完了
4. setTimeoutクリーンアップ → 実装完了
5. getSession()エラーハンドリング → 追加完了
6. カード番号生成の精度問題 → 修正完了
7. 未使用インポート削除 → 削除完了

**コミット履歴:**

- `96ea1c8` feat: Phase 3 UI/UX実装
- `267c78f` fix: TypeScriptエラーの修正
- `c84eac8` docs: Phase 3完了をprogress.mdに記録
- `c0b884e` fix: CodeRabbitの指摘に対応

**次回やること:**

1. Phase 4: 決済機能の開発（モック実装）開始
   - チャージ機能のモック実装
   - 残高更新ロジック
   - トランザクション記録

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

- 現在のブランチ: `develop`
- `main`ブランチ: 安定版（Phase 2まで完了）
- `develop`ブランチ: 開発用メインブランチ（Phase 5まで完了）
- `feature/payment-charge`: Phase 4実装ブランチ（マージ済み）
- `feature/commuter-pass-qr`: Phase 5実装ブランチ（マージ済み）

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
