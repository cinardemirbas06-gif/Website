<?php
// Basit, üçüncü taraf gerektirmeyen ziyaret sayacı.
// Kişisel veri (IP, User-Agent) SAKLANMAZ; sadece sayfa yolu, zaman ve referrer tutulur.
header('Content-Type: application/json; charset=UTF-8');

$payload = json_decode(file_get_contents('php://input'), true);
$page = isset($payload['page']) ? substr(preg_replace('/[^a-zA-Z0-9_\-\.\/]/', '', $payload['page']), 0, 100) : 'unknown';
if ($page === '') $page = 'unknown';

$logFile = __DIR__ . '/analytics.log';

$entry = json_encode([
    't' => date('c'),
    'page' => $page,
], JSON_UNESCAPED_UNICODE) . "\n";

// Basit döndürme: dosya çok büyürse en eski yarısını at.
$maxLines = 5000;
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
