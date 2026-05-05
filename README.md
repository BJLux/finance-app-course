# OmniWealth — Prototype

A local web prototype of the OmniWealth personal-finance app: cash flow + investment portfolio + a single net-worth dashboard. Runs entirely on your laptop, no cloud, no signups.

## What's here

- **Backend** — Node.js + Express, with SQLite as the database (a single file at `data/finance.db`).
- **Frontend** — One HTML page with vanilla JavaScript. No build step, no React, no React Native (yet).
- **The math** — All net worth, cash, holdings, and gain/loss calculations match the OmniWealth technical spec, section 3.

This is a prototype: the core idea, calculations, and API contract from the spec, in the simplest runnable shape. The mobile/cloud rebuild comes later.

## What's intentionally left out

- Live stock prices from Finnhub — you enter current prices manually for now.
- Login / multi-user — single user, no auth.
- Postgres — SQLite is identical for this scale and needs zero setup.
- React Native mobile app — comes after the prototype validates the logic.

## Run it

You only need **Node.js 20 or newer** installed. Get it from <https://nodejs.org> if you don't have it.

```sh
npm install      # one time, downloads the dependencies
npm start        # starts the server
```

Then open <http://localhost:3000> in your browser.

To stop the server, return to the terminal and press `Ctrl+C`.

## How to use it

1. **Add some income.** Tap the round `+` button bottom-right → *Income* tab → enter an amount, category (e.g. "Salary"), and date → *Add income*. The dashboard updates immediately.
2. **Add expenses.** Same flow, *Expense* tab.
3. **Record a stock trade.** *Trade* tab → enter ticker (e.g. AAPL), Buy or Sell, number of shares, price per share, date. Cash decreases by `shares × price` for a Buy.
4. **Set a current price.** *Update price* tab → enter ticker and current market price. The portfolio value, gain/loss, and net worth recalculate. (Or click "Set current price" next to a holding that doesn't have one yet.)
5. **Try invalid inputs.** A negative amount or trying to sell more shares than you own gives you a clear red error message inside the modal.

Your data is saved in `data/finance.db`. To start over, stop the server and delete that file — it'll be recreated empty on the next start.

## Project layout

```
finance/
├── package.json
├── README.md
├── server/
│   ├── index.js              # Express app + route wiring
│   ├── db.js                 # SQLite setup + schema
│   ├── calculations.js       # Pure math functions (net worth, holdings, etc.)
│   └── routes/
│       ├── dashboard.js      # GET /api/dashboard
│       ├── transactions.js   # POST /api/transactions
│       ├── trades.js         # POST /api/trades
│       └── prices.js         # POST /api/prices
├── public/
│   ├── index.html
│   ├── styles.css
│   └── app.js
└── data/
    └── finance.db            # auto-created on first run
```

## API endpoints

| Method | Path                  | Body                                                |
|--------|-----------------------|-----------------------------------------------------|
| GET    | `/api/dashboard`      | —                                                   |
| GET    | `/api/health`         | —                                                   |
| POST   | `/api/transactions`   | `{ type, amount, category, date, note }`            |
| POST   | `/api/trades`         | `{ ticker, type, shares, price, date }`             |
| POST   | `/api/prices`         | `{ ticker, price }`                                 |

`type` is `"INCOME" | "EXPENSE"` for transactions and `"BUY" | "SELL"` for trades. `date` is `YYYY-MM-DD`. Amounts and shares must be positive numbers. Selling more shares than owned is rejected.

## Upgrade path to the production spec

Each piece of the prototype maps cleanly to the production architecture:

| Prototype                | Production (per spec)              | Migration effort                    |
|--------------------------|------------------------------------|-------------------------------------|
| SQLite file              | PostgreSQL on Supabase/Neon        | Change DB driver, schema is identical |
| Manual `/api/prices`     | Finnhub `/quote` + Redis cache     | Replace one route, ~30 lines         |
| `USER_ID = 1` constant   | JWT-authenticated `req.user.id`    | Add auth middleware, swap the constant |
| HTML/CSS/JS frontend     | React Native (Expo) app            | Rebuild UI, API stays the same       |
