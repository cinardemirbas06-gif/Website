<?php
// Ziyaret sayacı ve istemci hata istatistiklerini döndürür
// (kişisel panelin "Site İstatistikleri" widget'ı için).
// Kişisel veri döndürmez; yalnızca toplam/günlük/sayfa bazlı sayaçlar.
header('Content-Type: application/json; charset=UTF-8');

$logFile = __DIR__ . '/analytics.log';
$errorLogFile = __DIR__ . '/error.log';

$total = 0;
$today = 0;
$last7Days = 0;
$byPage = [];

if (file_exists($logFile)) {
    $lines = file($logFile, FILE_IGNORE_NEW_LINES) ?: [];
    $todayStr = date('Y-m-d');
    $sevenDaysAgo = strtotime('-7 days');

    foreach ($lines as $line) {
        $row = json_decode($line, true);
        if (!$row || !isset($row['t'], $row['page'])) continue;

        $total++;
        $ts = strtotime($row['t']);

        if (substr($row['t'], 0, 10) === $todayStr) $today++;
        if ($ts !== false && $ts >= $sevenDaysAgo) $last7Days++;

        $byPage[$row['page']] = ($byPage[$row['page']] ?? 0) + 1;
    }
}

arsort($byPage);

$errorCount7Days = 0;
$recentErrors = [];
if (file_exists($errorLogFile)) {
    $errorLines = file($errorLogFile, FILE_IGNORE_NEW_LINES) ?: [];
    $sevenDaysAgo = strtotime('-7 days');

    foreach ($errorLines as $line) {
        $row = json_decode($line, true);
        if (!$row || !isset($row['t'], $row['message'])) continue;

        $ts = strtotime($row['t']);
        if ($ts !== false && $ts >= $sevenDaysAgo) $errorCount7Days++;
    }
    $recentErrors = array_slice(array_reverse($errorLines), 0, 3);
    $recentErrors = array_values(array_filter(array_map(function ($line) {
        $row = json_decode($line, true);
        return $row ? ['t' => $row['t'], 'page' => $row['page'] ?? '', 'message' => $row['message'] ?? ''] : null;
    }, $recentErrors)));
}

echo json_encode([
    'total' => $total,
    'today' => $today,
    'last7Days' => $last7Days,
    'byPage' => array_slice($byPage, 0, 10, true),
    'errorCount7Days' => $errorCount7Days,
    'recentErrors' => $recentErrors,
], JSON_UNESCAPED_UNICODE);
