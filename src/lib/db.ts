import 'server-only';
import path from 'node:path';
import fs from 'node:fs';
import Database from 'better-sqlite3';

export type User = {
  id: number;
  starting_cash_balance: number;
};

export type Transaction = {
  id: number;
  user_id: number;
  type: 'INCOME' | 'EXPENSE';
  amount: number;
  category: string;
  transaction_date: string;
  note: string | null;
};

export type Trade = {
  id: number;
  user_id: number;
  ticker: string;
  type: 'BUY' | 'SELL';
  shares: number;
  price_per_share: number;
  trade_date: string;
};

export type CurrentPrice = {
  ticker: string;
  price: number;
  updated_at: string;
};

// Vercel sets VERCEL=1 automatically. Its filesystem is read-only, so we run
// the DB in memory there — data resets on each cold start. Local dev keeps
// using the file at data/finance.db so your work persists.
const IS_DEMO = process.env.VERCEL === '1';

function createDb() {
  let db: Database.Database;

  if (IS_DEMO) {
    db = new Database(':memory:');
  } else {
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
    db = new Database(path.join(dataDir, 'finance.db'));
    db.pragma('journal_mode = WAL');
  }
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
    db.prepare('INSERT INTO users (id, starting_cash_balance) VALUES (1, ?)').run(
      IS_DEMO ? 5000 : 0,
    );
  }

  if (IS_DEMO) seedDemoData(db);

  return db;
}

function seedDemoData(db: Database.Database) {
  const insertTx = db.prepare(
    `INSERT INTO transactions (user_id, type, amount, category, transaction_date, note)
     VALUES (1, ?, ?, ?, ?, ?)`,
  );
  const txRows: Array<['INCOME' | 'EXPENSE', number, string, string, string | null]> = [
    ['INCOME', 3200, 'Salary', '2026-04-01', 'April salary'],
    ['EXPENSE', 950, 'Rent', '2026-04-03', null],
    ['EXPENSE', 180, 'Groceries', '2026-04-08', null],
    ['INCOME', 250, 'Freelance', '2026-04-15', 'Side project'],
    ['EXPENSE', 60, 'Restaurants', '2026-04-22', 'Dinner out'],
    ['INCOME', 3200, 'Salary', '2026-05-01', 'May salary'],
  ];
  for (const row of txRows) insertTx.run(...row);

  const insertTrade = db.prepare(
    `INSERT INTO trades (user_id, ticker, type, shares, price_per_share, trade_date)
     VALUES (1, ?, ?, ?, ?, ?)`,
  );
  const tradeRows: Array<[string, 'BUY' | 'SELL', number, number, string]> = [
    ['AAPL', 'BUY', 10, 175.5, '2026-02-10'],
    ['MSFT', 'BUY', 5, 410.2, '2026-02-20'],
    ['VOO', 'BUY', 8, 495.0, '2026-03-05'],
    ['AAPL', 'SELL', 3, 188.0, '2026-04-12'],
  ];
  for (const row of tradeRows) insertTrade.run(...row);

  const insertPrice = db.prepare(
    `INSERT INTO current_prices (ticker, price, updated_at) VALUES (?, ?, ?)`,
  );
  const now = new Date().toISOString();
  insertPrice.run('AAPL', 192.4, now);
  insertPrice.run('MSFT', 425.0, now);
  insertPrice.run('VOO', 510.75, now);
}

// Reuse a single connection across hot reloads in dev.
const globalForDb = globalThis as unknown as { __financeDb?: Database.Database };
export const db: Database.Database = globalForDb.__financeDb ?? createDb();
if (process.env.NODE_ENV !== 'production') globalForDb.__financeDb = db;

export const USER_ID = 1; // single-user prototype, same convention as the old Express version
