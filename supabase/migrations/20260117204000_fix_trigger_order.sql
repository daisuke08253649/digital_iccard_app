-- 1. 古いトリガーと関数を削除
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_sync ON auth.users;
DROP FUNCTION IF EXISTS create_user_account();
DROP FUNCTION IF EXISTS sync_user_data();

-- 2. 新しい統合トリガー関数を作成
CREATE OR REPLACE FUNCTION handle_new_user_setup()
RETURNS TRIGGER AS $$
DECLARE
  random_card_number TEXT;
  card_exists BOOLEAN;
  max_attempts INT := 10;
  attempt_count INT := 0;
BEGIN

  INSERT INTO public.users (id, email, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email, updated_at = NOW();

  IF (TG_OP = 'INSERT') THEN
    -- ランダムなカード番号を生成（16桁）、重複チェック付き
    LOOP
      random_card_number :=
        LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0') ||
        LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0') ||
        LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0') ||
        LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');

      -- カード番号の重複チェック
      SELECT EXISTS(SELECT 1 FROM public.accounts WHERE card_number = random_card_number) INTO card_exists;

      EXIT WHEN NOT card_exists OR attempt_count >= max_attempts;
      attempt_count := attempt_count + 1;
    END LOOP;

    -- 最大試行回数を超えた場合はエラー
    IF card_exists THEN
      RAISE EXCEPTION 'Failed to generate unique card number after % attempts', max_attempts;
    END IF;

    -- accountsテーブルに新規アカウントを作成
    INSERT INTO public.accounts (user_id, balance, card_number, status)
    VALUES (
      NEW.id,
      0.00,
      random_card_number,
      'active'
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. auth.usersテーブルに新しい統合トリガーを設定
CREATE TRIGGER on_auth_user_created_setup
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user_setup();
