<?php
session_start();

header('Content-Type: application/json');

require_once '../system/config.php';

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode([
        "status" => "error",
        "error" => "Unauthorized"
    ]);
    exit;
}

$userId = $_SESSION['user_id'];

function berechneWindelnAusDistanz($distanz) {
    $regalHoehe = 200;
    $windelnBeiVollemRegal = 28;

    if ($distanz === null || $distanz === "") {
        return null;
    }

    $windeln = (($regalHoehe - (float)$distanz) / $regalHoehe) * $windelnBeiVollemRegal;
    $windeln = round($windeln);

    return max(0, min($windeln, $windelnBeiVollemRegal));
}

function berechneBestand($messung) {
    $packung = isset($messung["packung"]) ? (int)$messung["packung"] : 0;

    if ($packung === 1) {
        return 28;
    }

    return berechneWindelnAusDistanz($messung["distanz"] ?? null);
}

function berechneVerbrauchWoche($pdo, $kindId) {
    $startZeit = date("Y-m-d H:i:s", strtotime("-7 days"));

    $stmtVorher = $pdo->prepare("
        SELECT distanz, packung, zeit
        FROM sensordaten
        WHERE kind_id = ?
          AND zeit < ?
        ORDER BY zeit DESC
        LIMIT 1
    ");

    $stmtVorher->execute([$kindId, $startZeit]);
    $vorherigeMessung = $stmtVorher->fetch(PDO::FETCH_ASSOC);

    $stmtWoche = $pdo->prepare("
        SELECT distanz, packung, zeit
        FROM sensordaten
        WHERE kind_id = ?
          AND zeit >= ?
        ORDER BY zeit ASC
    ");

    $stmtWoche->execute([$kindId, $startZeit]);
    $messungenWoche = $stmtWoche->fetchAll(PDO::FETCH_ASSOC);

    $messungen = [];

    if ($vorherigeMessung) {
        $messungen[] = $vorherigeMessung;
    }

    foreach ($messungenWoche as $messung) {
        $messungen[] = $messung;
    }

    if (count($messungen) < 2) {
        return 0;
    }

    $verbrauch = 0;
    $letzterBestand = null;

    foreach ($messungen as $messung) {
        $aktuellerBestand = berechneBestand($messung);

        if ($aktuellerBestand === null) {
            continue;
        }

        if ($letzterBestand !== null) {
            $differenz = $letzterBestand - $aktuellerBestand;

            if ($differenz > 0 && strtotime($messung["zeit"]) >= strtotime($startZeit)) {
                $verbrauch += $differenz;
            }
        }

        $letzterBestand = $aktuellerBestand;
    }

    return round($verbrauch);
}

try {
    $stmtUser = $pdo->prepare("
        SELECT id, familien_id
        FROM users
        WHERE id = ?
    ");
    $stmtUser->execute([$userId]);
    $user = $stmtUser->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        http_response_code(404);
        echo json_encode([
            "status" => "error",
            "error" => "User not found"
        ]);
        exit;
    }

    $familienId = $user["familien_id"];

    $stmtKinder = $pdo->prepare("
        SELECT id, vorname, geburtsdatum, gewicht, windelgroesse
        FROM kinder
        WHERE familien_id = ?
        ORDER BY id ASC
    ");
    $stmtKinder->execute([$familienId]);
    $kinder = $stmtKinder->fetchAll(PDO::FETCH_ASSOC);

    $resultKinder = [];

    foreach ($kinder as $kind) {
        $kindId = $kind["id"];

        $stmtLetzteMessung = $pdo->prepare("
            SELECT distanz, packung, zeit
            FROM sensordaten
            WHERE kind_id = ?
            ORDER BY zeit DESC
            LIMIT 1
        ");

        $stmtLetzteMessung->execute([$kindId]);
        $letzteMessung = $stmtLetzteMessung->fetch(PDO::FETCH_ASSOC);

        $aktuelleDistanz = $letzteMessung["distanz"] ?? null;
        $letztePackung = isset($letzteMessung["packung"])
            ? (int)$letzteMessung["packung"]
            : 0;

        $verbrauchWoche = berechneVerbrauchWoche($pdo, $kindId);

        $resultKinder[] = [
            "id" => $kind["id"],
            "vorname" => $kind["vorname"],
            "geburtsdatum" => $kind["geburtsdatum"],
            "gewicht" => $kind["gewicht"],
            "windelgroesse" => $kind["windelgroesse"],
            "aktuelle_distanz" => $aktuelleDistanz,
            "letzte_packung" => $letztePackung,
            "verbrauch_woche" => $verbrauchWoche
        ];
    }

    echo json_encode([
        "status" => "success",
        "kinder" => $resultKinder
    ]);

} catch (PDOException $error) {
    http_response_code(500);

    echo json_encode([
        "status" => "error",
        "error" => "Database error"
    ]);
    exit;
}
?>