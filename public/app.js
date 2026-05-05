const euro = new Intl.NumberFormat('en-IE', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 2,
});
const pct = new Intl.NumberFormat('en-IE', {
  style: 'percent',
  maximumFractionDigits: 2,
});
const dateFmt = new Intl.DateTimeFormat('en-IE', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
});

function fmtMoney(v) {
  if (v == null || Number.isNaN(v)) return '—';
  return euro.format(v);
}
function fmtPct(v) {
  if (v == null || Number.isNaN(v)) return '—';
  return (v >= 0 ? '+' : '') + pct.format(v);
}
function fmtSignedMoney(v) {
  if (v == null || Number.isNaN(v)) return '—';
  return (v >= 0 ? '+' : '') + euro.format(v);
}
function fmtDate(iso) {
  if (!iso) return '';
  const d = new Date(iso + 'T00:00:00');
  if (Number.isNaN(d.getTime())) return iso;
  return dateFmt.format(d);
}
function fmtShares(n) {
  return Number(n).toLocaleString('en-IE', { maximumFractionDigits: 6 });
}
function todayIso() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

async function fetchDashboard() {
  const res = await fetch('/api/dashboard');
  if (!res.ok) throw new Error('Failed to load dashboard');
  return res.json();
}

function renderDashboard(d) {
  document.getElementById('netWorth').textContent = fmtMoney(d.net_worth.total);
  document.getElementById('cashBalance').textContent = fmtMoney(d.cash_flow.cash_balance);
  document.getElementById('portfolioValue').textContent = fmtMoney(d.portfolio.total_value);

  const trEl = document.getElementById('totalReturn');
  const trRow = document.getElementById('totalReturnRow');
  if (d.portfolio.total_return != null) {
    trRow.classList.remove('hidden');
    const sign = d.portfolio.total_return >= 0 ? 'positive' : 'negative';
    trEl.className = sign;
    trEl.textContent =
      fmtSignedMoney(d.portfolio.total_return) +
      (d.portfolio.total_return_pct != null
        ? ` (${fmtPct(d.portfolio.total_return_pct)})`
        : '');
  } else {
    trRow.classList.add('hidden');
  }

  renderHoldings(d.portfolio.holdings);
  renderTransactions(d.cash_flow.recent_transactions);
  renderCategories(d.cash_flow.top_categories);

  const meta = document.getElementById('portfolioMeta');
  meta.textContent = d.portfolio.holdings.length
    ? `${d.portfolio.holdings.length} ticker${d.portfolio.holdings.length === 1 ? '' : 's'}`
    : '';
  const tmeta = document.getElementById('transactionsMeta');
  tmeta.textContent = `Income ${fmtMoney(d.cash_flow.income_total)} · Expense ${fmtMoney(d.cash_flow.expense_total)}`;
}

function renderHoldings(holdings) {
  const el = document.getElementById('holdingsArea');
  if (!holdings.length) {
    el.innerHTML = '<div class="empty">No holdings yet. Tap + and add a Trade.</div>';
    return;
  }
  el.innerHTML = holdings
    .map((h) => {
      const valueLine =
        h.current_value != null
          ? `<div class="value">${fmtMoney(h.current_value)}</div>`
          : '<div class="no-price">No price set</div>';
      const gainLine =
        h.gain != null
          ? `<div class="gain ${h.gain >= 0 ? 'positive' : 'negative'}">${fmtSignedMoney(h.gain)}${
              h.gain_pct != null ? ` (${fmtPct(h.gain_pct)})` : ''
            }</div>`
          : `<div class="gain"><button class="link-btn" data-set-price="${h.ticker}">Set current price</button></div>`;
      return `
        <div class="holding">
          <div>
            <div class="ticker">${h.ticker}</div>
            <div class="shares">${fmtShares(h.shares)} shares · avg cost ${fmtMoney(h.avg_cost_basis)}</div>
          </div>
          ${valueLine}
          <div></div>
          ${gainLine}
        </div>
      `;
    })
    .join('');

  el.querySelectorAll('[data-set-price]').forEach((btn) => {
    btn.addEventListener('click', () => {
      openModal('price');
      document.querySelector('#formPrice [name=ticker]').value = btn.dataset.setPrice;
    });
  });
}

