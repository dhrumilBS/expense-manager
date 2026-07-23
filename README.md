# Ledger — Personal Expense Manager

A full-stack personal expense manager: **React + TypeScript** frontend and a **PHP + MySQL** backend with JWT authentication. Tracks income, expenses, transfers between accounts, expense groups, budgets, reports, and analytics.

```
expense-manager/
├── backend/     PHP REST API + MySQL schema
└── frontend/    React + Vite + TypeScript + Tailwind
```

This has been tested end-to-end (register → transactions → balances → dashboard) on PHP 8.3 + MariaDB during development.

---

## 1. Run it locally

### Requirements
- PHP 8.0+ with the `pdo_mysql` extension (comes with XAMPP/Laragon/MAMP)
- MySQL or MariaDB
- Node.js 18+

### Backend
1. Install **XAMPP** (Windows/Mac/Linux) or **Laragon** (Windows).
2. Copy the `backend/` folder into your server's web root, e.g.:
   - XAMPP: `C:\xampp\htdocs\expense-manager\backend`
   - Laragon: `C:\laragon\www\expense-manager\backend`
3. Start Apache + MySQL from the XAMPP/Laragon control panel.
4. Open **phpMyAdmin**, create a database named `expense_manager`, and import `backend/database.sql`.
5. Open `backend/config/config.php` and set your DB credentials (XAMPP default is user `root`, empty password):
   ```php
   define('DB_USER', getenv('DB_USER') ?: 'root');
   define('DB_PASS', getenv('DB_PASS') ?: '');
   ```
   Also change `JWT_SECRET` to a random string — generate one with:
   ```
   php -r "echo bin2hex(random_bytes(32));"
   ```
6. Confirm the API responds: visit `http://localhost/expense-manager/backend/api/accounts.php` — you should see a JSON `401 Unauthorized` (expected, since you're not logged in yet — this confirms PHP + DB are wired up).

### Frontend
1. `cd frontend`
2. `cp .env.example .env` and confirm it points at your backend:
   ```
   VITE_API_URL=http://localhost/expense-manager/backend/api
   ```
3. `npm install`
4. `npm run dev` → open `http://localhost:5173`
5. Register a new account. Starter expense groups, categories, and accounts are created for you automatically.

---

## 2. Deploy for free (live hosting)

### Backend — free PHP + MySQL hosting
Any shared host that gives you PHP + MySQL works (no special extensions needed beyond `pdo_mysql`, `fileinfo`, `mbstring`, all standard). Free options to consider: **InfinityFree**, **000webhost**, or a low-cost VPS. Steps are the same everywhere:
1. Create a MySQL database in your host's control panel (cPanel/Vista panel) and import `backend/database.sql` via phpMyAdmin.
2. Upload the contents of `backend/` to your host (FTP or the file manager) — typically into a subdomain or subfolder, e.g. `api.yourdomain.com` or `yourdomain.com/api`.
3. Edit `backend/config/config.php` with the DB credentials your host gives you, and set a strong `JWT_SECRET`.
4. In the same file, add your live frontend URL to `ALLOWED_ORIGINS`:
   ```php
   define('ALLOWED_ORIGINS', [
       'http://localhost:5173',
       'https://your-frontend.vercel.app',
   ]);
   ```
5. Set `APP_ENV` to `production` (default) so PHP errors aren't exposed publicly.

> Tip: some free hosts disable outbound function calls like `move_uploaded_file` in certain folders — if receipt uploads fail, check the host's file-permission docs for the `uploads/` directory (should be writable, e.g. `chmod 755`).

### Frontend — free static hosting
Deploy `frontend/` to **Vercel**, **Netlify**, or **Cloudflare Pages** (all have generous free tiers for static/Vite sites):
1. Push this project to a GitHub repo.
2. Import it in Vercel/Netlify, set the project root to `frontend/`.
3. Build command: `npm run build` — Output directory: `dist`
4. Add an environment variable `VITE_API_URL` pointing to your live backend, e.g. `https://api.yourdomain.com/api`.
5. Deploy. Then add that live frontend URL back into the backend's `ALLOWED_ORIGINS` (step above) and redeploy the backend.

---

## 3. Security notes (already built in)

- Passwords hashed with bcrypt (`password_hash`/`password_verify`), never stored in plain text.
- Stateless JWT auth (HS256), 4-hour access tokens; every API endpoint except register/login/receipt-view requires a valid `Authorization: Bearer <token>` header.
- All database queries use PDO **prepared statements** — no string-concatenated SQL anywhere, so it's not vulnerable to SQL injection.
- CORS is locked to an explicit allow-list (`ALLOWED_ORIGINS`), not `*`.
- Receipt uploads are validated by real MIME type (not just file extension), capped at 5MB, renamed to random unguessable filenames, and stored in a folder where PHP execution is disabled via `.htaccess` — so an uploaded file can never be run as a script.
- `/config` and any `.sql`/`.md` file are blocked from direct HTTP access via `.htaccess`.
- Every table is scoped by `user_id` and every query filters on it — one user can never read or modify another user's data.

**Before going live**, make sure to:
- Change `JWT_SECRET` in `config.php` to a long random value (never reuse the placeholder).
- Serve the backend over **HTTPS** in production (most free hosts provide free SSL via Let's Encrypt/Cloudflare — enable it).
- Consider adding a login rate-limiter if you expect public signups (a simple `failed_attempts` table keyed by IP + email is a good next step).

---

## 4. What's implemented

**Core:** Dashboard, Income/Expense entry, Money Transfer, Expense Groups, Categories, Accounts (with live balances), Budgets (overall/category/group, monthly), Reports (full filtering + CSV/Excel/PDF export), Analytics (monthly trend, cash flow, category & group breakdowns, budget vs actual, spending heatmap, highest expenses, year-over-year), Settings.

**Roadmap (not yet built, shown in-app under Settings):** Recurring Transactions, Subscription Tracker, EMI Tracker, Loan Tracker, Savings Goals, Split Expenses, Bill Reminders, OCR Receipt Scanner, Dark Mode, Multi-Currency, Cloud Backup, PWA Support, Multi-User Support.

## 5. Tech stack

- **Frontend:** React 18 + TypeScript, Tailwind CSS, Recharts, React Hook Form + Zod, Zustand, Lucide icons, jsPDF (client-side PDF export)
- **Backend:** PHP 8 (no framework, no Composer dependency — runs on any shared host), MySQL/MariaDB, hand-rolled HS256 JWT
