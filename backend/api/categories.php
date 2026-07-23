<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../utils/helpers.php';

applyCors();
$db = getDb();
$userId = requireAuth();

if (methodIs('GET')) {
    $type = $_GET['type'] ?? null;
    if ($type && in_array($type, ['income','expense'], true)) {
        $stmt = $db->prepare('SELECT * FROM categories WHERE user_id = ? AND type = ? ORDER BY name ASC');
        $stmt->execute([$userId, $type]);
    } else {
        $stmt = $db->prepare('SELECT * FROM categories WHERE user_id = ? ORDER BY type ASC, name ASC');
        $stmt->execute([$userId]);
    }
    sendSuccess(['categories' => $stmt->fetchAll()]);
}

if (methodIs('POST')) {
    $b = jsonInput();
    $name = cleanStr($b['name'] ?? null, 100);
    $type = in_array($b['type'] ?? '', ['income','expense'], true) ? $b['type'] : null;
    if (!$name || !$type) sendError('Category name and type (income/expense) are required.', 422);

    try {
        $stmt = $db->prepare('INSERT INTO categories (user_id, name, type, icon, color) VALUES (?,?,?,?,?)');
        $stmt->execute([$userId, $name, $type, cleanStr($b['icon'] ?? 'Circle', 50), cleanStr($b['color'] ?? '#6B7280', 20)]);
        sendSuccess(['id' => (int)$db->lastInsertId()], 201);
    } catch (PDOException $e) {
        sendError('A category with this name already exists for this type.', 409);
    }
}

if (methodIs('PUT')) {
    $b = jsonInput();
    $id = (int)($b['id'] ?? 0);
    if (!$id) sendError('Category id is required.', 422);
    $stmt = $db->prepare('SELECT id FROM categories WHERE id = ? AND user_id = ?');
    $stmt->execute([$id, $userId]);
    if (!$stmt->fetch()) sendError('Category not found.', 404);

    $fields = []; $params = [];
    foreach (['name' => 100, 'icon' => 50, 'color' => 20] as $f => $len) {
        if (isset($b[$f])) { $fields[] = "$f = ?"; $params[] = cleanStr($b[$f], $len); }
    }
    if (!$fields) sendError('Nothing to update.', 422);
    $params[] = $id; $params[] = $userId;
    $db->prepare('UPDATE categories SET ' . implode(', ', $fields) . ' WHERE id = ? AND user_id = ?')->execute($params);
    sendSuccess([]);
}

if (methodIs('DELETE')) {
    $id = (int)($_GET['id'] ?? 0);
    if (!$id) sendError('Category id is required.', 422);
    $db->prepare('DELETE FROM categories WHERE id = ? AND user_id = ?')->execute([$id, $userId]);
    sendSuccess(['deleted' => true]);
}

sendError('Method not allowed', 405);
