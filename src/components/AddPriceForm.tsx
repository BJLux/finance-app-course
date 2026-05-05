'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type Props = { initialTicker?: string };

export default function AddPriceForm({ initialTicker = '' }: Props) {
  const router = useRouter();
  const [ticker, setTicker] = useState(initialTicker);
  const [price, setPrice] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await fetch('/api/prices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticker, price: parseFloat(price) }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
      setPrice('');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="mb-1 block text-xs font-medium text-gray-600">Ticker</span>
          <input
            type="text"
            required
            value={ticker}
            onChange={(e) => setTicker(e.target.value.toUpperCase())}
            placeholder="AAPL"
            className="input uppercase"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-xs font-medium text-gray-600">
            Current price (€)
          </span>
          <input
            type="number"
            step="0.01"
            min="0"
            required
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="input"
          />
        </label>
      </div>
      {error && (
        <div className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div>
      )}
      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800 disabled:opacity-50"
      >
        {busy ? 'Saving…' : 'Update price'}
      </button>
    </form>
  );
}
