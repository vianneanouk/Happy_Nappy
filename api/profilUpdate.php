<?php

session_start();

header('Content-Type: application/json');

require_once "../system/config.php";

$data = json_decode(
    file_get_contents("php://input"),
    true
);

$userID = $_SESSION['user_id'] ?? null;

if (!$userID) {

    echo json_encode([
        "status" => "error",
        "message" => "Nicht eingeloggt"
    ]);

    exit;
}

$vorname = trim($data['vorname']);
$nachname = trim($data['nachname']);
$kinder = $data['kinder'];

try {

    // User laden
    $stmt = $pdo->prepare("
        SELECT familien_id
        FROM users
        WHERE id = :id
    ");

    $stmt->execute([
        ":id" => $userID
    ]);

    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    $familienID = $user['familien_id'];

    // User updaten
    $stmt = $pdo->prepare("
        UPDATE users
        SET
            vorname = :vorname,
            nachname = :nachname
        WHERE id = :id
    ");

    $stmt->execute([
        ":vorname" => $vorname,
        ":nachname" => $nachname,
        ":id" => $userID
    ]);

    // Alte Kinder löschen
    $stmt = $pdo->prepare("
        DELETE FROM kinder
        WHERE familien_id = :familienID
    ");

    $stmt->execute([
        ":familienID" => $familienID
    ]);

    // Kinder neu speichern
    foreach ($kinder as $kind) {

        $stmt = $pdo->prepare("
            INSERT INTO kinder (
                vorname,
                geburtsdatum,
                gewicht,
                windelgroesse,
                familien_id
            )
            VALUES (
                :vorname,
                :geburtsdatum,
                :gewicht,
                :windelgroesse,
                :familien_id
            )
        ");

        $stmt->execute([

            ":vorname" =>
                $kind['vorname'],

            ":geburtsdatum" =>
                $kind['geburtsdatum'],

            ":gewicht" =>
                $kind['gewicht'],

            ":windelgroesse" =>
                $kind['windelgroesse'],

            ":familien_id" =>
                $familienID
        ]);
    }

    echo json_encode([
        "status" => "success",
        "message" => "Profil gespeichert"
    ]);

} catch (PDOException $e) {

    echo json_encode([
        "status" => "error",
        "message" => $e->getMessage()
    ]);
}