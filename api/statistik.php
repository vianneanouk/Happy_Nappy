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

function getWindelgroesseVonRFID($rfid) {
    $rfid = trim((string)$rfid);

    $mapping = [
        "04:93:f9:30:21:02:89" => 1,
        "04:f3:e5:29:21:02:89" => 2,
        "04:23:29:2f:21:02:89" => 3,
        "6d:d8:03:21" => 4
    ];

    return $mapping[$rfid] ?? null;
}

function istNeuePackung($packung) {
    return getWindelgroesseVonRFID($packung) !== null;
}

function distanzZuWindeln($distanz) {
    $regalHoehe = 200;
    $windelnVollesRegal = 28;

    if ($distanz === null || $distanz === "") {
        return null;
    }

    $windeln = (($regalHoehe - (float)$distanz) / $regalHoehe) * $windelnVollesRegal;

    return round(max(0, min($windeln, $windelnVollesRegal)));
}

function berechneBestand($messung) {
    if (istNeuePackung($messung["packung"] ?? null)) {
        return 28;
    }

    return distanzZuWindeln($messung["distanz"] ?? null);
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
                packung,
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
            $aktuellerBestand = berechneBestand($messung);

            if ($aktuellerBestand === null) {
                continue;
            }

            if ($letzterBestand !== null) {
                $verbrauch = $letzterBestand - $aktuellerBestand;

                if ($verbrauch > 0) {
                    $datum = date("Y-m-d", strtotime($messung["zeit"]));
                    $woche = date("o-W", strtotime($messung["zeit"]));

                    $tage[$datum] = ($tage[$datum] ?? 0) + $verbrauch;
                    $wochen[$woche] = ($wochen[$woche] ?? 0) + $verbrauch;
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