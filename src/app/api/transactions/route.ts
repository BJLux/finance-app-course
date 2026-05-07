import { createServerSupabase } from '@/lib/supabase/server';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export async function POST(request: Request) {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: 'unauthorized' }, { status: 401 });

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

  const { data, error } = await supabase
    .from('transactions')
    .insert({
      user_id: user.id,
      type,
      amount: amt,
      category: category.trim(),
      transaction_date: date,
      note: note ? String(note) : null,
    })
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data, { status: 201 });
}
