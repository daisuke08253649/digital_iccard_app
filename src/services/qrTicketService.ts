import { supabase } from '../../lib/supabase';
import { QRTicket } from '../types/database';

/**
 * QRチケット発券結果の型定義
 */
export interface IssueQRTicketResult {
  success: boolean;
  ticket?: QRTicket;
  newBalance?: number;
  error?: string;
}

/**
 * 運賃を計算（モック）
 * 実際のシステムでは区間・路線に基づいた運賃計算が必要
 */
export function calculateFare(startStation: string, endStation: string): number {
  // モック運賃: 駅名の組み合わせに基づく決定論的な計算
  // 実際には区間距離などに基づいて計算
  const baseFare = 200;
  // 駅名のハッシュ値を使用して一貫性のある追加運賃を計算
  const hash = (startStation + endStation).split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const additionalFare = (hash % 5) * 50; // 0〜200円追加
  return baseFare + additionalFare;
}

/**
 * ユニークなチケットコードを生成
 */
function generateTicketCode(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `QR-${timestamp}-${random}`;
}

/**
 * QRチケットを発券（モック決済）
 */
export async function issueQRTicket(
  accountId: string,
  startStation: string,
  endStation: string
): Promise<IssueQRTicketResult> {
  // 運賃計算
  const fare = calculateFare(startStation, endStation);

  // 現在の残高を取得
  const { data: account, error: accountError } = await supabase
    .from('accounts')
    .select('balance')
    .eq('id', accountId)
    .single();

  if (accountError || !account) {
    return { success: false, error: 'アカウント情報の取得に失敗しました' };
  }

  if (account.balance < fare) {
    return {
      success: false,
      error: `残高が不足しています（必要: ¥${fare.toLocaleString()}、残高: ¥${account.balance.toLocaleString()}）`
    };
  }

  // 残高を減少
  const newBalance = account.balance - fare;
  const { error: updateError } = await supabase
    .from('accounts')
    .update({ balance: newBalance })
    .eq('id', accountId);

  if (updateError) {
    return { success: false, error: '残高の更新に失敗しました' };
  }

  // 発券日と有効期限を設定（当日有効）
  const issueDate = new Date();
  const expiryDate = new Date();
  expiryDate.setHours(23, 59, 59, 999); // 当日終電まで有効

  // QRチケットを作成
  const ticketCode = generateTicketCode();
  const { data: ticket, error: ticketError } = await supabase
    .from('qr_tickets')
    .insert({
      account_id: accountId,
      ticket_code: ticketCode,
      issue_date: issueDate.toISOString(),
      expiry_date: expiryDate.toISOString(),
      start_station: startStation,
      end_station: endStation,
      fare: fare,
      status: 'issued',
    })
    .select()
    .single();

  if (ticketError) {
    console.error('Error creating QR ticket:', ticketError);
    // 残高を戻す（ロールバック）
    const { error: rollbackError } = await supabase
      .from('accounts')
      .update({ balance: account.balance })
      .eq('id', accountId);
    if (rollbackError) {
      console.error('Critical: Failed to rollback balance:', rollbackError);
    }
    return { success: false, error: 'QRチケットの発券に失敗しました' };
  }

  // トランザクション履歴を記録
  const { error: transactionError } = await supabase
    .from('transactions')
    .insert({
      account_id: accountId,
      type: 'fare',
      amount: -fare,
      description: `QRチケット: ${startStation} → ${endStation}`,
      transaction_date: new Date().toISOString(),
    });

  if (transactionError) {
    console.error('Error recording transaction:', transactionError);
  }

  return {
    success: true,
    ticket,
    newBalance,
    error: transactionError ? '履歴の記録に失敗しましたが、チケットは発券されました' : undefined,
  };
}

/**
 * QRチケットを使用済みにする
 */
export async function useQRTicket(ticketId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('qr_tickets')
    .update({ status: 'used' })
    .eq('id', ticketId)
    .eq('status', 'issued') // 発券済みのチケットのみ使用可能
    .select('id');

  if (error) {
    console.error('Error using QR ticket:', error);
    return false;
  }

  // 更新された行がない場合（チケットが存在しないか、既に使用済み）
  if (!data || data.length === 0) {
    console.error('No ticket was updated: ticket not found or already used');
    return false;
  }

  return true;
}

/**
 * QRチケットをキャンセル（払い戻し）
 */
export async function cancelQRTicket(
  ticketId: string,
  accountId: string
): Promise<{ success: boolean; refundAmount?: number; error?: string }> {
  // チケット情報を取得
  const { data: ticket, error: fetchError } = await supabase
    .from('qr_tickets')
    .select('*')
    .eq('id', ticketId)
    .eq('status', 'issued')
    .single();

  if (fetchError || !ticket) {
    return { success: false, error: 'キャンセル可能なチケットが見つかりません' };
  }

  // チケットをキャンセル
  const { error: cancelError } = await supabase
    .from('qr_tickets')
    .update({ status: 'canceled' })
    .eq('id', ticketId);

  if (cancelError) {
    return { success: false, error: 'チケットのキャンセルに失敗しました' };
  }

  // 残高を返金
  const { error: refundError } = await supabase
    .rpc('increment_balance', { account_id: accountId, amount: ticket.fare });

  // RPCがない場合は直接更新
  if (refundError) {
    const { data: account } = await supabase
      .from('accounts')
      .select('balance')
      .eq('id', accountId)
      .single();

    if (account) {
      const { error: updateError } = await supabase
        .from('accounts')
        .update({ balance: account.balance + ticket.fare })
        .eq('id', accountId);

      if (updateError) {
        console.error('Error refunding balance:', updateError);
        return { success: true, refundAmount: 0, error: '払い戻しに失敗しましたが、チケットはキャンセルされました' };
      }
    } else {
      console.error('Failed to fetch account for refund');
      return { success: true, refundAmount: 0, error: '払い戻しに失敗しましたが、チケットはキャンセルされました' };
    }
  }

  return { success: true, refundAmount: ticket.fare };
}

/**
 * ユーザーのQRチケット一覧を取得
 */
export async function getQRTickets(accountId: string): Promise<QRTicket[]> {
  const { data, error } = await supabase
    .from('qr_tickets')
    .select('*')
    .eq('account_id', accountId)
    .order('issue_date', { ascending: false });

  if (error) {
    console.error('Error fetching QR tickets:', error);
    return [];
  }

  return data || [];
}

/**
 * QRコードデータを生成（表示用）
 */
export function generateQRCodeData(ticket: QRTicket): string {
  // QRコードに埋め込むデータ
  return JSON.stringify({
    code: ticket.ticket_code,
    from: ticket.start_station,
    to: ticket.end_station,
    fare: ticket.fare,
    expiry: ticket.expiry_date,
    issued: ticket.issue_date,
  });
}
