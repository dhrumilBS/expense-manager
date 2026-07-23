<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../utils/helpers.php';

applyCors();
$db = getDb();
$userId = requireAuth();

/** Apply (or reverse, with $reverse=true) the balance effect of a transaction row. */
function applyBalanceEffect(PDO $db, array $txn, bool $reverse = false): void
{
    $sign = $reverse ? -1 : 1;
    $amount = (float) $txn['amount'];

    if ($txn['type'] === 'income' && $txn['account_id']) {
        $db->prepare('UPDATE accounts SET current_balance = current_balance + ? WHERE id = ?')
           ->execute([$sign * $amount, $txn['account_id']]);
    } elseif ($txn['type'] === 'expense' && $txn['account_id']) {
        $db->prepare('UPDATE accounts SET current_balance = current_balance - ? WHERE id = ?')
           ->execute([$sign * $amount, $txn['account_id']]);
    } elseif ($txn['type'] === 'transfer') {
        if ($txn['account_id']) {
            $db->prepare('UPDATE accounts SET current_balance = current_balance - ? WHERE id = ?')
               ->execute([$sign * $amount, $txn['account_id']]);
        }
        if ($txn['to_account_id']) {
            $db->prepare('UPDATE accounts SET current_balance = current_balance + ? WHERE id = ?')
               ->execute([$sign * $amount, $txn['to_account_id']]);
        }
    }
}

function ownsAccount(PDO $db, int $userId, ?int $accountId): bool
{
    if (!$accountId) return true;
    $stmt = $db->prepare('SELECT id FROM accounts WHERE id = ? AND user_id = ?');
    $stmt->execute([$accountId, $userId]);
    return (bool) $stmt->fetch();
}

// ---------------------------------------------------------------
// GET: list with filters + pagination
// ---------------------------------------------------------------
if (methodIs('GET')) {
    $where = ['user_id = ?'];
    $params = [$userId];

    if (!empty($_GET['type']) && in_array($_GET['type'], ['income','expense','transfer'], true)) {
        $where[] = 'type = ?'; $params[] = $_GET['type'];
    }
    if (!empty($_GET['expense_group_id'])) { $where[] = 'expense_group_id = ?'; $params[] = (int)$_GET['expense_group_id']; }
    if (!empty($_GET['category_id'])) { $where[] = 'category_id = ?'; $params[] = (int)$_GET['category_id']; }
    if (!empty($_GET['account_id'])) { $where[] = '(account_id = ? OR to_account_id = ?)'; $params[] = (int)$_GET['account_id']; $params[] = (int)$_GET['account_id']; }
    if (!empty($_GET['payment_method'])) { $where[] = 'payment_method = ?'; $params[] = cleanStr($_GET['payment_method'], 60); }
    if (!empty($_GET['date_from'])) { $where[] = 'txn_date >= ?'; $params[] = $_GET['date_from'] . ' 00:00:00'; }
    if (!empty($_GET['date_to'])) { $where[] = 'txn_date <= ?'; $params[] = $_GET['date_to'] . ' 23:59:59'; }
    if (isset($_GET['amount_min']) && $_GET['amount_min'] !== '') { $where[] = 'amount >= ?'; $params[] = (float)$_GET['amount_min']; }
    if (isset($_GET['amount_max']) && $_GET['amount_max'] !== '') { $where[] = 'amount <= ?'; $params[] = (float)$_GET['amount_max']; }
    if (!empty($_GET['tag'])) { $where[] = 'tags LIKE ?'; $params[] = '%' . cleanStr($_GET['tag'], 50) . '%'; }
    if (!empty($_GET['search'])) { $where[] = '(description LIKE ? OR notes LIKE ?)'; $s = '%' . cleanStr($_GET['search'], 100) . '%'; $params[] = $s; $params[] = $s; }

    $limit = min(max((int)($_GET['limit'] ?? 25), 1), 500);
    $page = max((int)($_GET['page'] ?? 1), 1);
    $offset = ($page - 1) * $limit;

    $whereSql = implode(' AND ', $where);

    $countStmt = $db->prepare("SELECT COUNT(*) c FROM transactions WHERE $whereSql");
    $countStmt->execute($params);
    $total = (int) $countStmt->fetch()['c'];

    $sql = "SELECT t.*, c.name AS category_name, c.color AS category_color, c.icon AS category_icon,
                   g.name AS group_name, g.color AS group_color,
                   a.name AS account_name, ta.name AS to_account_name
            FROM transactions t
            LEFT JOIN categories c ON c.id = t.category_id
            LEFT JOIN expense_groups g ON g.id = t.expense_group_id
            LEFT JOIN accounts a ON a.id = t.account_id
            LEFT JOIN accounts ta ON ta.id = t.to_account_id
            WHERE $whereSql
            ORDER BY t.txn_date DESC, t.id DESC
            LIMIT $limit OFFSET $offset";
    $stmt = $db->prepare($sql);
    $stmt->execute($params);

    sendSuccess(['transactions' => $stmt->fetchAll(), 'total' => $total, 'page' => $page, 'limit' => $limit]);
}

