import { supabase } from '../../lib/supabase';
import { PaymentMethod } from '../types/database';

/**
 * ユーザーの支払い方法一覧を取得
 */
export async function getPaymentMethods(userId: string): Promise<PaymentMethod[]> {
  const { data, error } = await supabase
    .from('payment_methods')
    .select('*')
    .eq('user_id', userId)
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching payment methods:', error);
    return [];
  }

  return data || [];
}

/**
 * デフォルトの支払い方法を取得
 */
export async function getDefaultPaymentMethod(
  userId: string
): Promise<PaymentMethod | null> {
  const { data, error } = await supabase
    .from('payment_methods')
    .select('*')
    .eq('user_id', userId)
    .eq('is_default', true)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No rows returned - not an error, just no default set
      return null;
    }
    console.error('Error fetching default payment method:', error);
    return null;
  }

  return data;
}

/**
 * 支払い方法を追加（モック）
 * 実際のカード情報は保存せず、仮想の支払い方法情報のみ保存
 */
export async function addPaymentMethod(
  userId: string,
  type: PaymentMethod['type'],
  displayName: string,
  isDefault: boolean = false
): Promise<PaymentMethod | null> {
  // 他の支払い方法のデフォルトを解除
  if (isDefault) {
    const { error: clearError } = await supabase
      .from('payment_methods')
      .update({ is_default: false })
      .eq('user_id', userId);
    if (clearError) {
      console.error('Error clearing default payment methods:', clearError);
      return null;
    }
  }

  const { data, error } = await supabase
    .from('payment_methods')
    .insert({
      user_id: userId,
      type,
      display_name: displayName,
      is_default: isDefault,
    })
    .select()
    .single();

  if (error) {
    console.error('Error adding payment method:', error);
    return null;
  }

  return data;
}

/**
 * 支払い方法を削除
 */
export async function deletePaymentMethod(paymentMethodId: string): Promise<boolean> {
  const { error } = await supabase
    .from('payment_methods')
    .delete()
    .eq('id', paymentMethodId);

  if (error) {
    console.error('Error deleting payment method:', error);
    return false;
  }

  return true;
}

/**
 * デフォルトの支払い方法を設定
 */
export async function setDefaultPaymentMethod(
  userId: string,
  paymentMethodId: string
): Promise<boolean> {
  // 既存のデフォルトを解除
  const { error: clearError } = await supabase
    .from('payment_methods')
    .update({ is_default: false })
    .eq('user_id', userId);

  if (clearError) {
    console.error('Error clearing default payment method:', clearError);
    return false;
  }

  // 新しいデフォルトを設定（user_idでも絞り込み、更新結果を検証）
  const { data, error: setError } = await supabase
    .from('payment_methods')
    .update({ is_default: true })
    .eq('id', paymentMethodId)
    .eq('user_id', userId)
    .select()
    .single();

  if (setError) {
    console.error('Error setting default payment method:', setError);
    return false;
  }

  if (!data) {
    console.error('No payment method was updated - invalid paymentMethodId or userId');
    return false;
  }

  return true;
}

/**
 * 支払い方法タイプの表示名を取得
 */
export function getPaymentTypeDisplayName(type: PaymentMethod['type']): string {
  const typeNames: Record<PaymentMethod['type'], string> = {
    credit_card: 'クレジットカード',
    e_money_paypay: 'PayPay',
    e_money_linepay: 'LINE Pay',
    virtual_card: 'バーチャルカード',
  };
  return typeNames[type] || type;
}
