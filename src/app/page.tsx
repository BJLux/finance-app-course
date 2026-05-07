import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createServerSupabase } from '@/lib/supabase/server';
import type { Transaction, Trade } from '@/lib/types';
import {
  cashBalance,
  holdingsByTicker,
  netWorth,
  portfolioValue,
  valuedHoldings,
} from '@/lib/calculations';
import { fmtMoney, fmtPct, fmtSignedMoney, fmtDate } from '@/lib/format';

export const dynamic = 'force-dynamic';

function n(v: number | string): number {
  return typeof v === 'string' ? Number(v) : v;
}

export default async function Dashboard() {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const [profileRes, txRes, tradeRes, priceRes] = await Promise.all([
    supabase.from('profiles').select('starting_cash_balance, name').eq('id', user.id).single(),
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
    supabase.from('current_prices').select('ticker, price'),
  ]);

  const startingCash = n(profileRes.data?.starting_cash_balance ?? 0);
  const transactions = ((txRes.data ?? []) as Transaction[]).map((t) => ({
    ...t,
    amount: n(t.amount),
  }));
  const trades = ((tradeRes.data ?? []) as Trade[]).map((t) => ({
    ...t,
    shares: n(t.shares),
    price_per_share: n(t.price_per_share),
  }));

  const currentPrices: Record<string, number> = {};
  for (const row of priceRes.data ?? []) currentPrices[row.ticker] = n(row.price);

  const cash = cashBalance({ starting_cash_balance: startingCash }, transactions, trades);
  const holdings = holdingsByTicker(trades);
  const valued = valuedHoldings(holdings, currentPrices);
  const portfolio = portfolioValue(valued);
  const total = netWorth(cash, valued);

  let income_total = 0;
  let expense_total = 0;
  const categoryTotals: Record<string, number> = {};
  for (const t of transactions) {
    if (t.type === 'INCOME') income_total += t.amount;
    else if (t.type === 'EXPENSE') {
      expense_total += t.amount;
      categoryTotals[t.category] = (categoryTotals[t.category] ?? 0) + t.amount;
    }
  }
  const topCategories = Object.entries(categoryTotals)
    .map(([category, total]) => ({ category, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  let totalCostHeld = 0;
  let totalValueHeld = 0;
  let anyPriced = false;
  for (const pos of Object.values(valued)) {
    totalCostHeld += pos.total_cost;
    if (pos.current_value != null) {
      anyPriced = true;
      totalValueHeld += pos.current_value;
    }
  }
  const totalReturn = anyPriced ? totalValueHeld - totalCostHeld : null;
  const totalReturnPct =
    anyPriced && totalReturn != null && totalCostHeld > 0
      ? totalReturn / totalCostHeld
      : null;

  const recent = transactions.slice(0, 5);

  return (
    <div className="space-y-8">
      <section className="card">
        <div className="card-title">Net worth</div>
        <div className="mt-1 text-4xl font-semibold tracking-tight">{fmtMoney(total)}</div>
        <div className="mt-4 flex flex-wrap gap-x-8 gap-y-2 text-sm">
          <div>
            <span className="text-gray-500">Cash · </span>
            <span className="font-medium">{fmtMoney(cash)}</span>
          </div>
          <div>
            <span className="text-gray-500">Stocks · </span>
            <span className="font-medium">{fmtMoney(portfolio)}</span>
          </div>
          {totalReturn != null && (
            <div>
              <span className="text-gray-500">Return · </span>
              <span
                className={`font-medium ${
                  totalReturn >= 0 ? 'text-emerald-700' : 'text-rose-700'
                }`}
              >
                {fmtSignedMoney(totalReturn)}
                {totalReturnPct != null && ` (${fmtPct(totalReturnPct)})`}
              </span>
            </div>
          )}
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <section className="card">
          <div className="flex items-baseline justify-between">
            <h2 className="text-base font-semibold">Recent transactions</h2>
            <Link
              href="/transactions"
              className="text-xs text-gray-500 hover:text-gray-900"
            >
              View all →
            </Link>
          </div>
          <div className="mt-2 text-xs text-gray-500">
            Income {fmtMoney(income_total)} · Expense {fmtMoney(expense_total)}
          </div>
          <ul className="mt-4 divide-y divide-gray-100">
            {recent.length === 0 && (
              <li className="py-6 text-sm text-gray-400">
                No transactions yet — head to{' '}
                <Link href="/transactions" className="text-gray-900 underline">
                  Transactions
                </Link>{' '}
                to add one.
              </li>
            )}
            {recent.map((t) => (
              <li key={t.id} className="flex items-center justify-between py-3">
                <div>
                  <div className="text-sm font-medium">{t.category}</div>
                  <div className="text-xs text-gray-500">
                    {fmtDate(t.transaction_date)}
                    {t.note ? ` · ${t.note}` : ''}
                  </div>
                </div>
                <div
                  className={`text-sm font-medium ${
                    t.type === 'INCOME' ? 'text-emerald-700' : 'text-rose-700'
                  }`}
                >
                  {t.type === 'INCOME' ? '+' : '−'} {fmtMoney(t.amount)}
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="card">
          <div className="flex items-baseline justify-between">
            <h2 className="text-base font-semibold">Top expense categories</h2>
          </div>
          <ul className="mt-4 divide-y divide-gray-100">
            {topCategories.length === 0 && (
              <li className="py-6 text-sm text-gray-400">No expenses yet.</li>
            )}
            {topCategories.map((c) => (
              <li key={c.category} className="flex items-center justify-between py-3">
                <div className="text-sm font-medium">{c.category}</div>
                <div className="text-sm">{fmtMoney(c.total)}</div>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="card">
        <div className="flex items-baseline justify-between">
          <h2 className="text-base font-semibold">Portfolio</h2>
          <Link href="/portfolio" className="text-xs text-gray-500 hover:text-gray-900">
            Manage →
          </Link>
        </div>
        <ul className="mt-4 divide-y divide-gray-100">
          {Object.entries(valued).length === 0 && (
            <li className="py-6 text-sm text-gray-400">
              No holdings yet — head to{' '}
              <Link href="/portfolio" className="text-gray-900 underline">
                Portfolio
              </Link>{' '}
              to record your first trade.
            </li>
          )}
          {Object.entries(valued).map(([ticker, pos]) => (
            <li key={ticker} className="flex items-center justify-between py-3">
              <div>
                <div className="text-sm font-medium">{ticker}</div>
                <div className="text-xs text-gray-500">
                  {pos.shares.toLocaleString('en-IE', { maximumFractionDigits: 6 })} shares
                  · avg cost {fmtMoney(pos.avg_cost_basis)}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium">
                  {pos.current_value != null ? fmtMoney(pos.current_value) : 'No price'}
                </div>
                {pos.gain != null && (
                  <div
                    className={`text-xs ${
                      pos.gain >= 0 ? 'text-emerald-700' : 'text-rose-700'
                    }`}
                  >
                    {fmtSignedMoney(pos.gain)}
                    {pos.gain_pct != null && ` (${fmtPct(pos.gain_pct)})`}
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
