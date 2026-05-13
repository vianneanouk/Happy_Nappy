<?php
session_start();

header('Content-Type: application/json');

require_once '../system/config.php';

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(["error" => "Unauthorized"]);
    exit;
}

$userId = $_SESSION['user_id'];

try {
    $stmt = $pdo->prepare("
        SELECT 
            k.id,
            k.vorname
        FROM kinder k
        INNER JOIN users u ON u.familien_id = k.familien_id
        WHERE u.id = ?
    ");

    $stmt->execute([$userId]);
    $kinder = $stmt->fetchAll(PDO::FETCH_ASSOC);

    foreach ($kinder as &$kind) {
        $kindId = $kind["id"];

        $stmtDays = $pdo->prepare("
            SELECT 
                DATE(zeit) AS datum,
                COUNT(*) AS anzahl
            FROM sensordaten
            WHERE kind_id = ?
            AND zeit >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
            GROUP BY DATE(zeit)
            ORDER BY datum ASC
        ");
        $stmtDays->execute([$kindId]);
        $kind["tage"] = $stmtDays->fetchAll(PDO::FETCH_ASSOC);

        $stmtWeeks = $pdo->prepare("
            SELECT 
                YEARWEEK(zeit, 1) AS woche,
                COUNT(*) AS anzahl
            FROM sensordaten
            WHERE kind_id = ?
            AND zeit >= DATE_SUB(CURDATE(), INTERVAL 6 WEEK)
            GROUP BY YEARWEEK(zeit, 1)
            ORDER BY woche ASC
        ");
        $stmtWeeks->execute([$kindId]);
        $kind["wochen"] = $stmtWeeks->fetchAll(PDO::FETCH_ASSOC);
    }

    echo json_encode([
        "status" => "success",
        "kinder" => $kinder
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "error" => "Server error",
        "message" => $e->getMessage()
    ]);
}
?>