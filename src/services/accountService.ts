import { supabase } from '../../lib/supabase';
import { Account, Transaction, CommuterPass, QRTicket } from '../types/database';

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
