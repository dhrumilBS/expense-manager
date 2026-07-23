<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../utils/helpers.php';

applyCors();
$db = getDb();
$userId = requireAuth();
if (!methodIs('GET')) sendError('Method not allowed', 405);

$month = (int)($_GET['month'] ?? date('n'));
$year = (int)($_GET['year'] ?? date('Y'));

// --- Current balance across all accounts ---
$stmt = $db->prepare('SELECT COALESCE(SUM(current_balance),0) bal FROM accounts WHERE user_id = ? AND is_archived = 0');
$stmt->execute([$userId]);
$currentBalance = (float) $stmt->fetch()['bal'];

// --- Total income / expense this period ---
$stmt = $db->prepare("SELECT type, COALESCE(SUM(amount),0) total FROM transactions
                      WHERE user_id = ? AND YEAR(txn_date) = ? AND MONTH(txn_date) = ? AND type IN ('income','expense')
                      GROUP BY type");
$stmt->execute([$userId, $year, $month]);
$totals = ['income' => 0.0, 'expense' => 0.0];
foreach ($stmt->fetchAll() as $row) $totals[$row['type']] = (float) $row['total'];
$savings = $totals['income'] - $totals['expense'];

// --- Monthly budget progress (overall budget = category_id IS NULL AND expense_group_id IS NULL) ---
$stmt = $db->prepare('SELECT amount FROM budgets WHERE user_id = ? AND category_id IS NULL AND expense_group_id IS NULL AND period_month = ? AND period_year = ?');
$stmt->execute([$userId, $month, $year]);
$row = $stmt->fetch();
$overallBudget = $row ? (float)$row['amount'] : null;

// --- Recent transactions ---
$stmt = $db->prepare('SELECT t.*, c.name AS category_name, c.color AS category_color, a.name AS account_name, ta.name AS to_account_name
                      FROM transactions t
                      LEFT JOIN categories c ON c.id = t.category_id
                      LEFT JOIN accounts a ON a.id = t.account_id
                      LEFT JOIN accounts ta ON ta.id = t.to_account_id
                      WHERE t.user_id = ? ORDER BY t.txn_date DESC, t.id DESC LIMIT 8');
$stmt->execute([$userId]);
$recent = $stmt->fetchAll();

// --- Top categories (expense) this period ---
$stmt = $db->prepare("SELECT c.name, c.color, SUM(t.amount) total
                      FROM transactions t JOIN categories c ON c.id = t.category_id
                      WHERE t.user_id = ? AND t.type = 'expense' AND YEAR(t.txn_date) = ? AND MONTH(t.txn_date) = ?
                      GROUP BY c.id ORDER BY total DESC LIMIT 5");
$stmt->execute([$userId, $year, $month]);
$topCategories = $stmt->fetchAll();

// --- Spending by expense group this period ---
$stmt = $db->prepare("SELECT g.name, g.color, SUM(t.amount) total
                      FROM transactions t JOIN expense_groups g ON g.id = t.expense_group_id
                      WHERE t.user_id = ? AND t.type = 'expense' AND YEAR(t.txn_date) = ? AND MONTH(t.txn_date) = ?
                      GROUP BY g.id ORDER BY total DESC");
$stmt->execute([$userId, $year, $month]);
$byGroup = $stmt->fetchAll();

// --- Income vs Expense, last 6 months ---
$stmt = $db->prepare("SELECT DATE_FORMAT(txn_date, '%Y-%m') ym, type, SUM(amount) total
                      FROM transactions
                      WHERE user_id = ? AND type IN ('income','expense') AND txn_date >= DATE_SUB(?, INTERVAL 5 MONTH)
                      GROUP BY ym, type ORDER BY ym ASC");
$refDate = sprintf('%04d-%02d-01', $year, $month);
$stmt->execute([$userId, $refDate]);
$trendRaw = $stmt->fetchAll();
$trend = [];
for ($i = 5; $i >= 0; $i--) {
    $d = new DateTime($refDate);
    $d->modify("-$i month");
    $ym = $d->format('Y-m');
    $trend[$ym] = ['month' => $d->format('M Y'), 'income' => 0, 'expense' => 0];
}
foreach ($trendRaw as $r) {
    if (isset($trend[$r['ym']])) $trend[$r['ym']][$r['type']] = (float) $r['total'];
}

sendSuccess([
    'current_balance' => $currentBalance,
    'total_income' => $totals['income'],
    'total_expense' => $totals['expense'],
    'savings' => $savings,
    'overall_budget' => $overallBudget,
    'recent_transactions' => $recent,
    'top_categories' => $topCategories,
    'spending_by_group' => $byGroup,
    'income_vs_expense_trend' => array_values($trend),
    'upcoming_bills' => [], // reserved for the future Recurring/Bill-reminder feature
]);
