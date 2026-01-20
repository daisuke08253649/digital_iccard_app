import { supabase } from '../../lib/supabase';
import { CommuterPass } from '../types/database';

/**
 * 定期券購入結果の型定義
 */
export interface PurchaseCommuterPassResult {
  success: boolean;
  commuterPass?: CommuterPass;
  newBalance?: number;
  error?: string;
}

/**
 * 定期券期間タイプ
 */
export type PassDuration = '1month' | '3months' | '6months';

/**
 * 定期券期間の日数マッピング
 */
const DURATION_DAYS: Record<PassDuration, number> = {
  '1month': 30,
  '3months': 90,
  '6months': 180,
};

/**
 * 定期券期間の表示名
 */
export const DURATION_LABELS: Record<PassDuration, string> = {
  '1month': '1ヶ月',
  '3months': '3ヶ月',
  '6months': '6ヶ月',
};

/**
 * 定期券価格を計算（モック）
 * 実際のシステムでは区間・路線に基づいた価格計算が必要
 */
export function calculatePassPrice(
  startStation: string,
  endStation: string,
  duration: PassDuration
): number {
  // モック価格: 基本運賃 × 期間係数
  const basePrice = 10000; // 基本月額
  const multiplier: Record<PassDuration, number> = {
    '1month': 1,
    '3months': 2.85, // 5%割引
    '6months': 5.4,  // 10%割引
  };
  return Math.floor(basePrice * multiplier[duration]);
}

/**
 * 定期券を購入（モック決済）
 */
export async function purchaseCommuterPass(
  accountId: string,
  startStation: string,
  endStation: string,
  routeName: string,
  duration: PassDuration
): Promise<PurchaseCommuterPassResult> {
  // 価格計算
  const price = calculatePassPrice(startStation, endStation, duration);

  // 現在の残高を取得
  const { data: account, error: accountError } = await supabase
    .from('accounts')
    .select('balance')
    .eq('id', accountId)
    .single();

  if (accountError || !account) {
    return { success: false, error: 'アカウント情報の取得に失敗しました' };
  }

  if (account.balance < price) {
    return {
      success: false,
      error: `残高が不足しています（必要: ¥${price.toLocaleString()}、残高: ¥${account.balance.toLocaleString()}）`
    };
  }

  // 開始日と終了日を計算
  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + DURATION_DAYS[duration]);

  // 残高を減少
  const newBalance = account.balance - price;
  const { error: updateError } = await supabase
    .from('accounts')
    .update({ balance: newBalance })
    .eq('id', accountId);

  if (updateError) {
    return { success: false, error: '残高の更新に失敗しました' };
  }

  // 定期券を作成
  const { data: commuterPass, error: passError } = await supabase
    .from('commuter_passes')
    .insert({
      account_id: accountId,
      start_station: startStation,
      end_station: endStation,
      route_name: routeName,
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString(),
      price: price,
      status: 'active',
    })
    .select()
    .single();

  if (passError) {
    console.error('Error creating commuter pass:', passError);
    // 残高を戻す（ロールバック）
    await supabase
      .from('accounts')
      .update({ balance: account.balance })
      .eq('id', accountId);
    return { success: false, error: '定期券の作成に失敗しました' };
  }

  // トランザクション履歴を記録
  const { error: transactionError } = await supabase
    .from('transactions')
    .insert({
      account_id: accountId,
      type: 'commuter_pass_buy',
      amount: -price,
      description: `定期券購入: ${startStation} → ${endStation}（${DURATION_LABELS[duration]}）`,
      transaction_date: new Date().toISOString(),
    });

  if (transactionError) {
    console.error('Error recording transaction:', transactionError);
    // 定期券は作成済みなので、履歴記録失敗は警告のみ
  }

  return {
    success: true,
    commuterPass,
    newBalance,
    error: transactionError ? '履歴の記録に失敗しましたが、定期券は購入されました' : undefined,
  };
}

/**
 * 定期券をキャンセル
 */
export async function cancelCommuterPass(passId: string): Promise<boolean> {
  const { error } = await supabase
    .from('commuter_passes')
    .update({ status: 'canceled' })
    .eq('id', passId);

  if (error) {
    console.error('Error canceling commuter pass:', error);
    return false;
  }

  return true;
}

/**
 * ユーザーの定期券一覧を取得
 */
export async function getCommuterPasses(accountId: string): Promise<CommuterPass[]> {
  const { data, error } = await supabase
    .from('commuter_passes')
    .select('*')
    .eq('account_id', accountId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching commuter passes:', error);
    return [];
  }

  return data || [];
}

/**
 * サンプル駅一覧（デモ用）
 */
export const SAMPLE_STATIONS = [
  '東京',
  '新宿',
  '渋谷',
  '池袋',
  '品川',
  '上野',
  '秋葉原',
  '横浜',
  '川崎',
  '大宮',
];
