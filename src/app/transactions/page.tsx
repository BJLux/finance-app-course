import { db, USER_ID, type Transaction } from '@/lib/db';
import AddTransactionForm from '@/components/AddTransactionForm';
import { fmtDate, fmtMoney } from '@/lib/format';

export const dynamic = 'force-dynamic';

export default function TransactionsPage() {
  const transactions = db
    .prepare(
      'SELECT * FROM transactions WHERE user_id = ? ORDER BY transaction_date DESC, id DESC',
    )
    .all(USER_ID) as Transaction[];

  let income = 0;
  let expense = 0;
  for (const t of transactions) {
    if (t.type === 'INCOME') income += t.amount;
    else expense += t.amount;
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Transactions</h1>
        <p className="mt-1 text-sm text-gray-500">
          Income {fmtMoney(income)} · Expense {fmtMoney(expense)}
        </p>
      </header>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <section className="card">
          <h2 className="mb-4 text-base font-semibold">Add income</h2>
          <AddTransactionForm type="INCOME" />
        </section>
        <section className="card">
          <h2 className="mb-4 text-base font-semibold">Add expense</h2>
          <AddTransactionForm type="EXPENSE" />
        </section>
      </div>

      <section className="card">
        <h2 className="mb-4 text-base font-semibold">All transactions</h2>
        {transactions.length === 0 ? (
          <p className="py-6 text-sm text-gray-400">No transactions yet.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {transactions.map((t) => (
              <li key={t.id} className="flex items-center justify-between py-3">
                <div>
                  <div className="text-sm font-medium">{t.category}</div>
                  <div className="text-xs text-gray-500">
                    {fmtDate(t.transaction_date)}
                    {t.note ? ` · ${t.note}` : ''}
                  </div>
                </div>
                <div
                  className={`text-sm font-medium ${
                    t.type === 'INCOME' ? 'text-emerald-700' : 'text-rose-700'
                  }`}
                >
                  {t.type === 'INCOME' ? '+' : '−'} {fmtMoney(t.amount)}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
