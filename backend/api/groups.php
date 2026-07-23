<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../utils/helpers.php';

applyCors();
$db = getDb();
$userId = requireAuth();

if (methodIs('GET')) {
    $stmt = $db->prepare('SELECT * FROM expense_groups WHERE user_id = ? ORDER BY id ASC');
    $stmt->execute([$userId]);
    sendSuccess(['groups' => $stmt->fetchAll()]);
}

if (methodIs('POST')) {
    $b = jsonInput();
    $name = cleanStr($b['name'] ?? null, 100);
    if (!$name) sendError('Group name is required.', 422);
    try {
        $stmt = $db->prepare('INSERT INTO expense_groups (user_id, name, icon, color) VALUES (?,?,?,?)');
        $stmt->execute([$userId, $name, cleanStr($b['icon'] ?? 'Folder', 50), cleanStr($b['color'] ?? '#0B8457', 20)]);
        sendSuccess(['id' => (int)$db->lastInsertId()], 201);
    } catch (PDOException $e) {
        sendError('A group with this name already exists.', 409);
    }
}

if (methodIs('PUT')) {
    $b = jsonInput();
    $id = (int)($b['id'] ?? 0);
    if (!$id) sendError('Group id is required.', 422);
    $stmt = $db->prepare('SELECT id FROM expense_groups WHERE id = ? AND user_id = ?');
    $stmt->execute([$id, $userId]);
    if (!$stmt->fetch()) sendError('Group not found.', 404);

    $fields = []; $params = [];
    foreach (['name' => 100, 'icon' => 50, 'color' => 20] as $f => $len) {
        if (isset($b[$f])) { $fields[] = "$f = ?"; $params[] = cleanStr($b[$f], $len); }
    }
    if (!$fields) sendError('Nothing to update.', 422);
    $params[] = $id; $params[] = $userId;
    $db->prepare('UPDATE expense_groups SET ' . implode(', ', $fields) . ' WHERE id = ? AND user_id = ?')->execute($params);
    sendSuccess([]);
}

if (methodIs('DELETE')) {
    $id = (int)($_GET['id'] ?? 0);
    if (!$id) sendError('Group id is required.', 422);
    $db->prepare('DELETE FROM expense_groups WHERE id = ? AND user_id = ?')->execute([$id, $userId]);
    sendSuccess(['deleted' => true]);
}

sendError('Method not allowed', 405);
