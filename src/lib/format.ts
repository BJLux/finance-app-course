const euroFmt = new Intl.NumberFormat('en-IE', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 2,
});

const pctFmt = new Intl.NumberFormat('en-IE', {
  style: 'percent',
  maximumFractionDigits: 2,
});

const dateFmt = new Intl.DateTimeFormat('en-IE', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
});

export function fmtMoney(v: number | null | undefined): string {
  if (v == null || Number.isNaN(v)) return '—';
  return euroFmt.format(v);
}

export function fmtSignedMoney(v: number | null | undefined): string {
  if (v == null || Number.isNaN(v)) return '—';
  return (v >= 0 ? '+' : '') + euroFmt.format(v);
}

export function fmtPct(v: number | null | undefined): string {
  if (v == null || Number.isNaN(v)) return '—';
  return (v >= 0 ? '+' : '') + pctFmt.format(v);
}

export function fmtDate(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso + 'T00:00:00');
  if (Number.isNaN(d.getTime())) return iso;
  return dateFmt.format(d);
}

export function fmtShares(n: number): string {
  return n.toLocaleString('en-IE', { maximumFractionDigits: 6 });
}

export function todayIso(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
