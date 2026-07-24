<?php
// Üçüncü taraf gerektirmeyen, basit istemci tarafı hata günlüğü (Sentry benzeri servislerin yerine).
header('Content-Type: application/json; charset=UTF-8');

$payload = json_decode(file_get_contents('php://input'), true);
if (!$payload || !isset($payload['message'])) {
    http_response_code(400);
    echo json_encode(['ok' => false]);
    exit;
}

$logFile = __DIR__ . '/error.log';

$entry = json_encode([
    't' => date('c'),
    'page' => isset($payload['page']) ? substr(preg_replace('/[^a-zA-Z0-9_\-\.\/]/', '', $payload['page']), 0, 100) : 'unknown',
    'message' => substr((string)$payload['message'], 0, 500),
], JSON_UNESCAPED_UNICODE) . "\n";

$maxLines = 1000;
$lines = [];
if (file_exists($logFile)) {
    $lines = file($logFile, FILE_IGNORE_NEW_LINES);
    if ($lines === false) $lines = [];
}
$lines[] = trim($entry);
if (count($lines) > $maxLines) {
    $lines = array_slice($lines, (int)($maxLines / 2));
}
file_put_contents($logFile, implode("\n", $lines) . "\n", LOCK_EX);

echo json_encode(['ok' => true]);
