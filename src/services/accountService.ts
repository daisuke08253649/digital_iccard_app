import { supabase } from '../../lib/supabase';
import { Account, Transaction, CommuterPass, QRTicket } from '../types/database';

/**
 * チャージ結果の型定義
 */
export interface ChargeResult {
  success: boolean;
  newBalance?: number;
  transaction?: Transaction;
  error?: string;
}

/**
 * ユーザーのアカウント情報を取得
 */
export async function getAccount(userId: string): Promise<Account | null> {
  const { data, error } = await supabase
    .from('accounts')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) {
    console.error('Error fetching account:', error);
    return null;
  }

  return data;
}

/**
 * ユーザーの取引履歴を取得
 */
export async function getTransactions(
  accountId: string,
  limit: number = 50
): Promise<Transaction[]> {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('account_id', accountId)
    .order('transaction_date', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching transactions:', error);
    return [];
  }

  return data || [];
}

/**
 * ユーザーのアクティブな定期券を取得
 */
export async function getActiveCommuterPasses(
  accountId: string
): Promise<CommuterPass[]> {
  const { data, error } = await supabase
    .from('commuter_passes')
    .select('*')
    .eq('account_id', accountId)
    .eq('status', 'active')
    .order('end_date', { ascending: true });

  if (error) {
    console.error('Error fetching commuter passes:', error);
    return [];
  }

  return data || [];
}

/**
 * ユーザーのアクティブなQRチケットを取得
 */
export async function getActiveQRTickets(accountId: string): Promise<QRTicket[]> {
  const { data, error } = await supabase
    .from('qr_tickets')
    .select('*')
    .eq('account_id', accountId)
    .in('status', ['issued'])
    .order('issue_date', { ascending: false });

  if (error) {
    console.error('Error fetching QR tickets:', error);
    return [];
  }

  return data || [];
}

/**
 * モックチャージを実行
 * 実際の決済は行わず、内部的に残高を増加させる
 */
export async function executeCharge(
  accountId: string,
  amount: number,
  paymentMethodId?: string
): Promise<ChargeResult> {
  // 金額バリデーション
  if (amount <= 0) {
    return { success: false, error: 'チャージ金額は正の値である必要があります' };
  }

  if (amount > 50000) {
    return { success: false, error: 'チャージ金額は50,000円以下である必要があります' };
  }

  // 現在の残高を取得
  const { data: account, error: accountError } = await supabase
    .from('accounts')
    .select('balance')
    .eq('id', accountId)
    .single();

  if (accountError || !account) {
    return { success: false, error: 'アカウント情報の取得に失敗しました' };
  }

  const currentBalance = account.balance;
  const newBalance = currentBalance + amount;

  // 残高上限チェック（20万円）
  if (newBalance > 200000) {
    return { success: false, error: '残高上限（200,000円）を超えるチャージはできません' };
  }

  // トランザクションを開始（残高更新 + 履歴記録）
  // まず残高を更新
  const { error: updateError } = await supabase
    .from('accounts')
    .update({ balance: newBalance })
    .eq('id', accountId);

  if (updateError) {
    return { success: false, error: '残高の更新に失敗しました' };
  }

  // トランザクション履歴を記録
  const { data: transaction, error: transactionError } = await supabase
    .from('transactions')
    .insert({
      account_id: accountId,
      type: 'demo_charge',
      amount: amount,
      description: paymentMethodId
        ? 'デモチャージ（支払い方法使用）'
        : 'デモチャージ',
      transaction_date: new Date().toISOString(),
    })
    .select()
    .single();

  if (transactionError) {
    // トランザクション記録に失敗した場合でも、残高は既に更新されている
    // 本番環境ではロールバックが必要だが、デモでは許容
    console.error('Error recording transaction:', transactionError);
    return {
      success: true,
      newBalance,
      error: '履歴の記録に失敗しましたが、チャージは完了しました',
    };
  }

  return {
    success: true,
    newBalance,
    transaction,
  };
}

/**
 * 残高を使用（支払い）- モック実装
 */
export async function executePayment(
  accountId: string,
  amount: number,
  description: string,
  type: 'fare' | 'purchase' | 'demo_purchase' = 'demo_purchase',
  location?: string
): Promise<ChargeResult> {
  // 金額バリデーション
  if (amount <= 0) {
    return { success: false, error: '支払い金額は正の値である必要があります' };
  }

  // 現在の残高を取得
  const { data: account, error: accountError } = await supabase
    .from('accounts')
    .select('balance')
    .eq('id', accountId)
    .single();

  if (accountError || !account) {
    return { success: false, error: 'アカウント情報の取得に失敗しました' };
  }

  const currentBalance = account.balance;
  if (currentBalance < amount) {
    return { success: false, error: '残高が不足しています' };
  }

  const newBalance = currentBalance - amount;

  // 残高を更新
  const { error: updateError } = await supabase
    .from('accounts')
    .update({ balance: newBalance })
    .eq('id', accountId);

  if (updateError) {
    return { success: false, error: '残高の更新に失敗しました' };
  }

  // トランザクション履歴を記録
  const { data: transaction, error: transactionError } = await supabase
    .from('transactions')
    .insert({
      account_id: accountId,
      type,
      amount: -amount, // 支払いはマイナス
      description,
      transaction_date: new Date().toISOString(),
      location,
    })
    .select()
    .single();

  if (transactionError) {
    console.error('Error recording transaction:', transactionError);
    return {
      success: true,
      newBalance,
      error: '履歴の記録に失敗しましたが、支払いは完了しました',
    };
  }

  return {
    success: true,
    newBalance,
    transaction,
  };
}
