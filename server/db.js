const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'finance.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY,
    starting_cash_balance REAL NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id),
    type TEXT NOT NULL CHECK (type IN ('INCOME','EXPENSE')),
    amount REAL NOT NULL CHECK (amount > 0),
    category TEXT NOT NULL,
    transaction_date TEXT NOT NULL,
    note TEXT
  );

  CREATE TABLE IF NOT EXISTS trades (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id),
    ticker TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('BUY','SELL')),
    shares REAL NOT NULL CHECK (shares > 0),
    price_per_share REAL NOT NULL CHECK (price_per_share > 0),
    trade_date TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS current_prices (
    ticker TEXT PRIMARY KEY,
    price REAL NOT NULL,
    updated_at TEXT NOT NULL
  );
`);

const userExists = db.prepare('SELECT id FROM users WHERE id = 1').get();
if (!userExists) {
  db.prepare('INSERT INTO users (id, starting_cash_balance) VALUES (1, 0)').run();
}

module.exports = db;
