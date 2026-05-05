const express = require('express');
const db = require('../db');
const calc = require('../calculations');

const router = express.Router();

const USER_ID = 1; // single-user prototype

router.get('/', (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(USER_ID);
  const transactions = db
    .prepare('SELECT * FROM transactions WHERE user_id = ? ORDER BY transaction_date DESC, id DESC')
    .all(USER_ID);
  const trades = db
    .prepare('SELECT * FROM trades WHERE user_id = ? ORDER BY trade_date DESC, id DESC')
    .all(USER_ID);
  const priceRows = db.prepare('SELECT ticker, price, updated_at FROM current_prices').all();

  const currentPrices = {};
  const priceMeta = {};
  for (const row of priceRows) {
    currentPrices[row.ticker] = row.price;
    priceMeta[row.ticker] = row.updated_at;
  }

  const cash = calc.cashBalance(user, transactions, trades);
  const holdings = calc.holdingsByTicker(trades);
  const valued = calc.valuedHoldings(holdings, currentPrices);
  const portfolio_value = calc.portfolioValue(valued);
  const net_worth_total = calc.netWorth(cash, valued);

  let income_total = 0;
  let expense_total = 0;
  const categoryTotals = {};
  for (const t of transactions) {
    if (t.type === 'INCOME') income_total += t.amount;
    else if (t.type === 'EXPENSE') {
      expense_total += t.amount;
      categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
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
    price_updated_at: priceMeta[ticker] || null,
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
    any_priced && total_cost_held > 0 ? total_return / total_cost_held : null;

  res.json({
    user: { id: user.id, starting_cash_balance: user.starting_cash_balance },
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
});

module.exports = router;
