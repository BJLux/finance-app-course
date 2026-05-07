'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createServerSupabase } from '@/lib/supabase/server';

function getOrigin(headerList: Headers): string {
  const forwardedHost = headerList.get('x-forwarded-host');
  const host = forwardedHost ?? headerList.get('host');
  const proto = headerList.get('x-forwarded-proto') ?? (host?.startsWith('localhost') ? 'http' : 'https');
  return `${proto}://${host}`;
}

export async function signUp(formData: FormData) {
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const name = String(formData.get('name') ?? '').trim();
  const password = String(formData.get('password') ?? '');

  if (!email || !name || !password) {
    redirect(`/signup?error=${encodeURIComponent('Email, name and password are all required.')}`);
  }
  if (password.length < 6) {
    redirect(`/signup?error=${encodeURIComponent('Password must be at least 6 characters.')}`);
  }

  const supabase = await createServerSupabase();
  const origin = getOrigin(await headers());

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name },
      emailRedirectTo: `${origin}/auth/confirm`,
    },
  });

  if (error) {
    redirect(`/signup?error=${encodeURIComponent(error.message)}`);
  }

  redirect(
    `/login?message=${encodeURIComponent(
      'Account created. Check your inbox for a confirmation link, then come back here to log in.',
    )}`,
  );
}

export async function signIn(formData: FormData) {
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const password = String(formData.get('password') ?? '');
  const next = String(formData.get('next') ?? '/') || '/';

  if (!email || !password) {
    redirect(`/login?error=${encodeURIComponent('Email and password are required.')}`);
  }

  const supabase = await createServerSupabase();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath('/', 'layout');
  redirect(next.startsWith('/') ? next : '/');
}

export async function requestPasswordReset(formData: FormData) {
  const email = String(formData.get('email') ?? '').trim().toLowerCase();

  if (!email) {
    redirect(`/forgot-password?error=${encodeURIComponent('Email is required.')}`);
  }

  const supabase = await createServerSupabase();
  const origin = getOrigin(await headers());

  // Don't surface "user not found" — keep the response generic so the form
  // can't be used to enumerate which emails are registered.
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/confirm?next=${encodeURIComponent('/reset-password')}`,
  });

  redirect(
    `/forgot-password?message=${encodeURIComponent(
      'If an account exists for that email, a reset link is on its way.',
    )}`,
  );
}

export async function updatePassword(formData: FormData) {
  const password = String(formData.get('password') ?? '');
  const confirm = String(formData.get('confirm') ?? '');

  if (password.length < 6) {
    redirect(
      `/reset-password?error=${encodeURIComponent('Password must be at least 6 characters.')}`,
    );
  }
  if (password !== confirm) {
    redirect(`/reset-password?error=${encodeURIComponent('Passwords do not match.')}`);
  }

  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect(
      `/login?error=${encodeURIComponent('Reset link expired. Please request a new one.')}`,
    );
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    redirect(`/reset-password?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath('/', 'layout');
  redirect(`/?message=${encodeURIComponent('Password updated.')}`);
}

