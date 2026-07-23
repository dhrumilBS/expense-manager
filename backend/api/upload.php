<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../utils/helpers.php';

applyCors();
$userId = requireAuth();

if (!methodIs('POST')) sendError('Method not allowed', 405);
if (empty($_FILES['receipt'])) sendError('No file uploaded.', 422);

$file = $_FILES['receipt'];
if ($file['error'] !== UPLOAD_ERR_OK) sendError('Upload failed.', 400);
if ($file['size'] > MAX_UPLOAD_BYTES) sendError('File too large (max 5MB).', 413);

$finfo = finfo_open(FILEINFO_MIME_TYPE);
$mime = finfo_file($finfo, $file['tmp_name']);
finfo_close($finfo);
if (!in_array($mime, ALLOWED_UPLOAD_MIME, true)) {
    sendError('Only JPEG, PNG, WEBP images or PDF receipts are allowed.', 415);
}

if (!is_dir(UPLOAD_DIR)) mkdir(UPLOAD_DIR, 0755, true);

$ext = match ($mime) {
    'image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp', 'application/pdf' => 'pdf', default => 'bin',
};
// Random unguessable filename, scoped by user id, to prevent path traversal & enumeration.
$filename = $userId . '_' . bin2hex(random_bytes(16)) . '.' . $ext;
$destination = UPLOAD_DIR . $filename;

if (!move_uploaded_file($file['tmp_name'], $destination)) {
    sendError('Could not store file.', 500);
}

sendSuccess(['path' => 'uploads/receipts/' . $filename]);
