import Link from 'next/link';

const links = [
  { href: '/', label: 'Dashboard' },
  { href: '/transactions', label: 'Transactions' },
  { href: '/portfolio', label: 'Portfolio' },
];

export default function Nav() {
  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          OmniWealth
        </Link>
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
      </div>
    </header>
  );
}
