'use client';

import { useFormStatus } from 'react-dom';

type Props = {
  mode: 'signup' | 'login';
  action: (formData: FormData) => void | Promise<void>;
  next?: string;
};

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-gray-800 disabled:opacity-50"
    >
      {pending ? 'Working…' : label}
    </button>
  );
}

export default function AuthForm({ mode, action, next }: Props) {
  const isSignup = mode === 'signup';
  return (
    <form action={action} className="space-y-4">
      {!isSignup && next && <input type="hidden" name="next" value={next} />}
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
      {isSignup && (
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-gray-700">Name</span>
          <input
            type="text"
            name="name"
            required
            autoComplete="name"
            className="input"
            placeholder="Your name"
          />
        </label>
      )}
      <label className="block text-sm">
        <span className="mb-1 block font-medium text-gray-700">Password</span>
        <input
          type="password"
          name="password"
          required
          minLength={6}
          autoComplete={isSignup ? 'new-password' : 'current-password'}
          className="input"
          placeholder={isSignup ? 'At least 6 characters' : ''}
        />
      </label>
      <SubmitButton label={isSignup ? 'Create account' : 'Log in'} />
    </form>
  );
}
