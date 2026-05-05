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

function createDb() {
  const dataDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

  const db = new Database(path.join(dataDir, 'finance.db'));
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

  return db;
}

// Reuse a single connection across hot reloads in dev.
const globalForDb = globalThis as unknown as { __financeDb?: Database.Database };
export const db: Database.Database = globalForDb.__financeDb ?? createDb();
if (process.env.NODE_ENV !== 'production') globalForDb.__financeDb = db;

export const USER_ID = 1; // single-user prototype, same convention as the old Express version
