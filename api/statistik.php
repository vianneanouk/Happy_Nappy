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

function distanzZuWindeln($distanz) {
    $regalHoehe = 200;
    $windelnVollesRegal = 28;

    $windeln = ($distanz / $regalHoehe) * $windelnVollesRegal;

    return max(0, min($windeln, $windelnVollesRegal));
}

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

        $stmtSensor = $pdo->prepare("
            SELECT 
                distanz,
                zeit
            FROM sensordaten
            WHERE kind_id = ?
            AND zeit >= DATE_SUB(NOW(), INTERVAL 6 WEEK)
            ORDER BY zeit ASC
        ");

        $stmtSensor->execute([$kindId]);
        $messungen = $stmtSensor->fetchAll(PDO::FETCH_ASSOC);

        $tage = [];
        $wochen = [];

        $letzterBestand = null;

        foreach ($messungen as $messung) {
            $aktuellerBestand = distanzZuWindeln((float)$messung["distanz"]);

            if ($letzterBestand !== null) {
                $verbrauch = $letzterBestand - $aktuellerBestand;

                if ($verbrauch > 0) {
                    $verbrauch = round($verbrauch);

                    $datum = date("Y-m-d", strtotime($messung["zeit"]));
                    $woche = date("o-W", strtotime($messung["zeit"]));

                    if (!isset($tage[$datum])) {
                        $tage[$datum] = 0;
                    }

                    if (!isset($wochen[$woche])) {
                        $wochen[$woche] = 0;
                    }

                    $tage[$datum] += $verbrauch;
                    $wochen[$woche] += $verbrauch;
                }
            }

            $letzterBestand = $aktuellerBestand;
        }

        $kind["tage"] = [];

        foreach ($tage as $datum => $anzahl) {
            $kind["tage"][] = [
                "datum" => $datum,
                "anzahl" => $anzahl
            ];
        }

        $kind["wochen"] = [];

        foreach ($wochen as $woche => $anzahl) {
            $kind["wochen"][] = [
                "woche" => $woche,
                "anzahl" => $anzahl
            ];
        }
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