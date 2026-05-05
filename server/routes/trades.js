const express = require('express');
const db = require('../db');

const router = express.Router();
const USER_ID = 1;

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const TICKER = /^[A-Z][A-Z0-9.\-]{0,9}$/;

router.post('/', (req, res) => {
  const { ticker, type, shares, price, date } = req.body || {};

  const tkr = typeof ticker === 'string' ? ticker.trim().toUpperCase() : '';
  if (!TICKER.test(tkr)) {
    return res.status(400).json({ error: 'ticker must be 1-10 chars, uppercase letters/numbers' });
  }
  if (type !== 'BUY' && type !== 'SELL') {
    return res.status(400).json({ error: "type must be 'BUY' or 'SELL'" });
  }
  const sh = Number(shares);
  if (!Number.isFinite(sh) || sh <= 0) {
    return res.status(400).json({ error: 'shares must be a positive number' });
  }
  const pr = Number(price);
  if (!Number.isFinite(pr) || pr <= 0) {
    return res.status(400).json({ error: 'price must be a positive number' });
  }
  if (typeof date !== 'string' || !ISO_DATE.test(date)) {
    return res.status(400).json({ error: 'date must be in YYYY-MM-DD format' });
  }

  if (type === 'SELL') {
    const row = db
      .prepare(
        `SELECT
           COALESCE(SUM(CASE WHEN type='BUY' THEN shares ELSE 0 END), 0) -
           COALESCE(SUM(CASE WHEN type='SELL' THEN shares ELSE 0 END), 0) AS shares_owned
         FROM trades WHERE user_id = ? AND ticker = ?`,
      )
      .get(USER_ID, tkr);
    const owned = row ? row.shares_owned : 0;
    if (sh > owned + 1e-9) {
      return res.status(400).json({
        error: `cannot sell ${sh} shares of ${tkr} — only ${owned} owned`,
      });
    }
  }

  const result = db
    .prepare(
      `INSERT INTO trades (user_id, ticker, type, shares, price_per_share, trade_date)
       VALUES (?, ?, ?, ?, ?, ?)`,
    )
    .run(USER_ID, tkr, type, sh, pr, date);

  const row = db.prepare('SELECT * FROM trades WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(row);
});

module.exports = router;
