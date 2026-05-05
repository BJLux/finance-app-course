import { db, USER_ID } from '@/lib/db';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'invalid JSON body' }, { status: 400 });
  }
  const { type, amount, category, date, note } = (body ?? {}) as {
    type?: unknown;
    amount?: unknown;
    category?: unknown;
    date?: unknown;
    note?: unknown;
  };

  if (type !== 'INCOME' && type !== 'EXPENSE') {
    return Response.json({ error: "type must be 'INCOME' or 'EXPENSE'" }, { status: 400 });
  }
  const amt = Number(amount);
  if (!Number.isFinite(amt) || amt <= 0) {
    return Response.json({ error: 'amount must be a positive number' }, { status: 400 });
  }
  if (typeof category !== 'string' || category.trim() === '') {
    return Response.json({ error: 'category is required' }, { status: 400 });
  }
  if (typeof date !== 'string' || !ISO_DATE.test(date)) {
    return Response.json({ error: 'date must be in YYYY-MM-DD format' }, { status: 400 });
  }

  const result = db
    .prepare(
      `INSERT INTO transactions (user_id, type, amount, category, transaction_date, note)
       VALUES (?, ?, ?, ?, ?, ?)`,
    )
    .run(USER_ID, type, amt, category.trim(), date, note ? String(note) : null);

  const row = db
    .prepare('SELECT * FROM transactions WHERE id = ?')
    .get(result.lastInsertRowid);
  return Response.json(row, { status: 201 });
}