// ---------------------------------------------------------------
// POST: create
// ---------------------------------------------------------------
if (methodIs('POST')) {
    $b = jsonInput();
    $type = $b['type'] ?? '';
    if (!in_array($type, ['income','expense','transfer'], true)) sendError('type must be income, expense, or transfer.', 422);

    $amount = (float)($b['amount'] ?? 0);
    if ($amount <= 0) sendError('Amount must be greater than zero.', 422);

    $accountId = isset($b['account_id']) ? (int)$b['account_id'] : null;
    $toAccountId = isset($b['to_account_id']) ? (int)$b['to_account_id'] : null;

    if ($type === 'transfer') {
        if (!$accountId || !$toAccountId) sendError('Transfers require both account_id and to_account_id.', 422);
        if ($accountId === $toAccountId) sendError('Source and destination accounts must be different.', 422);
    } else {
        if (!$accountId) sendError('account_id is required.', 422);
    }
    if (!ownsAccount($db, $userId, $accountId) || !ownsAccount($db, $userId, $toAccountId)) {
        sendError('Account not found.', 404);
    }

    $txnDate = cleanStr($b['txn_date'] ?? null, 30) ?: date('Y-m-d H:i:s');

    $db->beginTransaction();
    try {
        $stmt = $db->prepare('INSERT INTO transactions
            (user_id, type, amount, expense_group_id, category_id, account_id, to_account_id, payment_method, txn_date, description, notes, receipt_path, tags)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)');
        $stmt->execute([
            $userId, $type, $amount,
            $b['expense_group_id'] ?? null, $b['category_id'] ?? null,
            $accountId, $toAccountId,
            cleanStr($b['payment_method'] ?? null, 60), $txnDate,
            cleanStr($b['description'] ?? null, 255), cleanStr($b['notes'] ?? null, 2000),
            cleanStr($b['receipt_path'] ?? null, 255), cleanStr($b['tags'] ?? null, 255),
        ]);
        $id = (int) $db->lastInsertId();
        applyBalanceEffect($db, ['type' => $type, 'amount' => $amount, 'account_id' => $accountId, 'to_account_id' => $toAccountId]);
        $db->commit();
        sendSuccess(['id' => $id], 201);
    } catch (Exception $e) {
        $db->rollBack();
        sendError('Could not save transaction.', 500);
    }
}

// ---------------------------------------------------------------
// PUT: update (reverse old effect, apply new effect)
// ---------------------------------------------------------------
if (methodIs('PUT')) {
    $b = jsonInput();
    $id = (int)($b['id'] ?? 0);
    if (!$id) sendError('Transaction id is required.', 422);

    $stmt = $db->prepare('SELECT * FROM transactions WHERE id = ? AND user_id = ?');
    $stmt->execute([$id, $userId]);
    $old = $stmt->fetch();
    if (!$old) sendError('Transaction not found.', 404);

    $type = $b['type'] ?? $old['type'];
    $amount = isset($b['amount']) ? (float)$b['amount'] : (float)$old['amount'];
    $accountId = array_key_exists('account_id', $b) ? (int)$b['account_id'] : $old['account_id'];
    $toAccountId = array_key_exists('to_account_id', $b) ? (int)$b['to_account_id'] : $old['to_account_id'];
    if ($amount <= 0) sendError('Amount must be greater than zero.', 422);
    if (!ownsAccount($db, $userId, $accountId) || !ownsAccount($db, $userId, $toAccountId)) sendError('Account not found.', 404);

    $db->beginTransaction();
    try {
        applyBalanceEffect($db, $old, true); // reverse old

        $fields = ['type = ?', 'amount = ?', 'account_id = ?', 'to_account_id = ?'];
        $params = [$type, $amount, $accountId, $toAccountId];
        foreach (['expense_group_id','category_id','payment_method','txn_date','description','notes','receipt_path','tags'] as $f) {
            if (array_key_exists($f, $b)) { $fields[] = "$f = ?"; $params[] = $b[$f]; }
        }
        $params[] = $id; $params[] = $userId;
        $db->prepare('UPDATE transactions SET ' . implode(', ', $fields) . ' WHERE id = ? AND user_id = ?')->execute($params);

        applyBalanceEffect($db, ['type' => $type, 'amount' => $amount, 'account_id' => $accountId, 'to_account_id' => $toAccountId]); // apply new
        $db->commit();
        sendSuccess([]);
    } catch (Exception $e) {
        $db->rollBack();
        sendError('Could not update transaction.', 500);
    }
}

// ---------------------------------------------------------------
// DELETE: reverse balance effect then remove
// ---------------------------------------------------------------
if (methodIs('DELETE')) {
    $id = (int)($_GET['id'] ?? 0);
    if (!$id) sendError('Transaction id is required.', 422);

    $stmt = $db->prepare('SELECT * FROM transactions WHERE id = ? AND user_id = ?');
    $stmt->execute([$id, $userId]);
    $old = $stmt->fetch();
    if (!$old) sendError('Transaction not found.', 404);

    $db->beginTransaction();
    try {
        applyBalanceEffect($db, $old, true);
        $db->prepare('DELETE FROM transactions WHERE id = ? AND user_id = ?')->execute([$id, $userId]);
        $db->commit();
        sendSuccess(['deleted' => true]);
    } catch (Exception $e) {
        $db->rollBack();
        sendError('Could not delete transaction.', 500);
    }
}

sendError('Method not allowed', 405);
