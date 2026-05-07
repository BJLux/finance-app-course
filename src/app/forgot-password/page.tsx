import Link from 'next/link';
import ForgotPasswordForm from '@/components/ForgotPasswordForm';

export const dynamic = 'force-dynamic';

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const { error, message } = await searchParams;

  return (
    <div className="mx-auto max-w-sm">
      <div className="card">
        <h1 className="text-xl font-semibold tracking-tight">Reset your password</h1>
        <p className="mt-1 text-sm text-gray-500">
          Enter your email and we&apos;ll send you a link to choose a new password.
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
          <ForgotPasswordForm />
        </div>

        <p className="mt-6 text-sm text-gray-500">
          Remembered it?{' '}
          <Link href="/login" className="font-medium text-gray-900 hover:underline">
            Back to log in
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
