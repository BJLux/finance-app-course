export type Profile = {
  id: string;
  name: string;
  starting_cash_balance: number;
  created_at: string;
};

export type Transaction = {
  id: string;
  user_id: string;
  type: 'INCOME' | 'EXPENSE';
  amount: number;
  category: string;
  transaction_date: string;
  note: string | null;
  created_at: string;
};

export type Trade = {
  id: string;
  user_id: string;
  ticker: string;
  type: 'BUY' | 'SELL';
  shares: number;
  price_per_share: number;
  trade_date: string;
  created_at: string;
};

export type CurrentPrice = {
  user_id: string;
  ticker: string;
  price: number;
  updated_at: string;
};
