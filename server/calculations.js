// Pure calculation functions matching spec section 3.
// No I/O — all data passed in as arguments. Easy to unit test.

function cashBalance(user, transactions, trades) {
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

// Returns { TICKER: { shares, avg_cost_basis, total_cost } } for tickers
// with shares > 0. Uses the standard "cost basis carries through SELLs at
// the current average" approach: SELLs reduce shares and total_cost
// proportionally, so avg_cost_basis is unchanged by a SELL.
function holdingsByTicker(trades) {
  const sorted = [...trades].sort((a, b) =>
    a.trade_date < b.trade_date ? -1 : a.trade_date > b.trade_date ? 1 : a.id - b.id,
  );
  const positions = {};
  for (const trade of sorted) {
    const pos = positions[trade.ticker] || { shares: 0, total_cost: 0 };
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
  const result = {};
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

// holdings: result of holdingsByTicker
// currentPrices: { TICKER: price } map
// Returns { TICKER: { shares, avg_cost_basis, current_price, current_value, gain, gain_pct } }
function valuedHoldings(holdings, currentPrices) {
  const result = {};
  for (const [ticker, pos] of Object.entries(holdings)) {
    const price = currentPrices[ticker];
    const has_price = price != null;
    const current_value = has_price ? pos.shares * price : null;
    const gain = has_price ? current_value - pos.total_cost : null;
    const gain_pct = has_price && pos.total_cost > 0 ? gain / pos.total_cost : null;
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

function portfolioValue(valued) {
  let total = 0;
  for (const pos of Object.values(valued)) {
    if (pos.current_value != null) total += pos.current_value;
  }
  return total;
}

function netWorth(cash, valued) {
  return cash + portfolioValue(valued);
}

module.exports = {
  cashBalance,
  holdingsByTicker,
  valuedHoldings,
  portfolioValue,
  netWorth,
};
