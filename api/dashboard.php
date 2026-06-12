/**
* Liefert die Dashboard-Daten für den eingeloggten Nutzer. Nach der Session-Prüfung wird anhand der user_id die Familie ermittelt und aus der Datenbank geladen.
* Auch die Kinder werden aus der Datenbank geladen und mit den aktuellen Sensordaten aus der Datenbank kombiniert. Ausserdem werden serverseitig Berechnungen durchgeführt, darunter:
* - Umrechnung von RFID-Werten in Windelgrössen
* - Berechnung des Windelbestandes basierend auf der Distanz
*- Berechnung des Verbrauchs der letzten Woche basierend auf den Messungen der letzten Woche
*
* Die Daten werden dann als JSON zurückgegeben und klnnen dann zur Darstellung des Dashbords genutzt werden. 
*/


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
    $minDistanz = 30;
    $maxDistanz = 200;

    $bestandBeiMinDistanz = 18;
    $bestandBeiMaxDistanz = 10;

    if ($distanz === null || $distanz === "") {
        return null;
    }

    $distanz = (float)$distanz;

    if ($distanz <= $minDistanz) {
        return $bestandBeiMinDistanz;
    }

    if ($distanz >= $maxDistanz) {
        return $bestandBeiMaxDistanz;
    }

    $anteil = ($maxDistanz - $distanz) / ($maxDistanz - $minDistanz);
    $windeln = $bestandBeiMaxDistanz + ($anteil * ($bestandBeiMinDistanz - $bestandBeiMaxDistanz));

    return round(max($bestandBeiMaxDistanz, min($windeln, $bestandBeiMinDistanz)));
}

function berechneBestand($messung) {
    $distanz = $messung["distanz"] ?? null;
    $packung = $messung["packung"] ?? null;

    if (istNeuePackung($packung) && (float)$distanz === 0.0) {
        return 18;
    }

    return berechneWindelnAusDistanz($distanz);
}

function holeLetzteRFIDGroesse($pdo, $geraetCode) {
    if ($geraetCode === null || trim($geraetCode) === "") {
        return null;
    }

    $stmt = $pdo->prepare("
        SELECT packung
        FROM sensordaten
        WHERE geraet_code = ?
          AND packung IS NOT NULL
          AND packung != ''
        ORDER BY zeit DESC
        LIMIT 1
    ");

    $stmt->execute([$geraetCode]);
    $messung = $stmt->fetch(PDO::FETCH_ASSOC);

    return getWindelgroesseVonRFID($messung["packung"] ?? null);
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
        $istEinchecken = istNeuePackung($letztePackung) && (float)($aktuelleDistanz ?? -1) === 0.0;
        $letzteRFIDWindelgroesse = holeLetzteRFIDGroesse($pdo, $geraetCode);
        $verbrauchWoche = berechneVerbrauchWoche($pdo, $geraetCode);

        $resultKinder[] = [
            "id" => $kind["id"],
            "vorname" => $kind["vorname"],
            "geburtsdatum" => $kind["geburtsdatum"],
            "gewicht" => $kind["gewicht"],
            "windelgroesse" => $letzteRFIDWindelgroesse ?? $kind["windelgroesse"],
            "letzte_rfid_windelgroesse" => $letzteRFIDWindelgroesse,
            "geraet_code" => $geraetCode,
            "aktuelle_distanz" => $aktuelleDistanz,
            "letzte_packung" => $istEinchecken ? 1 : 0,
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