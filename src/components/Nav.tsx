import Link from 'next/link';
import { createServerSupabase } from '@/lib/supabase/server';
import SignOutButton from './SignOutButton';

const links = [
  { href: '/', label: 'Dashboard' },
  { href: '/transactions', label: 'Transactions' },
  { href: '/portfolio', label: 'Portfolio' },
];

export default async function Nav() {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let name: string | null = null;
  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('name')
      .eq('id', user.id)
      .single();
    name = data?.name ?? user.email ?? null;
  }

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          OmniWealth
        </Link>

        {user ? (
          <div className="flex items-center gap-6">
            <nav className="flex gap-6 text-sm text-gray-600">
              {links.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="hover:text-gray-900 transition-colors"
                >
                  {l.label}
                </Link>
              ))}
            </nav>
            <div className="flex items-center gap-3 border-l border-gray-200 pl-6">
              {name && <span className="text-sm text-gray-500">{name}</span>}
              <SignOutButton />
            </div>
          </div>
        ) : (
          <nav className="flex gap-4 text-sm">
            <Link href="/login" className="text-gray-600 hover:text-gray-900">
              Log in
            </Link>
            <Link
              href="/signup"
              className="rounded-md bg-gray-900 px-3 py-1.5 text-white hover:bg-gray-800"
            >
              Sign up
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
}
