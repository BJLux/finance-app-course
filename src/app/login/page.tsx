import Link from 'next/link';
import AuthForm from '@/components/AuthForm';
import { signIn } from '@/app/auth/actions';

export const dynamic = 'force-dynamic';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string; next?: string }>;
}) {
  const { error, message, next } = await searchParams;

  return (
    <div className="mx-auto max-w-sm">
      <div className="card">
        <h1 className="text-xl font-semibold tracking-tight">Log in</h1>
        <p className="mt-1 text-sm text-gray-500">
          Welcome back to OmniWealth.
        </p>

        {message && (
          <div className="mt-4 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
            {message}
          </div>
        )}
        {error && (
          <div className="mt-4 rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {error}
          </div>
        )}

        <div className="mt-6">
          <AuthForm mode="login" action={signIn} next={next} />
        </div>

        <p className="mt-4 text-sm">
          <Link href="/forgot-password" className="text-gray-500 hover:text-gray-900">
            Forgot password?
          </Link>
        </p>

        <p className="mt-6 text-sm text-gray-500">
          New here?{' '}
          <Link href="/signup" className="font-medium text-gray-900 hover:underline">
            Create an account
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
