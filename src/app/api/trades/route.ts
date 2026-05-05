import { db, USER_ID } from '@/lib/db';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const TICKER = /^[A-Z][A-Z0-9.\-]{0,9}$/;

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'invalid JSON body' }, { status: 400 });
  }
  const { ticker, type, shares, price, date } = (body ?? {}) as {
    ticker?: unknown;
    type?: unknown;
    shares?: unknown;
    price?: unknown;
    date?: unknown;
  };

  const tkr = typeof ticker === 'string' ? ticker.trim().toUpperCase() : '';
  if (!TICKER.test(tkr)) {
    return Response.json(
      { error: 'ticker must be 1-10 chars, uppercase letters/numbers' },
      { status: 400 },
    );
  }
  if (type !== 'BUY' && type !== 'SELL') {
    return Response.json({ error: "type must be 'BUY' or 'SELL'" }, { status: 400 });
  }
  const sh = Number(shares);
  if (!Number.isFinite(sh) || sh <= 0) {
    return Response.json({ error: 'shares must be a positive number' }, { status: 400 });
  }
  const pr = Number(price);
  if (!Number.isFinite(pr) || pr <= 0) {
    return Response.json({ error: 'price must be a positive number' }, { status: 400 });
  }
  if (typeof date !== 'string' || !ISO_DATE.test(date)) {
    return Response.json({ error: 'date must be in YYYY-MM-DD format' }, { status: 400 });
  }

  if (type === 'SELL') {
    const row = db
      .prepare(
        `SELECT
           COALESCE(SUM(CASE WHEN type='BUY' THEN shares ELSE 0 END), 0) -
           COALESCE(SUM(CASE WHEN type='SELL' THEN shares ELSE 0 END), 0) AS shares_owned
         FROM trades WHERE user_id = ? AND ticker = ?`,
      )
      .get(USER_ID, tkr) as { shares_owned: number } | undefined;
    const owned = row?.shares_owned ?? 0;
    if (sh > owned + 1e-9) {
      return Response.json(
        { error: `cannot sell ${sh} shares of ${tkr} — only ${owned} owned` },
        { status: 400 },
      );
    }
  }

  const result = db
    .prepare(
      `INSERT INTO trades (user_id, ticker, type, shares, price_per_share, trade_date)
       VALUES (?, ?, ?, ?, ?, ?)`,
    )
    .run(USER_ID, tkr, type, sh, pr, date);

  const row = db.prepare('SELECT * FROM trades WHERE id = ?').get(result.lastInsertRowid);
  return Response.json(row, { status: 201 });
}
