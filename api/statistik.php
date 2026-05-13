<?php
session_start();

header('Content-Type: application/json');

require_once '../system/config.php';

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode([
        "status" => "error",
        "message" => "Unauthorized"
    ]);
    exit;
}

$userId = $_SESSION['user_id'];

function distanzZuWindeln($distanz) {
    $regalHoehe = 200;
    $windelnVollesRegal = 28;

    $windeln = (($regalHoehe - $distanz) / $regalHoehe) * $windelnVollesRegal;

    return round(max(0, min($windeln, $windelnVollesRegal)));
}

try {
    $stmt = $pdo->prepare("
        SELECT 
            k.id,
            k.vorname
        FROM kinder k
        INNER JOIN users u ON u.familien_id = k.familien_id
        WHERE u.id = ?
        ORDER BY k.id ASC
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
                "anzahl" => round($anzahl)
            ];
        }

        $kind["wochen"] = [];

        foreach ($wochen as $woche => $anzahl) {
            $kind["wochen"][] = [
                "woche" => $woche,
                "anzahl" => round($anzahl)
            ];
        }
    }

    unset($kind);

    echo json_encode([
        "status" => "success",
        "kinder" => $kinder
    ]);

} catch (Exception $e) {
    http_response_code(500);

    echo json_encode([
        "status" => "error",
        "message" => "Server error",
        "details" => $e->getMessage()
    ]);
}
?>