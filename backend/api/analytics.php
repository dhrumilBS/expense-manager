<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../utils/helpers.php';

applyCors();
$db = getDb();
$userId = requireAuth();
if (!methodIs('GET')) sendError('Method not allowed', 405);

$action = $_GET['action'] ?? 'monthly_trend';
$year = (int)($_GET['year'] ?? date('Y'));

switch ($action) {

    case 'monthly_trend': // last 12 months income/expense/net
    case 'cash_flow': {
        $stmt = $db->prepare("SELECT DATE_FORMAT(txn_date,'%Y-%m') ym, type, SUM(amount) total
                              FROM transactions WHERE user_id = ? AND type IN ('income','expense')
                              AND txn_date >= DATE_SUB(CURDATE(), INTERVAL 11 MONTH)
                              GROUP BY ym, type ORDER BY ym ASC");
        $stmt->execute([$userId]);
        $raw = $stmt->fetchAll();
        $months = [];
        for ($i = 11; $i >= 0; $i--) {
            $d = new DateTime('first day of this month');
            $d->modify("-$i month");
            $months[$d->format('Y-m')] = ['month' => $d->format('M Y'), 'income' => 0, 'expense' => 0];
        }
        foreach ($raw as $r) if (isset($months[$r['ym']])) $months[$r['ym']][$r['type']] = (float)$r['total'];
        $result = array_values($months);
        foreach ($result as &$m) $m['net'] = $m['income'] - $m['expense'];
        sendSuccess([$action => $result]);
    }

    case 'expense_by_category': {
        $month = $_GET['month'] ?? null;
        $conds = ["t.user_id = ?", "t.type = 'expense'"];
        $params = [$userId];
        if ($month) { $conds[] = "DATE_FORMAT(t.txn_date,'%Y-%m') = ?"; $params[] = $month; }
        else { $conds[] = 'YEAR(t.txn_date) = ?'; $params[] = $year; }
        $stmt = $db->prepare("SELECT c.name, c.color, SUM(t.amount) total FROM transactions t
                              JOIN categories c ON c.id = t.category_id
                              WHERE " . implode(' AND ', $conds) . " GROUP BY c.id ORDER BY total DESC");
        $stmt->execute($params);
        sendSuccess(['expense_by_category' => $stmt->fetchAll()]);
    }

    case 'expense_by_group': {
        $stmt = $db->prepare("SELECT g.name, g.color, SUM(t.amount) total FROM transactions t
                              JOIN expense_groups g ON g.id = t.expense_group_id
                              WHERE t.user_id = ? AND t.type = 'expense' AND YEAR(t.txn_date) = ?
                              GROUP BY g.id ORDER BY total DESC");
        $stmt->execute([$userId, $year]);
        sendSuccess(['expense_by_group' => $stmt->fetchAll()]);
    }

    case 'budget_vs_actual': {
        $month = (int)($_GET['month'] ?? date('n'));
        $stmt = $db->prepare('SELECT b.id, b.amount budget, c.name category, c.color
                              FROM budgets b LEFT JOIN categories c ON c.id = b.category_id
                              WHERE b.user_id = ? AND b.period_month = ? AND b.period_year = ? AND b.category_id IS NOT NULL');
        $stmt->execute([$userId, $month, $year]);
        $budgets = $stmt->fetchAll();
        foreach ($budgets as &$bud) {
            $s = $db->prepare("SELECT COALESCE(SUM(amount),0) spent FROM transactions
                               WHERE user_id = ? AND type='expense' AND category_id = (SELECT category_id FROM budgets WHERE id = ?)
                               AND YEAR(txn_date) = ? AND MONTH(txn_date) = ?");
            $s->execute([$userId, $bud['id'], $year, $month]);
            $bud['actual'] = (float) $s->fetch()['spent'];
        }
        sendSuccess(['budget_vs_actual' => $budgets]);
    }

    case 'spending_heatmap': {
        $stmt = $db->prepare("SELECT DATE(txn_date) d, SUM(amount) total FROM transactions
                              WHERE user_id = ? AND type = 'expense' AND YEAR(txn_date) = ?
                              GROUP BY d ORDER BY d ASC");
        $stmt->execute([$userId, $year]);
        sendSuccess(['spending_heatmap' => $stmt->fetchAll()]);
    }

    case 'highest_expenses': {
        $limit = min((int)($_GET['limit'] ?? 10), 50);
        $stmt = $db->prepare("SELECT t.txn_date, t.amount, t.description, c.name category, g.name expense_group
                              FROM transactions t
                              LEFT JOIN categories c ON c.id = t.category_id
                              LEFT JOIN expense_groups g ON g.id = t.expense_group_id
                              WHERE t.user_id = ? AND t.type = 'expense'
                              ORDER BY t.amount DESC LIMIT $limit");
        $stmt->execute([$userId]);
        sendSuccess(['highest_expenses' => $stmt->fetchAll()]);
    }

    case 'year_over_year': {
        $prevYear = $year - 1;
        $stmt = $db->prepare("SELECT YEAR(txn_date) yr, MONTH(txn_date) mo, type, SUM(amount) total
                              FROM transactions WHERE user_id = ? AND YEAR(txn_date) IN (?, ?) AND type IN ('income','expense')
                              GROUP BY yr, mo, type");
        $stmt->execute([$userId, $year, $prevYear]);
        $raw = $stmt->fetchAll();
        $months = [];
        for ($m = 1; $m <= 12; $m++) {
            $months[$m] = ['month' => date('M', mktime(0,0,0,$m,1)), "$year" => 0, "$prevYear" => 0];
        }
        foreach ($raw as $r) {
            if ($r['type'] !== 'expense') continue; // YoY comparison focuses on spend; income optionally same pattern
            $months[(int)$r['mo']][(string)$r['yr']] = (float) $r['total'];
        }
        sendSuccess(['year_over_year' => array_values($months), 'years' => [$prevYear, $year]]);
    }

    default:
        sendError('Unknown analytics action.', 404);
}
