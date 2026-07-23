<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../utils/helpers.php';

applyCors();
$db = getDb();
$userId = requireAuth();

if (methodIs('GET')) {
    $stmt = $db->prepare('SELECT * FROM accounts WHERE user_id = ? AND is_archived = 0 ORDER BY id ASC');
    $stmt->execute([$userId]);
    sendSuccess(['accounts' => $stmt->fetchAll()]);
}

if (methodIs('POST')) {
    $b = jsonInput();
    $name = cleanStr($b['name'] ?? null, 100);
    $type = in_array($b['type'] ?? '', ['cash','bank','credit_card','wallet','upi','other'], true) ? $b['type'] : 'other';
    $opening = (float)($b['opening_balance'] ?? 0);
    if (!$name) sendError('Account name is required.', 422);

    $stmt = $db->prepare('INSERT INTO accounts (user_id, name, type, opening_balance, current_balance, color) VALUES (?,?,?,?,?,?)');
    $stmt->execute([$userId, $name, $type, $opening, $opening, cleanStr($b['color'] ?? '#3B5BA9', 20)]);
    sendSuccess(['id' => (int)$db->lastInsertId()], 201);
}

if (methodIs('PUT')) {
    $b = jsonInput();
    $id = (int)($b['id'] ?? 0);
    if (!$id) sendError('Account id is required.', 422);

    $stmt = $db->prepare('SELECT id FROM accounts WHERE id = ? AND user_id = ?');
    $stmt->execute([$id, $userId]);
    if (!$stmt->fetch()) sendError('Account not found.', 404);

    $fields = []; $params = [];
    foreach (['name' => 100, 'color' => 20] as $f => $len) {
        if (isset($b[$f])) { $fields[] = "$f = ?"; $params[] = cleanStr($b[$f], $len); }
    }
    if (isset($b['type']) && in_array($b['type'], ['cash','bank','credit_card','wallet','upi','other'], true)) {
        $fields[] = 'type = ?'; $params[] = $b['type'];
    }
    if (isset($b['is_archived'])) { $fields[] = 'is_archived = ?'; $params[] = (int)!!$b['is_archived']; }
    if (!$fields) sendError('Nothing to update.', 422);

    $params[] = $id; $params[] = $userId;
    $db->prepare('UPDATE accounts SET ' . implode(', ', $fields) . ' WHERE id = ? AND user_id = ?')->execute($params);
    sendSuccess([]);
}

if (methodIs('DELETE')) {
    $id = (int)($_GET['id'] ?? 0);
    if (!$id) sendError('Account id is required.', 422);
    $stmt = $db->prepare('SELECT COUNT(*) c FROM transactions WHERE (account_id = ? OR to_account_id = ?) AND user_id = ?');
    $stmt->execute([$id, $id, $userId]);
    if ((int)$stmt->fetch()['c'] > 0) {
        // Soft-delete (archive) instead of hard delete to protect transaction history.
        $db->prepare('UPDATE accounts SET is_archived = 1 WHERE id = ? AND user_id = ?')->execute([$id, $userId]);
        sendSuccess(['archived' => true]);
    }
    $db->prepare('DELETE FROM accounts WHERE id = ? AND user_id = ?')->execute([$id, $userId]);
    sendSuccess(['deleted' => true]);
}

sendError('Method not allowed', 405);
