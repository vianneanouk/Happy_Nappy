<?php
session_start();

header('Content-Type: application/json');

require_once '../system/config.php';

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode([
        "error" => "Unauthorized"
    ]);
    exit;
}

$userId = $_SESSION['user_id'];

try {
    $stmt = $pdo->prepare("
        SELECT 
            k.id,
            k.vorname,
            k.geburtsdatum,
            k.gewicht,
            k.windelgroesse,

            (
                SELECT s.distanz
                FROM sensordaten s
                WHERE s.kind_id = k.id
                ORDER BY s.zeit DESC
                LIMIT 1
            ) AS aktuelle_distanz,

            (
                SELECT COUNT(*)
                FROM sensordaten s
                WHERE s.kind_id = k.id
                AND s.zeit >= DATE_SUB(NOW(), INTERVAL 7 DAY)
            ) AS verbrauch_woche

        FROM kinder k
        INNER JOIN users u ON u.familien_id = k.familien_id
        WHERE u.id = ?
    ");

    $stmt->execute([$userId]);
    $kinder = $stmt->fetchAll(PDO::FETCH_ASSOC);

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
