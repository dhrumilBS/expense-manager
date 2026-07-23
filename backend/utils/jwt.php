<?php
/**
 * Minimal HS256 JWT implementation — no composer/vendor needed,
 * so this runs on any free PHP host without shell access.
 */

function base64UrlEncode(string $data): string
{
    return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
}

function base64UrlDecode(string $data): string
{
    $remainder = strlen($data) % 4;
    if ($remainder) {
        $data .= str_repeat('=', 4 - $remainder);
    }
    return base64_decode(strtr($data, '-_', '+/'));
}

function jwtEncode(array $payload, int $ttlSeconds): string
{
    $header = ['typ' => 'JWT', 'alg' => 'HS256'];
    $payload['iat'] = time();
    $payload['exp'] = time() + $ttlSeconds;

    $segments = [
        base64UrlEncode(json_encode($header)),
        base64UrlEncode(json_encode($payload)),
    ];
    $signingInput = implode('.', $segments);
    $signature = hash_hmac('sha256', $signingInput, JWT_SECRET, true);
    $segments[] = base64UrlEncode($signature);

    return implode('.', $segments);
}

/**
 * Returns the decoded payload array, or null if invalid/expired.
 */
function jwtDecode(string $token): ?array
{
    $parts = explode('.', $token);
    if (count($parts) !== 3) {
        return null;
    }
    [$headerB64, $payloadB64, $sigB64] = $parts;

    $signingInput = $headerB64 . '.' . $payloadB64;
    $expectedSig = base64UrlEncode(hash_hmac('sha256', $signingInput, JWT_SECRET, true));

    if (!hash_equals($expectedSig, $sigB64)) {
        return null; // tampered / wrong secret
    }

    $payload = json_decode(base64UrlDecode($payloadB64), true);
    if (!is_array($payload) || !isset($payload['exp'])) {
        return null;
    }
    if ($payload['exp'] < time()) {
        return null; // expired
    }
    return $payload;
}
