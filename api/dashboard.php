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
    if (istNeuePackung($messung["packung"] ?? null)) {
        return 28;
    }

    return berechneWindelnAusDistanz($messung["distanz"] ?? null);
}

function berechneVerbrauchWoche($pdo, $geraetCode) {
    if ($geraetCode === null || trim($geraetCode) === "") {
        return 0;
    }

    $startZeit = date("Y-m-d H:i:s", strtotime("-7 days"));

    $stmtVorher = $pdo->prepare("
        SELECT distanz, packung, zeit
        FROM sensordaten
        WHERE geraet_code = ?
          AND zeit < ?
        ORDER BY zeit DESC
        LIMIT 1
    ");

    $stmtVorher->execute([$geraetCode, $startZeit]);
    $vorherigeMessung = $stmtVorher->fetch(PDO::FETCH_ASSOC);

    $stmtWoche = $pdo->prepare("
        SELECT distanz, packung, zeit
        FROM sensordaten
        WHERE geraet_code = ?
          AND zeit >= ?
        ORDER BY zeit ASC
    ");

    $stmtWoche->execute([$geraetCode, $startZeit]);
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
        SELECT id, vorname, geburtsdatum, gewicht, windelgroesse, geraet_code
        FROM kinder
        WHERE familien_id = ?
        ORDER BY id ASC
    ");
    $stmtKinder->execute([$familienId]);
    $kinder = $stmtKinder->fetchAll(PDO::FETCH_ASSOC);

    $resultKinder = [];

    foreach ($kinder as $kind) {
        $geraetCode = $kind["geraet_code"] ?? null;

        $letzteMessung = null;

        if ($geraetCode !== null && trim($geraetCode) !== "") {
            $stmtLetzteMessung = $pdo->prepare("
                SELECT distanz, packung, zeit
                FROM sensordaten
                WHERE geraet_code = ?
                ORDER BY zeit DESC
                LIMIT 1
            ");

            $stmtLetzteMessung->execute([$geraetCode]);
            $letzteMessung = $stmtLetzteMessung->fetch(PDO::FETCH_ASSOC);
        }

        $aktuelleDistanz = $letzteMessung["distanz"] ?? null;
        $letztePackung = $letzteMessung["packung"] ?? null;
        $erkannteWindelgroesse = getWindelgroesseVonRFID($letztePackung);

        $verbrauchWoche = berechneVerbrauchWoche($pdo, $geraetCode);

        $resultKinder[] = [
            "id" => $kind["id"],
            "vorname" => $kind["vorname"],
            "geburtsdatum" => $kind["geburtsdatum"],
            "gewicht" => $kind["gewicht"],
            "windelgroesse" => $erkannteWindelgroesse ?? $kind["windelgroesse"],
            "geraet_code" => $geraetCode,
            "aktuelle_distanz" => $aktuelleDistanz,
            "letzte_packung" => istNeuePackung($letztePackung) ? 1 : 0,
            "rfid_code" => $letztePackung,
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