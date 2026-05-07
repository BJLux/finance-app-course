import { createServerSupabase } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from('profiles').select('id', { count: 'exact', head: true });

  return Response.json({
    status: error ? 'error' : 'ok',
    db_error: error?.message ?? null,
    authenticated: !!user,
    user_email: user?.email ?? null,
  });
}
