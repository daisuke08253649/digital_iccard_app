---
### デジタルICカードサービス データベース構成詳細

このドキュメントは、デジタルICカードサービスのバックエンドに利用するSupabase (PostgreSQL) のデータベーススキーマとそのリレーションシップを詳細に記述します。
---

### 1. テーブル定義

各テーブルは、サービスに必要なデータを効率的かつ一貫性のある方法で格納するために設計されています。

#### 1.1 `users` テーブル

- **役割:** アプリを利用する個々のユーザーの認証情報および基本個人情報を管理します。
- **カラム:**
  - `id` (UUID, PRIMARY KEY, DEFAULT gen_random_uuid()): ユーザーを一意に識別する ID。
  - `email` (TEXT, UNIQUE, NOT NULL): ユーザーのメールアドレス。認証に使用。
  - `password_hash` (TEXT): ハッシュ化されたパスワード。
  - `first_name` (TEXT, NULLABLE): ユーザーの名。
  - `last_name` (TEXT, NULLABLE): ユーザーの姓。
  - `phone_number` (TEXT, UNIQUE, NULLABLE): ユーザーの電話番号。
  - `created_at` (TIMESTAMPTZ, DEFAULT NOW()): レコード作成日時。
  - `updated_at` (TIMESTAMPTZ, DEFAULT NOW()): レコード更新日時。
- **インデックス:** `email` (UNIQUE), `phone_number` (UNIQUE)

#### 1.2 `accounts` テーブル

- **役割:** 各ユーザーに紐づくデジタル IC カードアカウントの主要情報（残高など）を管理します。
- **カラム:**
  - `id` (UUID, PRIMARY KEY, DEFAULT gen_random_uuid()): アカウントを一意に識別する ID。
  - `user_id` (UUID, UNIQUE, NOT NULL): ユーザー ID (`users.id`への外部キー)。1 対 1 の関係のため UNIQUE。
  - `balance` (NUMERIC(10, 2), DEFAULT 0.00, NOT NULL): 現在の残高。小数点以下 2 桁まで。
  - `card_number` (TEXT, UNIQUE, NOT NULL): アプリ内で表示される仮想のカード番号。
  - `status` (TEXT, DEFAULT 'active', NOT NULL): アカウントの状態 (例: 'active', 'suspended', 'locked')。
  - `created_at` (TIMESTAMPTZ, DEFAULT NOW()): レコード作成日時。
  - `updated_at` (TIMESTAMPTZ, DEFAULT NOW()): レコード更新日時。
- **インデックス:** `user_id` (UNIQUE)

#### 1.3 `transactions` テーブル

- **役割:** すべての取引（チャージ、運賃、購入など）の履歴を記録します。
- **カラム:**
  - `id` (UUID, PRIMARY KEY, DEFAULT gen_random_uuid()): 取引を一意に識別する ID。
  - `account_id` (UUID, NOT NULL): 取引を行ったアカウント ID (`accounts.id`への外部キー)。
  - `type` (TEXT, NOT NULL): 取引の種類 (例: 'charge', 'fare', 'purchase', 'commuter_pass_buy', 'demo_charge', 'demo_purchase')。
  - `amount` (NUMERIC(10, 2), NOT NULL): 取引額（チャージは正、利用は負）。
  - `description` (TEXT, NULLABLE): 取引内容の詳細（例: "コンビニでの買い物", "JR 線 乗車", "デモチャージ"）。
  - `transaction_date` (TIMESTAMPTZ, DEFAULT NOW(), NOT NULL): 取引発生日時。
  - `location` (TEXT, NULLABLE): 取引場所 (駅名、店舗名など)。
  - `created_at` (TIMESTAMPTZ, DEFAULT NOW()): レコード作成日時。
  - `updated_at` (TIMESTAMPTZ, DEFAULT NOW()): レコード更新日時。
- **インデックス:** `account_id`, `transaction_date`

#### 1.4 `commuter_passes` テーブル

- **役割:** ユーザーが保有する定期券の情報を管理します。
- **カラム:**
  - `id` (UUID, PRIMARY KEY, DEFAULT gen_random_uuid()): 定期券を一意に識別する ID。
  - `account_id` (UUID, NOT NULL): 定期券を保有するアカウント ID (`accounts.id`への外部キー)。
  - `start_station` (TEXT, NOT NULL): 定期券の開始駅。
  - `end_station` (TEXT, NOT NULL): 定期券の終了駅。
  - `route_name` (TEXT, NULLABLE): 路線名（例: "JR 山手線"）。
  - `start_date` (DATE, NOT NULL): 定期券の有効開始日。
  - `end_date` (DATE, NOT NULL): 定期券の有効終了日。
  - `price` (NUMERIC(10, 2), NOT NULL): 定期券の購入価格（モック決済）。
  - `status` (TEXT, DEFAULT 'active', NOT NULL): 定期券の状態 (例: 'active', 'expired', 'canceled')。
  - `created_at` (TIMESTAMPTZ, DEFAULT NOW()): レコード作成日時。
  - `updated_at` (TIMESTAMPTZ, DEFAULT NOW()): レコード更新日時。
