const path = require('path');
const express = require('express');
const db = require('./db');
const dashboardRouter = require('./routes/dashboard');
const transactionsRouter = require('./routes/transactions');
const tradesRouter = require('./routes/trades');
const pricesRouter = require('./routes/prices');

const app = express();
const PORT = 3000;

app.use(express.json());

app.get('/api/health', (req, res) => {
  const tables = db
    .prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
    .all()
    .map((row) => row.name);
  res.json({ status: 'ok', tables });
});

app.use('/api/dashboard', dashboardRouter);
app.use('/api/transactions', transactionsRouter);
app.use('/api/trades', tradesRouter);
app.use('/api/prices', pricesRouter);

app.use(express.static(path.join(__dirname, '..', 'public')));

app.listen(PORT, () => {
  console.log(`OmniWealth server listening on http://localhost:${PORT}`);
});
