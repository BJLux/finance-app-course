import { createServerSupabase } from '@/lib/supabase/server';
import type { Transaction, Trade } from '@/lib/types';
import {
  cashBalance,
  holdingsByTicker,
  netWorth,
  portfolioValue,
  valuedHoldings,
} from '@/lib/calculations';

export async function GET() {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: 'unauthorized' }, { status: 401 });

  const [profileRes, txRes, tradeRes, priceRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase
      .from('transactions')
      .select('*')
      .order('transaction_date', { ascending: false })
      .order('created_at', { ascending: false }),
    supabase
      .from('trades')
      .select('*')
      .order('trade_date', { ascending: false })
      .order('created_at', { ascending: false }),
    supabase.from('current_prices').select('ticker, price, updated_at'),
  ]);

  if (profileRes.error) {
    return Response.json({ error: profileRes.error.message }, { status: 500 });
  }
  if (txRes.error) return Response.json({ error: txRes.error.message }, { status: 500 });
  if (tradeRes.error) return Response.json({ error: tradeRes.error.message }, { status: 500 });
  if (priceRes.error) return Response.json({ error: priceRes.error.message }, { status: 500 });

  const profile = profileRes.data as { starting_cash_balance: number; name: string };
  const transactions = (txRes.data ?? []) as Transaction[];
  const trades = (tradeRes.data ?? []) as Trade[];

  const currentPrices: Record<string, number> = {};
  const priceMeta: Record<string, string> = {};
  for (const row of priceRes.data ?? []) {
    currentPrices[row.ticker] = Number(row.price);
    priceMeta[row.ticker] = row.updated_at;
  }

  const cash = cashBalance(
    { starting_cash_balance: Number(profile.starting_cash_balance) },
    transactions,
    trades,
  );
  const holdings = holdingsByTicker(trades);
  const valued = valuedHoldings(holdings, currentPrices);
  const portfolio_value = portfolioValue(valued);
  const net_worth_total = netWorth(cash, valued);

  let income_total = 0;
  let expense_total = 0;
  const categoryTotals: Record<string, number> = {};
  for (const t of transactions) {
    if (t.type === 'INCOME') income_total += Number(t.amount);
    else if (t.type === 'EXPENSE') {
      expense_total += Number(t.amount);
      categoryTotals[t.category] = (categoryTotals[t.category] ?? 0) + Number(t.amount);
    }
  }
  const top_categories = Object.entries(categoryTotals)
    .map(([category, total]) => ({ category, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  const holdingsArray = Object.entries(valued).map(([ticker, pos]) => ({
    ticker,
    shares: pos.shares,
    avg_cost_basis: pos.avg_cost_basis,
    total_cost: pos.total_cost,
    current_price: pos.current_price,
    current_value: pos.current_value,
    gain: pos.gain,
    gain_pct: pos.gain_pct,
    price_updated_at: priceMeta[ticker] ?? null,
  }));

  let total_cost_held = 0;
  let total_value_held = 0;
  let any_priced = false;
  for (const h of holdingsArray) {
    total_cost_held += h.total_cost;
    if (h.current_value != null) {
      any_priced = true;
      total_value_held += h.current_value;
    }
  }
  const total_return = any_priced ? total_value_held - total_cost_held : null;
  const total_return_pct =
    any_priced && total_return != null && total_cost_held > 0
      ? total_return / total_cost_held
      : null;

  return Response.json({
    user: {
      id: user.id,
      name: profile.name,
      starting_cash_balance: Number(profile.starting_cash_balance),
    },
    net_worth: { total: net_worth_total },
    cash_flow: {
      cash_balance: cash,
      income_total,
      expense_total,
      top_categories,
      recent_transactions: transactions.slice(0, 10),
    },
    portfolio: {
      total_value: portfolio_value,
      total_cost: total_cost_held,
      total_return,
      total_return_pct,
      holdings: holdingsArray,
    },
  });
}
