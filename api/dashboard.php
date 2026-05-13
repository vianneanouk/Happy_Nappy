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

try {
    $userStmt = $pdo->prepare("
        SELECT 
            id,
            familien_id
        FROM users
        WHERE id = ?
        LIMIT 1
    ");

    $userStmt->execute([$userId]);
    $user = $userStmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        http_response_code(404);

        echo json_encode([
            "status" => "error",
            "message" => "User not found"
        ]);

        exit;
    }

    $familienId = $user['familien_id'];

    $kinderStmt = $pdo->prepare("
        SELECT 
            id,
            familien_id,
            vorname,
            geburtsdatum,
            gewicht,
            windelgroesse
        FROM kinder
        WHERE familien_id = ?
        ORDER BY id ASC
    ");

    $kinderStmt->execute([$familienId]);
    $kinder = $kinderStmt->fetchAll(PDO::FETCH_ASSOC);

    $result = [];

    foreach ($kinder as $kind) {
        $kindId = $kind['id'];

        $latestStmt = $pdo->prepare("
            SELECT 
                distanz
            FROM sensordaten
            WHERE kind_id = ?
            ORDER BY zeit DESC
            LIMIT 1
        ");

        $latestStmt->execute([$kindId]);
        $latestSensor = $latestStmt->fetch(PDO::FETCH_ASSOC);

        $aktuelleDistanz = $latestSensor ? $latestSensor['distanz'] : null;

        $weekStmt = $pdo->prepare("
            SELECT 
                distanz,
                zeit
            FROM sensordaten
            WHERE kind_id = ?
            AND zeit >= DATE_SUB(NOW(), INTERVAL 7 DAY)
            ORDER BY zeit ASC
        ");

        $weekStmt->execute([$kindId]);
        $weekData = $weekStmt->fetchAll(PDO::FETCH_ASSOC);

        $verbrauchWoche = calculateWeeklyUsage($weekData);

        $result[] = [
            "id" => $kind["id"],
            "vorname" => $kind["vorname"],
            "geburtsdatum" => $kind["geburtsdatum"],
            "gewicht" => $kind["gewicht"],
            "windelgroesse" => $kind["windelgroesse"],
            "aktuelle_distanz" => $aktuelleDistanz,
            "verbrauch_woche" => $verbrauchWoche
        ];
    }

    echo json_encode([
        "status" => "success",
        "kinder" => $result
    ]);

} catch (Exception $e) {
    http_response_code(500);

    echo json_encode([
        "status" => "error",
        "message" => "Server error",
        "details" => $e->getMessage()
    ]);
}


function calculateWeeklyUsage($daten) {
    if (count($daten) < 2) {
        return 0;
    }

    $verbrauch = 0;
    $vorherigerBestand = null;

    foreach ($daten as $eintrag) {
        $aktuellerBestand = calculateDiapersFromDistance((float)$eintrag["distanz"]);

        if ($vorherigerBestand !== null) {
            $differenz = $vorherigerBestand - $aktuellerBestand;

            if ($differenz > 0) {
                $verbrauch += $differenz;
            }
        }

        $vorherigerBestand = $aktuellerBestand;
    }

    return round($verbrauch);
}


function calculateDiapersFromDistance($distanz) {
    $regalHoehe = 200;
    $windelnBeiVollemRegal = 28;

    $windeln = (($regalHoehe - $distanz) / $regalHoehe) * $windelnBeiVollemRegal;

    return round(min(max($windeln, 0), $windelnBeiVollemRegal));
}
?>