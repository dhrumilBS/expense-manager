<?php
/**
 * ============================================================
 *  Central configuration
 *  - Copy this file, fill in real values for your environment.
 *  - NEVER commit real secrets to a public repo.
 *  - On shared/free hosting, put this file OUTSIDE the public
 *    web root if the host allows it, or restrict access via
 *    .htaccess (already done for /config in this project).
 * ============================================================
 */

// ---- Database -------------------------------------------------
define('DB_HOST', getenv('DB_HOST') ?: '127.0.0.1');
define('DB_PORT', getenv('DB_PORT') ?: '3306');
define('DB_NAME', getenv('DB_NAME') ?: 'expense_manager');
define('DB_USER', getenv('DB_USER') ?: 'root');
define('DB_PASS', getenv('DB_PASS') ?: '');

// ---- Auth / JWT -------------------------------------------------
// Prefer JWT_SECRET as an env var in production. If it isn't set, a random
// secret is generated once and persisted to .jwt_secret (this folder is
// already blocked from direct web access by .htaccess) so tokens stay
// valid across requests. A hardcoded fallback like 'random' would let
// anyone forge a token for any user id — never do that.
function resolveJwtSecret(): string
{
    $envSecret = getenv('JWT_SECRET');
    if ($envSecret) return $envSecret;

    $secretFile = __DIR__ . '/.jwt_secret';
    if (is_file($secretFile)) {
        $stored = trim((string) file_get_contents($secretFile));
        if ($stored !== '') return $stored;
    }
    $generated = bin2hex(random_bytes(32));
    file_put_contents($secretFile, $generated, LOCK_EX);
    @chmod($secretFile, 0600);
    return $generated;
}
define('JWT_SECRET', resolveJwtSecret());
define('JWT_TTL_SECONDS', 60 * 60 * 4);        // access token: 4 hours
define('REFRESH_TTL_SECONDS', 60 * 60 * 24 * 30); // refresh token: 30 days

// ---- CORS -------------------------------------------------------
// Add every origin your frontend is served from (local + live).
define('ALLOWED_ORIGINS', [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    // 'https://your-frontend.vercel.app',
]);

// ---- Uploads ------------------------------------------------------
define('UPLOAD_DIR', __DIR__ . '/../uploads/receipts/');
define('MAX_UPLOAD_BYTES', 5 * 1024 * 1024); // 5MB
define('ALLOWED_UPLOAD_MIME', ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']);

// ---- Misc ---------------------------------------------------------
// define('APP_ENV', getenv('APP_ENV') ?: 'production'); // 'local' enables verbose errors
define('APP_ENV', getenv('APP_ENV') ?: 'local');
error_reporting(APP_ENV === 'local' ? E_ALL : 0);
ini_set('display_errors', APP_ENV === 'local' ? '1' : '0');
date_default_timezone_set('UTC');