- **インデックス:** `account_id`, `end_date`

#### 1.5 `qr_tickets` テーブル

- **役割:** QR コード型の切符の情報を管理します。
- **カラム:**
  - `id` (UUID, PRIMARY KEY, DEFAULT gen_random_uuid()): QR チケットを一意に識別する ID。
  - `account_id` (UUID, NOT NULL): QR チケットを発券したアカウント ID (`accounts.id`への外部キー)。
  - `ticket_code` (TEXT, UNIQUE, NOT NULL): QR コードとして使用される一意のコード。
  - `issue_date` (TIMESTAMPTZ, DEFAULT NOW(), NOT NULL): チケット発行日時。
  - `expiry_date` (TIMESTAMPTZ, NOT NULL): チケット有効期限。
  - `start_station` (TEXT, NULLABLE): 出発駅。
  - `end_station` (TEXT, NULLABLE): 到着駅。
  - `fare` (NUMERIC(10, 2), NOT NULL): チケットの運賃（モック決済）。
  - `status` (TEXT, DEFAULT 'issued', NOT NULL): チケットの状態 (例: 'issued', 'used', 'expired', 'canceled')。
  - `created_at` (TIMESTAMPTZ, DEFAULT NOW()): レコード作成日時。
  - `updated_at` (TIMESTAMPTZ, DEFAULT NOW()): レコード更新日時。
- **インデックス:** `account_id`, `ticket_code` (UNIQUE), `expiry_date`

#### 1.6 `payment_methods` テーブル

- **役割:** ユーザーがチャージに利用する支払い方法（クレジットカードなど）を管理します。**モック決済のため、機密情報は保存せず、表示用の仮想情報のみを扱います。**
- **カラム:**
  - `id` (UUID, PRIMARY KEY, DEFAULT gen_random_uuid()): 支払い方法を一意に識別する ID。
  - `user_id` (UUID, NOT NULL): 支払い方法を登録したユーザー ID (`users.id`への外部キー)。
  - `type` (TEXT, NOT NULL): 支払い方法の種類 (例: 'credit_card', 'e_money_paypay', 'e_money_linepay', 'virtual_card')。
  - `display_name` (TEXT, NULLABLE): アプリ内で表示する支払い方法の名前 (例: "仮想 Visa カード \*\*\*\* 1234", "PayPay 連携済")。
  - `is_default` (BOOLEAN, DEFAULT FALSE, NOT NULL): デフォルトの支払い方法であるか。
  - `created_at` (TIMESTAMPTZ, DEFAULT NOW()): レコード作成日時。
  - `updated_at` (TIMESTAMPTZ, DEFAULT NOW()): レコード更新日時。
- **インデックス:** `user_id`

### 2. リレーションシップ

各テーブル間の関連性を定義します。

- **`users` と `accounts`**:

  - **種類:** 1 対 1 (One-to-One)
  - **接続:** `accounts.user_id` は `users.id` を参照します。`accounts.user_id` に UNIQUE 制約があるため、各ユーザーは 1 つのアカウントのみを持つことができます。

- **`users` と `payment_methods`**:

  - **種類:** 1 対多 (One-to-Many)
  - **接続:** `payment_methods.user_id` は `users.id` を参照します。1 人のユーザーは複数の支払い方法を登録できます。

- **`accounts` と `transactions`**:

  - **種類:** 1 対多 (One-to-Many)
  - **接続:** `transactions.account_id` は `accounts.id` を参照します。1 つのアカウントは複数の取引履歴を持ちます。

- **`accounts` と `commuter_passes`**:

  - **種類:** 1 対多 (One-to-Many)
  - **接続:** `commuter_passes.account_id` は `accounts.id` を参照します。1 つのアカウントは複数の定期券を保有できます。

- **`accounts` と `qr_tickets`**:
  - **種類:** 1 対多 (One-to-Many)
  - **接続:** `qr_tickets.account_id` は `accounts.id` を参照します。1 つのアカウントは複数の QR コード切符を発券できます。

---
