<?php
require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/jwt.php';

/** Send CORS headers for the configured allowed origins. Call at top of every endpoint. */
function applyCors(): void
{
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    if (in_array($origin, ALLOWED_ORIGINS, true)) {
        header('Access-Control-Allow-Origin: ' . $origin);
    }
    header('Vary: Origin');
    header('Access-Control-Allow-Credentials: true');
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization');
    header('Content-Type: application/json; charset=utf-8');

    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(204);
        exit;
    }
}

function jsonInput(): array
{
    $raw = file_get_contents('php://input');
    if (!$raw) return [];
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

function sendJson($data, int $code = 200): void
{
    http_response_code($code);
    echo json_encode($data);
    exit;
}

function sendError(string $message, int $code = 400, array $extra = []): void
{
    sendJson(array_merge(['success' => false, 'message' => $message], $extra), $code);
}

function sendSuccess($data = [], int $code = 200): void
{
    $payload = is_array($data) ? array_merge(['success' => true], $data) : ['success' => true, 'data' => $data];
    sendJson($payload, $code);
}

/**
 * Validates the Authorization: Bearer <token> header and returns the
 * authenticated user's id. Ends the request with 401 if invalid.
 */
function requireAuth(): int
{
    $headers = function_exists('getallheaders') ? getallheaders() : [];
    $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? ($_SERVER['HTTP_AUTHORIZATION'] ?? '');

    if (!$authHeader || stripos($authHeader, 'Bearer ') !== 0) {
        sendError('Unauthorized: missing token', 401);
    }
    $token = trim(substr($authHeader, 7));
    $payload = jwtDecode($token);
    if (!$payload || empty($payload['uid'])) {
        sendError('Unauthorized: invalid or expired token', 401);
    }
    return (int) $payload['uid'];
}

/** Basic string sanitizer for values that get echoed back / stored. */
function cleanStr(?string $val, int $maxLen = 255): ?string
{
    if ($val === null) return null;
    $val = trim($val);
    $val = substr($val, 0, $maxLen);
    return $val === '' ? null : $val;
}

function isValidEmail(string $email): bool
{
    return (bool) filter_var($email, FILTER_VALIDATE_EMAIL);
}

/** Simple in-memory-per-request rate limiter placeholder hook (extend with Redis/DB for production). */
function methodIs(string $method): bool
{
    return strtoupper($_SERVER['REQUEST_METHOD']) === strtoupper($method);
}
