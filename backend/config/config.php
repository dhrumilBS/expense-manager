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
// IMPORTANT: change this to a long random string in production.
// Generate one with: php -r "echo bin2hex(random_bytes(32));"
define('JWT_SECRET', getenv('JWT_SECRET') ?: 'random');
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
