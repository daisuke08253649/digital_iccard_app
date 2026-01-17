// データベーステーブルの型定義

export interface User {
  id: string;
  email: string;
  password_hash?: string;
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  created_at: string;
  updated_at: string;
}

export interface Account {
  id: string;
  user_id: string;
  balance: number;
  card_number: string;
  status: 'active' | 'suspended' | 'locked';
  created_at: string;
  updated_at: string;
}

export interface PaymentMethod {
  id: string;
  user_id: string;
  type: 'credit_card' | 'e_money_paypay' | 'e_money_linepay' | 'virtual_card';
  display_name?: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  account_id: string;
  type: 'charge' | 'fare' | 'purchase' | 'commuter_pass_buy' | 'demo_charge' | 'demo_purchase';
  amount: number;
  description?: string;
  transaction_date: string;
  location?: string;
  created_at: string;
  updated_at: string;
}

export interface CommuterPass {
  id: string;
  account_id: string;
  start_station: string;
  end_station: string;
  route_name?: string;
  start_date: string;
  end_date: string;
  price: number;
  status: 'active' | 'expired' | 'canceled';
  created_at: string;
  updated_at: string;
}

export interface QRTicket {
  id: string;
  account_id: string;
  ticket_code: string;
  issue_date: string;
  expiry_date: string;
  start_station?: string;
  end_station?: string;
  fare: number;
  status: 'issued' | 'used' | 'expired' | 'canceled';
  created_at: string;
  updated_at: string;
}
