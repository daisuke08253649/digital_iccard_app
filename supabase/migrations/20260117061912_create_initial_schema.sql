-- デジタルICカードサービス - 初期データベーススキーマ
-- このマイグレーションは、すべての主要テーブルとリレーションシップを作成します

-- ============================================================
-- 1. users テーブル
-- ============================================================
-- ユーザーの認証情報および基本個人情報を管理
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT,
  first_name TEXT,
  last_name TEXT,
  phone_number TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- usersテーブルのインデックス
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_phone_number ON users(phone_number);

-- ============================================================
-- 2. accounts テーブル
-- ============================================================
-- 各ユーザーに紐づくデジタルICカードアカウントの主要情報（残高など）を管理
CREATE TABLE IF NOT EXISTS accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  balance NUMERIC(10, 2) DEFAULT 0.00 NOT NULL CHECK (balance >= 0),
  card_number TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'active' NOT NULL CHECK (status IN ('active', 'suspended', 'locked')),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- accountsテーブルのインデックス
CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_accounts_card_number ON accounts(card_number);

-- ============================================================
-- 3. payment_methods テーブル
-- ============================================================
-- ユーザーがチャージに利用する支払い方法を管理（モック決済用）
CREATE TABLE IF NOT EXISTS payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('credit_card', 'e_money_paypay', 'e_money_linepay', 'virtual_card')),
  display_name TEXT,
  is_default BOOLEAN DEFAULT FALSE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- payment_methodsテーブルのインデックス
CREATE INDEX IF NOT EXISTS idx_payment_methods_user_id ON payment_methods(user_id);

-- ============================================================
-- 4. transactions テーブル
-- ============================================================
-- すべての取引（チャージ、運賃、購入など）の履歴を記録
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('charge', 'fare', 'purchase', 'commuter_pass_buy', 'demo_charge', 'demo_purchase')),
  amount NUMERIC(10, 2) NOT NULL,
  description TEXT,
  transaction_date TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  location TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- transactionsテーブルのインデックス
CREATE INDEX IF NOT EXISTS idx_transactions_account_id ON transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_transaction_date ON transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);

-- ============================================================
-- 5. commuter_passes テーブル
-- ============================================================
-- ユーザーが保有する定期券の情報を管理
CREATE TABLE IF NOT EXISTS commuter_passes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  start_station TEXT NOT NULL,
  end_station TEXT NOT NULL,
  route_name TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
  status TEXT DEFAULT 'active' NOT NULL CHECK (status IN ('active', 'expired', 'canceled')),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- commuter_passesテーブルのインデックス
CREATE INDEX IF NOT EXISTS idx_commuter_passes_account_id ON commuter_passes(account_id);
CREATE INDEX IF NOT EXISTS idx_commuter_passes_end_date ON commuter_passes(end_date);
CREATE INDEX IF NOT EXISTS idx_commuter_passes_status ON commuter_passes(status);

-- ============================================================
-- 6. qr_tickets テーブル
-- ============================================================
-- QRコード型の切符の情報を管理
CREATE TABLE IF NOT EXISTS qr_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  ticket_code TEXT UNIQUE NOT NULL,
  issue_date TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  expiry_date TIMESTAMPTZ NOT NULL,
  start_station TEXT,
  end_station TEXT,
  fare NUMERIC(10, 2) NOT NULL CHECK (fare >= 0),
  status TEXT DEFAULT 'issued' NOT NULL CHECK (status IN ('issued', 'used', 'expired', 'canceled')),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- qr_ticketsテーブルのインデックス
CREATE INDEX IF NOT EXISTS idx_qr_tickets_account_id ON qr_tickets(account_id);
CREATE INDEX IF NOT EXISTS idx_qr_tickets_ticket_code ON qr_tickets(ticket_code);
CREATE INDEX IF NOT EXISTS idx_qr_tickets_expiry_date ON qr_tickets(expiry_date);
CREATE INDEX IF NOT EXISTS idx_qr_tickets_status ON qr_tickets(status);

-- ============================================================
-- Row Level Security (RLS) の有効化
-- ============================================================

-- 各テーブルでRLSを有効化
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE commuter_passes ENABLE ROW LEVEL SECURITY;
ALTER TABLE qr_tickets ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- RLS ポリシーの設定
-- ============================================================

-- users テーブル: ユーザーは自分のデータのみアクセス可能
CREATE POLICY "Users can view own data" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own data" ON users
  FOR UPDATE USING (auth.uid() = id);

-- accounts テーブル: ユーザーは自分のアカウントのみアクセス可能
CREATE POLICY "Users can view own account" ON accounts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own account" ON accounts
  FOR UPDATE USING (auth.uid() = user_id);

-- payment_methods テーブル: ユーザーは自分の支払い方法のみアクセス可能
CREATE POLICY "Users can view own payment methods" ON payment_methods
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own payment methods" ON payment_methods
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own payment methods" ON payment_methods
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own payment methods" ON payment_methods
  FOR DELETE USING (auth.uid() = user_id);

-- transactions テーブル: ユーザーは自分のアカウントの取引のみ参照可能
CREATE POLICY "Users can view own transactions" ON transactions
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM accounts WHERE id = transactions.account_id
    )
  );

-- commuter_passes テーブル: ユーザーは自分のアカウントの定期券のみアクセス可能
CREATE POLICY "Users can view own commuter passes" ON commuter_passes
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM accounts WHERE id = commuter_passes.account_id
    )
  );

CREATE POLICY "Users can insert own commuter passes" ON commuter_passes
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM accounts WHERE id = commuter_passes.account_id
    )
  );

CREATE POLICY "Users can update own commuter passes" ON commuter_passes
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT user_id FROM accounts WHERE id = commuter_passes.account_id
    )
  );

-- qr_tickets テーブル: ユーザーは自分のアカウントのQRチケットのみアクセス可能
CREATE POLICY "Users can view own qr tickets" ON qr_tickets
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM accounts WHERE id = qr_tickets.account_id
    )
  );

CREATE POLICY "Users can insert own qr tickets" ON qr_tickets
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM accounts WHERE id = qr_tickets.account_id
    )
  );

CREATE POLICY "Users can update own qr tickets" ON qr_tickets
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT user_id FROM accounts WHERE id = qr_tickets.account_id
    )
  );

-- ============================================================
-- トリガー関数: updated_at の自動更新
-- ============================================================

-- updated_atカラムを自動更新する関数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 各テーブルにトリガーを設定
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_accounts_updated_at BEFORE UPDATE ON accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_methods_updated_at BEFORE UPDATE ON payment_methods
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_commuter_passes_updated_at BEFORE UPDATE ON commuter_passes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_qr_tickets_updated_at BEFORE UPDATE ON qr_tickets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
