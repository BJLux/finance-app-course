const express = require('express');
const db = require('../db');

const router = express.Router();
const TICKER = /^[A-Z][A-Z0-9.\-]{0,9}$/;

router.post('/', (req, res) => {
  const { ticker, price } = req.body || {};
  const tkr = typeof ticker === 'string' ? ticker.trim().toUpperCase() : '';
  if (!TICKER.test(tkr)) {
    return res.status(400).json({ error: 'ticker must be 1-10 chars, uppercase letters/numbers' });
  }
  const pr = Number(price);
  if (!Number.isFinite(pr) || pr <= 0) {
    return res.status(400).json({ error: 'price must be a positive number' });
  }

  const now = new Date().toISOString();
  db.prepare(
    `INSERT INTO current_prices (ticker, price, updated_at)
     VALUES (?, ?, ?)
     ON CONFLICT(ticker) DO UPDATE SET price = excluded.price, updated_at = excluded.updated_at`,
  ).run(tkr, pr, now);

  res.status(200).json({ ticker: tkr, price: pr, updated_at: now });
});

module.exports = router;
