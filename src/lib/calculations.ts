import type { Trade, Transaction, User } from './db';

export type Holding = {
  shares: number;
  total_cost: number;
  avg_cost_basis: number;
};

export type ValuedHolding = {
  shares: number;
  avg_cost_basis: number;
  total_cost: number;
  current_price: number | null;
  current_value: number | null;
  gain: number | null;
  gain_pct: number | null;
};

export function cashBalance(
  user: Pick<User, 'starting_cash_balance'>,
  transactions: readonly Transaction[],
  trades: readonly Trade[],
): number {
  let cash = user.starting_cash_balance;
  for (const t of transactions) {
    if (t.type === 'INCOME') cash += t.amount;
    else if (t.type === 'EXPENSE') cash -= t.amount;
  }
  for (const trade of trades) {
    const cost = trade.shares * trade.price_per_share;
    if (trade.type === 'BUY') cash -= cost;
    else if (trade.type === 'SELL') cash += cost;
  }
  return cash;
}

// Cost basis carries through SELLs at the current average — SELLs reduce
// shares and total_cost proportionally, so avg_cost_basis is unchanged.
export function holdingsByTicker(trades: readonly Trade[]): Record<string, Holding> {
  const sorted = [...trades].sort((a, b) =>
    a.trade_date < b.trade_date ? -1 : a.trade_date > b.trade_date ? 1 : a.id - b.id,
  );

  const positions: Record<string, { shares: number; total_cost: number }> = {};
  for (const trade of sorted) {
    const pos = positions[trade.ticker] ?? { shares: 0, total_cost: 0 };
    if (trade.type === 'BUY') {
      pos.shares += trade.shares;
      pos.total_cost += trade.shares * trade.price_per_share;
    } else if (trade.type === 'SELL') {
      const avg = pos.shares > 0 ? pos.total_cost / pos.shares : 0;
      pos.shares -= trade.shares;
      pos.total_cost -= trade.shares * avg;
      if (pos.shares <= 1e-9) {
        pos.shares = 0;
        pos.total_cost = 0;
      }
    }
    positions[trade.ticker] = pos;
  }

  const result: Record<string, Holding> = {};
  for (const [ticker, pos] of Object.entries(positions)) {
    if (pos.shares > 0) {
      result[ticker] = {
        shares: pos.shares,
        total_cost: pos.total_cost,
        avg_cost_basis: pos.total_cost / pos.shares,
      };
    }
  }
  return result;
}

export function valuedHoldings(
  holdings: Record<string, Holding>,
  currentPrices: Record<string, number>,
): Record<string, ValuedHolding> {
  const result: Record<string, ValuedHolding> = {};
  for (const [ticker, pos] of Object.entries(holdings)) {
    const price = currentPrices[ticker];
    const has_price = price != null;
    const current_value = has_price ? pos.shares * price : null;
    const gain = has_price && current_value != null ? current_value - pos.total_cost : null;
    const gain_pct =
      has_price && gain != null && pos.total_cost > 0 ? gain / pos.total_cost : null;
    result[ticker] = {
      shares: pos.shares,
      avg_cost_basis: pos.avg_cost_basis,
      total_cost: pos.total_cost,
      current_price: has_price ? price : null,
      current_value,
      gain,
      gain_pct,
    };
  }
  return result;
}

export function portfolioValue(valued: Record<string, ValuedHolding>): number {
  let total = 0;
  for (const pos of Object.values(valued)) {
    if (pos.current_value != null) total += pos.current_value;
  }
  return total;
}

export function netWorth(cash: number, valued: Record<string, ValuedHolding>): number {
  return cash + portfolioValue(valued);
}