function renderTransactions(rows) {
  const el = document.getElementById('transactionsArea');
  if (!rows.length) {
    el.innerHTML = '<div class="empty">No transactions yet. Tap + to add one.</div>';
    return;
  }
  el.innerHTML = rows
    .map((t) => {
      const sign = t.type === 'INCOME' ? '+' : '−';
      const cls = t.type === 'INCOME' ? 'positive' : 'negative';
      return `
        <div class="row">
          <div class="row-main">
            <div class="row-title">${escapeHtml(t.category)}</div>
            <div class="row-sub">${fmtDate(t.transaction_date)}${t.note ? ' · ' + escapeHtml(t.note) : ''}</div>
          </div>
          <div class="row-amount ${cls}">${sign} ${fmtMoney(t.amount)}</div>
        </div>
      `;
    })
    .join('');
}

function renderCategories(cats) {
  const el = document.getElementById('categoriesArea');
  if (!cats.length) {
    el.innerHTML = '<div class="empty">No expenses yet.</div>';
    return;
  }
  el.innerHTML = cats
    .map(
      (c) => `
      <div class="row">
        <div class="row-title">${escapeHtml(c.category)}</div>
        <div class="row-amount">${fmtMoney(c.total)}</div>
      </div>
    `,
    )
    .join('');
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const overlay = document.getElementById('modalOverlay');
const errorBox = document.getElementById('formError');

function openModal(tabName = 'income') {
  overlay.classList.remove('hidden');
  overlay.setAttribute('aria-hidden', 'false');
  switchTab(tabName);
  errorBox.classList.add('hidden');
  document.querySelectorAll('input[name=date]').forEach((i) => {
    if (!i.value) i.value = todayIso();
  });
}
function closeModal() {
  overlay.classList.add('hidden');
  overlay.setAttribute('aria-hidden', 'true');
  errorBox.classList.add('hidden');
}
function switchTab(name) {
  document.querySelectorAll('.tab').forEach((t) => {
    t.classList.toggle('active', t.dataset.tab === name);
  });
  document.querySelectorAll('.tab-pane').forEach((p) => {
    p.classList.toggle('active', p.dataset.pane === name);
  });
  errorBox.classList.add('hidden');
}

document.getElementById('quickAddBtn').addEventListener('click', () => openModal('income'));
document.getElementById('modalClose').addEventListener('click', closeModal);
overlay.addEventListener('click', (e) => {
  if (e.target === overlay) closeModal();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !overlay.classList.contains('hidden')) closeModal();
});
document.querySelectorAll('.tab').forEach((t) => {
  t.addEventListener('click', () => switchTab(t.dataset.tab));
});

function showError(msg) {
  errorBox.textContent = msg;
  errorBox.classList.remove('hidden');
}

async function postJson(url, body) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

async function handleSubmit(form, buildPayload, url) {
  const submitBtn = form.querySelector('button[type=submit]');
  submitBtn.disabled = true;
  errorBox.classList.add('hidden');
  try {
    const payload = buildPayload(new FormData(form));
    await postJson(url, payload);
    form.reset();
    closeModal();
    await refresh();
  } catch (err) {
    showError(err.message);
  } finally {
    submitBtn.disabled = false;
  }
}

document.getElementById('formIncome').addEventListener('submit', (e) => {
  e.preventDefault();
  handleSubmit(e.target, (fd) => ({
    type: 'INCOME',
    amount: parseFloat(fd.get('amount')),
    category: fd.get('category'),
    date: fd.get('date'),
    note: fd.get('note') || undefined,
  }), '/api/transactions');
});

document.getElementById('formExpense').addEventListener('submit', (e) => {
  e.preventDefault();
  handleSubmit(e.target, (fd) => ({
    type: 'EXPENSE',
    amount: parseFloat(fd.get('amount')),
    category: fd.get('category'),
    date: fd.get('date'),
    note: fd.get('note') || undefined,
  }), '/api/transactions');
});

document.getElementById('formTrade').addEventListener('submit', (e) => {
  e.preventDefault();
  handleSubmit(e.target, (fd) => ({
    ticker: fd.get('ticker'),
    type: fd.get('type'),
    shares: parseFloat(fd.get('shares')),
    price: parseFloat(fd.get('price')),
    date: fd.get('date'),
  }), '/api/trades');
});

document.getElementById('formPrice').addEventListener('submit', (e) => {
  e.preventDefault();
  handleSubmit(e.target, (fd) => ({
    ticker: fd.get('ticker'),
    price: parseFloat(fd.get('price')),
  }), '/api/prices');
});

async function refresh() {
  try {
    const data = await fetchDashboard();
    renderDashboard(data);
  } catch (err) {
    document.getElementById('netWorth').textContent = 'Error';
    console.error(err);
  }
}

refresh();
