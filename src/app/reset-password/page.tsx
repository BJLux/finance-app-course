import { redirect } from 'next/navigation';
import ResetPasswordForm from '@/components/ResetPasswordForm';
import { createServerSupabase } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect(
      `/login?error=${encodeURIComponent(
        'Reset link expired or invalid. Please request a new one.',
      )}`,
    );
  }

  const { error } = await searchParams;

  return (
    <div className="mx-auto max-w-sm">
      <div className="card">
        <h1 className="text-xl font-semibold tracking-tight">Choose a new password</h1>
        <p className="mt-1 text-sm text-gray-500">
          Setting a new password for <span className="font-medium">{user.email}</span>.
        </p>

        {error && (
          <div className="mt-4 rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {error}
          </div>
        )}

        <div className="mt-6">
          <ResetPasswordForm />
        </div>
      </div>
    </div>
  );
}
