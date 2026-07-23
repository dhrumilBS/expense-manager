<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../utils/helpers.php';

// Note: applyCors() sets Content-Type: application/json, which we override below for file downloads.
applyCors();
$db = getDb();
$userId = requireAuth();
if (!methodIs('GET')) sendError('Method not allowed', 405);

$format = $_GET['format'] ?? 'csv'; // csv | excel (both produce a .csv Excel can open directly)

$where = ['t.user_id = ?'];
$params = [$userId];
if (!empty($_GET['type'])) { $where[] = 't.type = ?'; $params[] = $_GET['type']; }
if (!empty($_GET['expense_group_id'])) { $where[] = 't.expense_group_id = ?'; $params[] = (int)$_GET['expense_group_id']; }
if (!empty($_GET['category_id'])) { $where[] = 't.category_id = ?'; $params[] = (int)$_GET['category_id']; }
if (!empty($_GET['account_id'])) { $where[] = '(t.account_id = ? OR t.to_account_id = ?)'; $params[] = (int)$_GET['account_id']; $params[] = (int)$_GET['account_id']; }
if (!empty($_GET['payment_method'])) { $where[] = 't.payment_method = ?'; $params[] = $_GET['payment_method']; }
if (!empty($_GET['date_from'])) { $where[] = 't.txn_date >= ?'; $params[] = $_GET['date_from'] . ' 00:00:00'; }
if (!empty($_GET['date_to'])) { $where[] = 't.txn_date <= ?'; $params[] = $_GET['date_to'] . ' 23:59:59'; }
if (isset($_GET['amount_min']) && $_GET['amount_min'] !== '') { $where[] = 't.amount >= ?'; $params[] = (float)$_GET['amount_min']; }
if (isset($_GET['amount_max']) && $_GET['amount_max'] !== '') { $where[] = 't.amount <= ?'; $params[] = (float)$_GET['amount_max']; }
if (!empty($_GET['tag'])) { $where[] = 't.tags LIKE ?'; $params[] = '%' . $_GET['tag'] . '%'; }

$sql = "SELECT t.txn_date, t.type, t.amount, g.name AS expense_group, c.name AS category,
               a.name AS account, ta.name AS to_account, t.payment_method, t.description, t.notes, t.tags
        FROM transactions t
        LEFT JOIN expense_groups g ON g.id = t.expense_group_id
        LEFT JOIN categories c ON c.id = t.category_id
        LEFT JOIN accounts a ON a.id = t.account_id
        LEFT JOIN accounts ta ON ta.id = t.to_account_id
        WHERE " . implode(' AND ', $where) . "
        ORDER BY t.txn_date DESC
        LIMIT 5000";
$stmt = $db->prepare($sql);
$stmt->execute($params);
$rows = $stmt->fetchAll();

$filename = 'expense-report-' . date('Y-m-d') . '.csv';
header('Content-Type: text/csv; charset=utf-8');
header('Content-Disposition: attachment; filename="' . $filename . '"');

$out = fopen('php://output', 'w');
fputs($out, "\xEF\xBB\xBF"); // UTF-8 BOM so Excel renders special characters correctly
fputcsv($out, ['Date', 'Type', 'Amount', 'Expense Group', 'Category', 'Account', 'To Account', 'Payment Method', 'Description', 'Notes', 'Tags']);
foreach ($rows as $r) {
    fputcsv($out, [
        $r['txn_date'], $r['type'], $r['amount'], $r['expense_group'], $r['category'],
        $r['account'], $r['to_account'], $r['payment_method'], $r['description'], $r['notes'], $r['tags'],
    ]);
}
fclose($out);
exit;
