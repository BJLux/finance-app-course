'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { todayIso } from '@/lib/format';

type Props = { type: 'INCOME' | 'EXPENSE' };

export default function AddTransactionForm({ type }: Props) {
  const router = useRouter();
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState(todayIso());
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          amount: parseFloat(amount),
          category,
          date,
          note: note || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
      setAmount('');
      setCategory('');
      setNote('');
      setDate(todayIso());
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setBusy(false);
    }
  }

  const label = type === 'INCOME' ? 'Add income' : 'Add expense';
  const accent =
    type === 'INCOME'
      ? 'bg-emerald-600 hover:bg-emerald-700'
      : 'bg-rose-600 hover:bg-rose-700';

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Amount (€)">
          <input
            type="number"
            step="0.01"
            min="0"
            required
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="input"
          />
        </Field>
        <Field label="Category">
          <input
            type="text"
            required
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder={type === 'INCOME' ? 'Salary' : 'Food'}
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
        <Field label="Note (optional)">
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
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
        className={`w-full rounded-md px-4 py-2 text-sm font-medium text-white transition-colors disabled:opacity-50 ${accent}`}
      >
        {busy ? 'Saving…' : label}
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
