import { db } from '@/lib/db';

const TICKER = /^[A-Z][A-Z0-9.\-]{0,9}$/;

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'invalid JSON body' }, { status: 400 });
  }
  const { ticker, price } = (body ?? {}) as { ticker?: unknown; price?: unknown };

  const tkr = typeof ticker === 'string' ? ticker.trim().toUpperCase() : '';
  if (!TICKER.test(tkr)) {
    return Response.json(
      { error: 'ticker must be 1-10 chars, uppercase letters/numbers' },
      { status: 400 },
    );
  }
  const pr = Number(price);
  if (!Number.isFinite(pr) || pr <= 0) {
    return Response.json({ error: 'price must be a positive number' }, { status: 400 });
  }

  const now = new Date().toISOString();
  db.prepare(
    `INSERT INTO current_prices (ticker, price, updated_at)
     VALUES (?, ?, ?)
     ON CONFLICT(ticker) DO UPDATE SET price = excluded.price, updated_at = excluded.updated_at`,
  ).run(tkr, pr, now);

  return Response.json({ ticker: tkr, price: pr, updated_at: now });
}
