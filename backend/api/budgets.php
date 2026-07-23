<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../utils/helpers.php';

applyCors();
$db = getDb();
$userId = requireAuth();

if (methodIs('GET')) {
    $month = (int)($_GET['month'] ?? date('n'));
    $year = (int)($_GET['year'] ?? date('Y'));

    $stmt = $db->prepare('SELECT b.*, c.name AS category_name, c.color AS category_color, g.name AS group_name
                          FROM budgets b
                          LEFT JOIN categories c ON c.id = b.category_id
                          LEFT JOIN expense_groups g ON g.id = b.expense_group_id
                          WHERE b.user_id = ? AND b.period_month = ? AND b.period_year = ?');
    $stmt->execute([$userId, $month, $year]);
    $budgets = $stmt->fetchAll();

    // Compute "actual spent" per budget for progress bars.
    foreach ($budgets as &$bud) {
        $conds = ['user_id = ?', "type = 'expense'", 'YEAR(txn_date) = ?', 'MONTH(txn_date) = ?'];
        $params = [$userId, $year, $month];
        if ($bud['category_id']) { $conds[] = 'category_id = ?'; $params[] = $bud['category_id']; }
        if ($bud['expense_group_id']) { $conds[] = 'expense_group_id = ?'; $params[] = $bud['expense_group_id']; }
        $s = $db->prepare('SELECT COALESCE(SUM(amount),0) spent FROM transactions WHERE ' . implode(' AND ', $conds));
        $s->execute($params);
        $bud['spent'] = (float) $s->fetch()['spent'];
    }
    sendSuccess(['budgets' => $budgets]);
}

if (methodIs('POST')) {
    $b = jsonInput();
    $amount = (float)($b['amount'] ?? 0);
    $month = (int)($b['period_month'] ?? date('n'));
    $year = (int)($b['period_year'] ?? date('Y'));
    $categoryId = isset($b['category_id']) ? (int)$b['category_id'] : null;
    $expenseGroupId = isset($b['expense_group_id']) ? (int)$b['expense_group_id'] : null;
    if ($amount <= 0) sendError('Budget amount must be greater than zero.', 422);
    if ($month < 1 || $month > 12) sendError('Invalid month.', 422);
    if (!ownsCategory($db, $userId, $categoryId)) sendError('Category not found.', 404);
    if (!ownsGroup($db, $userId, $expenseGroupId)) sendError('Expense group not found.', 404);

    $stmt = $db->prepare('INSERT INTO budgets (user_id, category_id, expense_group_id, amount, period_month, period_year)
                          VALUES (?,?,?,?,?,?)
                          ON DUPLICATE KEY UPDATE amount = VALUES(amount)');
    $stmt->execute([$userId, $categoryId, $expenseGroupId, $amount, $month, $year]);
    sendSuccess(['id' => (int)$db->lastInsertId()], 201);
}

if (methodIs('DELETE')) {
    $id = (int)($_GET['id'] ?? 0);
    if (!$id) sendError('Budget id is required.', 422);
    $db->prepare('DELETE FROM budgets WHERE id = ? AND user_id = ?')->execute([$id, $userId]);
    sendSuccess(['deleted' => true]);
}

sendError('Method not allowed', 405);
