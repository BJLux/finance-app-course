import { createServerSupabase } from '@/lib/supabase/server';

const TICKER = /^[A-Z][A-Z0-9.\-]{0,9}$/;

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
  const { error } = await supabase
    .from('current_prices')
    .upsert(
      { user_id: user.id, ticker: tkr, price: pr, updated_at: now },
      { onConflict: 'user_id,ticker' },
    );

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ticker: tkr, price: pr, updated_at: now });
}
