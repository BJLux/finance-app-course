'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { todayIso } from '@/lib/format';

export default function AddTradeForm() {
  const router = useRouter();
  const [ticker, setTicker] = useState('');
  const [type, setType] = useState<'BUY' | 'SELL'>('BUY');
  const [shares, setShares] = useState('');
  const [price, setPrice] = useState('');
  const [date, setDate] = useState(todayIso());
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await fetch('/api/trades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticker,
          type,
          shares: parseFloat(shares),
          price: parseFloat(price),
          date,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
      setTicker('');
      setShares('');
      setPrice('');
      setDate(todayIso());
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
        <Field label="Ticker">
          <input
            type="text"
            required
            value={ticker}
            onChange={(e) => setTicker(e.target.value.toUpperCase())}
            placeholder="AAPL"
            className="input uppercase"
          />
        </Field>
        <Field label="Buy or Sell">
          <select
            value={type}
            onChange={(e) => setType(e.target.value as 'BUY' | 'SELL')}
            className="input"
          >
            <option value="BUY">Buy</option>
            <option value="SELL">Sell</option>
          </select>
        </Field>
        <Field label="Shares">
          <input
            type="number"
            step="0.000001"
            min="0"
            required
            value={shares}
            onChange={(e) => setShares(e.target.value)}
            className="input"
          />
        </Field>
        <Field label="Price per share (€)">
          <input
            type="number"
            step="0.01"
            min="0"
            required
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="input"
          />
        </Field>
        <Field label="Date">
          <input
            type="date"
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="input"
          />
        </Field>
      </div>
      {error && (
        <div className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div>
      )}
      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800 disabled:opacity-50"
      >
        {busy ? 'Saving…' : 'Record trade'}
      </button>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block text-xs font-medium text-gray-600">{label}</span>
      {children}
    </label>
  );
}
