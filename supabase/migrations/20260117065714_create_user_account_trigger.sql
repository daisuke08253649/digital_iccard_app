-- 新規ユーザー登録時に自動的にアカウントを作成するトリガー

-- トリガー関数: 新規ユーザーのアカウントを自動作成
CREATE OR REPLACE FUNCTION create_user_account()
RETURNS TRIGGER AS $$
DECLARE
  random_card_number TEXT;
BEGIN
  -- ランダムなカード番号を生成（16桁）
  random_card_number := LPAD(FLOOR(RANDOM() * 10000000000000000)::TEXT, 16, '0');

  -- accountsテーブルに新規アカウントを作成
  INSERT INTO public.accounts (user_id, balance, card_number, status)
  VALUES (
    NEW.id,
    0.00,
    random_card_number,
    'active'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- auth.usersテーブルにトリガーを設定
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_user_account();

-- usersテーブルにもデータを同期するトリガー（オプション）
CREATE OR REPLACE FUNCTION sync_user_data()
RETURNS TRIGGER AS $$
BEGIN
  -- public.usersテーブルにもユーザー情報を作成
  INSERT INTO public.users (id, email, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email, updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_sync
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION sync_user_data();
