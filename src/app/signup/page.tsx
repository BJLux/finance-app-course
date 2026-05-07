import Link from 'next/link';
import AuthForm from '@/components/AuthForm';
import { signUp } from '@/app/auth/actions';

export const dynamic = 'force-dynamic';

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="mx-auto max-w-sm">
      <div className="card">
        <h1 className="text-xl font-semibold tracking-tight">Create your account</h1>
        <p className="mt-1 text-sm text-gray-500">
          Sign up with email, name, and a password. We&apos;ll email you a confirmation link.
        </p>

        {error && (
          <div className="mt-4 rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {error}
          </div>
        )}

        <div className="mt-6">
          <AuthForm mode="signup" action={signUp} />
        </div>

        <p className="mt-6 text-sm text-gray-500">
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-gray-900 hover:underline">
            Log in
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
