const express = require('express');
const db = require('../db');

const router = express.Router();
const USER_ID = 1;

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

router.post('/', (req, res) => {
  const { type, amount, category, date, note } = req.body || {};

  if (type !== 'INCOME' && type !== 'EXPENSE') {
    return res.status(400).json({ error: "type must be 'INCOME' or 'EXPENSE'" });
  }
  const amt = Number(amount);
  if (!Number.isFinite(amt) || amt <= 0) {
    return res.status(400).json({ error: 'amount must be a positive number' });
  }
  if (typeof category !== 'string' || category.trim() === '') {
    return res.status(400).json({ error: 'category is required' });
  }
  if (typeof date !== 'string' || !ISO_DATE.test(date)) {
    return res.status(400).json({ error: 'date must be in YYYY-MM-DD format' });
  }

  const result = db
    .prepare(
      `INSERT INTO transactions (user_id, type, amount, category, transaction_date, note)
       VALUES (?, ?, ?, ?, ?, ?)`,
    )
    .run(USER_ID, type, amt, category.trim(), date, note ? String(note) : null);

  const row = db.prepare('SELECT * FROM transactions WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(row);
});

module.exports = router;
