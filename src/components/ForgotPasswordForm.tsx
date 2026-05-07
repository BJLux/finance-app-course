'use client';

import { useFormStatus } from 'react-dom';
import { requestPasswordReset } from '@/app/auth/actions';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-gray-800 disabled:opacity-50"
    >
      {pending ? 'Sending…' : 'Send reset link'}
    </button>
  );
}

export default function ForgotPasswordForm() {
  return (
    <form action={requestPasswordReset} className="space-y-4">
      <label className="block text-sm">
        <span className="mb-1 block font-medium text-gray-700">Email</span>
        <input
          type="email"
          name="email"
          required
          autoComplete="email"
          className="input"
          placeholder="you@example.com"
        />
      </label>
      <SubmitButton />
    </form>
  );
}
