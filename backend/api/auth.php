<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../utils/helpers.php';

applyCors();
$db = getDb();
$action = $_GET['action'] ?? '';

if (methodIs('POST') && $action === 'register') {
    $body = jsonInput();
    $name = cleanStr($body['name'] ?? null, 120);
    $email = strtolower(trim($body['email'] ?? ''));
    $password = (string)($body['password'] ?? '');

    if (!$name || !isValidEmail($email) || strlen($password) < 8) {
        sendError('Please provide a name, a valid email, and a password of at least 8 characters.', 422);
    }

    $stmt = $db->prepare('SELECT id FROM users WHERE email = ?');
    $stmt->execute([$email]);
    if ($stmt->fetch()) {
        sendError('An account with this email already exists.', 409);
    }

    $hash = password_hash($password, PASSWORD_BCRYPT);
    $stmt = $db->prepare('INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)');
    $stmt->execute([$name, $email, $hash]);
    $userId = (int) $db->lastInsertId();

    seedDefaults($db, $userId);

    $token = jwtEncode(['uid' => $userId], JWT_TTL_SECONDS);
    sendSuccess(['token' => $token, 'user' => ['id' => $userId, 'name' => $name, 'email' => $email, 'currency' => 'INR', 'theme' => 'light']], 201);
}

if (methodIs('POST') && $action === 'login') {
    $body = jsonInput();
    $email = strtolower(trim($body['email'] ?? ''));
    $password = (string)($body['password'] ?? '');

    $stmt = $db->prepare('SELECT id, name, email, password_hash, currency, theme FROM users WHERE email = ?');
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    if (!$user || !password_verify($password, $user['password_hash'])) {
        sendError('Invalid email or password.', 401);
    }

    $token = jwtEncode(['uid' => (int)$user['id']], JWT_TTL_SECONDS);
    unset($user['password_hash']);
    sendSuccess(['token' => $token, 'user' => $user]);
}

if (methodIs('GET') && $action === 'me') {
    $userId = requireAuth();
    $stmt = $db->prepare('SELECT id, name, email, currency, theme, created_at FROM users WHERE id = ?');
    $stmt->execute([$userId]);
    $user = $stmt->fetch();
    if (!$user) sendError('User not found', 404);
    sendSuccess(['user' => $user]);
}

sendError('Unknown auth action', 404);

/** Give every new user a working starter set of groups/categories/accounts. */
function seedDefaults(PDO $db, int $userId): void
{
    $groups = [
        ['Personal', 'User', '#0B8457', 1],
        ['Household', 'Home', '#3B5BA9', 0],
        ['Business', 'Briefcase', '#946200', 0],
        ['Trip', 'Plane', '#0E7C86', 0],
    ];
    $gStmt = $db->prepare('INSERT INTO expense_groups (user_id, name, icon, color, is_default) VALUES (?,?,?,?,?)');
    foreach ($groups as $g) $gStmt->execute([$userId, $g[0], $g[1], $g[2], $g[3]]);

    $expenseCats = [
        ['Food', 'Utensils', '#B33A3A'], ['Grocery', 'ShoppingCart', '#B3541E'],
        ['Fuel', 'Fuel', '#8A5A00'], ['Rent', 'Home', '#6D4AFF'],
        ['Electricity', 'Zap', '#C08A00'], ['Internet', 'Wifi', '#3B5BA9'],
        ['Shopping', 'ShoppingBag', '#B3387A'], ['Medical', 'HeartPulse', '#C1440E'],
        ['Entertainment', 'Film', '#7A3FB3'], ['Travel', 'Plane', '#0E7C86'],
        ['Education', 'GraduationCap', '#2E6BB3'], ['EMI', 'CreditCard', '#946200'],
        ['Insurance', 'ShieldCheck', '#2E7D5B'], ['Others', 'MoreHorizontal', '#6B7280'],
    ];
    $incomeCats = [
        ['Salary', 'Wallet', '#0B8457'], ['Bonus', 'Gift', '#0E7C86'],
        ['Freelancing', 'Laptop', '#2E6BB3'], ['Interest', 'Percent', '#3B5BA9'],
        ['Cashback', 'BadgePercent', '#0B8457'], ['Gifts', 'Gift', '#7A3FB3'],
        ['Others', 'MoreHorizontal', '#6B7280'],
    ];
    $cStmt = $db->prepare('INSERT INTO categories (user_id, name, type, icon, color) VALUES (?,?,?,?,?)');
    foreach ($expenseCats as $c) $cStmt->execute([$userId, $c[0], 'expense', $c[1], $c[2]]);
    foreach ($incomeCats as $c) $cStmt->execute([$userId, $c[0], 'income', $c[1], $c[2]]);

    $accounts = [
        ['Cash', 'cash', '#0B8457'], ['Primary Bank', 'bank', '#3B5BA9'],
        ['Credit Card', 'credit_card', '#B33A3A'], ['UPI', 'upi', '#7A3FB3'],
    ];
    $aStmt = $db->prepare('INSERT INTO accounts (user_id, name, type, opening_balance, current_balance, color) VALUES (?,?,?,0,0,?)');
    foreach ($accounts as $a) $aStmt->execute([$userId, $a[0], $a[1], $a[2]]);
}
