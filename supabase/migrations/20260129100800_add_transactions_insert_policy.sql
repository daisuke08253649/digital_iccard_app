-- transactions テーブルに INSERT ポリシーを追加
-- ユーザーが自身のアカウントに紐づく取引を記録できるようにする
CREATE POLICY "Users can insert own transactions" ON transactions
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM accounts WHERE id = transactions.account_id
    )
  );
