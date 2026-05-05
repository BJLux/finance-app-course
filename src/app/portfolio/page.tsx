import { db, USER_ID, type Trade } from '@/lib/db';
import { holdingsByTicker, valuedHoldings } from '@/lib/calculations';
import AddTradeForm from '@/components/AddTradeForm';
import AddPriceForm from '@/components/AddPriceForm';
import { fmtMoney, fmtPct, fmtShares, fmtSignedMoney } from '@/lib/format';

export const dynamic = 'force-dynamic';

export default function PortfolioPage() {
  const trades = db
    .prepare('SELECT * FROM trades WHERE user_id = ? ORDER BY trade_date DESC, id DESC')
    .all(USER_ID) as Trade[];
  const priceRows = db
    .prepare('SELECT ticker, price, updated_at FROM current_prices')
    .all() as { ticker: string; price: number; updated_at: string }[];

  const currentPrices: Record<string, number> = {};
  const priceMeta: Record<string, string> = {};
  for (const row of priceRows) {
    currentPrices[row.ticker] = row.price;
    priceMeta[row.ticker] = row.updated_at;
  }

  const holdings = holdingsByTicker(trades);
  const valued = valuedHoldings(holdings, currentPrices);
  const tickers = Object.entries(valued);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Portfolio</h1>
        <p className="mt-1 text-sm text-gray-500">
          {tickers.length === 0
            ? 'No holdings yet.'
            : `${tickers.length} ticker${tickers.length === 1 ? '' : 's'}`}
        </p>
      </header>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <section className="card">
          <h2 className="mb-4 text-base font-semibold">Record a trade</h2>
          <AddTradeForm />
        </section>
        <section className="card">
          <h2 className="mb-4 text-base font-semibold">Update current price</h2>
          <AddPriceForm />
        </section>
      </div>

      <section className="card">
        <h2 className="mb-4 text-base font-semibold">Holdings</h2>
        {tickers.length === 0 ? (
          <p className="py-6 text-sm text-gray-400">
            Record a trade above to see your first holding here.
          </p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {tickers.map(([ticker, pos]) => (
              <li
                key={ticker}
                className="flex flex-col gap-1 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <div className="text-sm font-medium">{ticker}</div>
                  <div className="text-xs text-gray-500">
                    {fmtShares(pos.shares)} shares · avg cost {fmtMoney(pos.avg_cost_basis)}
                  </div>
                  {priceMeta[ticker] && (
                    <div className="text-xs text-gray-400">
                      Price set {new Date(priceMeta[ticker]).toLocaleString('en-IE')}
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">
                    {pos.current_value != null
                      ? fmtMoney(pos.current_value)
                      : 'No price set'}
                  </div>
                  {pos.gain != null ? (
                    <div
                      className={`text-xs ${
                        pos.gain >= 0 ? 'text-emerald-700' : 'text-rose-700'
                      }`}
                    >
                      {fmtSignedMoney(pos.gain)}
                      {pos.gain_pct != null && ` (${fmtPct(pos.gain_pct)})`}
                    </div>
                  ) : (
                    <div className="text-xs text-gray-400">
                      Set a current price to see gain/loss
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
