<?php
session_start();
header('Content-Type: application/json');
require_once "../system/config.php";

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    $userID = $_SESSION['user_id'] ?? null;

    if (!$userID) {
        echo json_encode(["status" => "error", "message" => "Nicht eingeloggt"]);
        exit;
    }

    // Daten bereinigen
    $vorname = trim($data['vorname'] ?? '');
    $nachname = trim($data['nachname'] ?? '');
    $babyVorname = trim($data['babyVorname'] ?? '');
    $babyNachname = trim($data['babyNachname'] ?? '');
    $babyGeburtsdatum = $data['babyGeburtsdatum'] ?? null;
    $babyGewicht = $data['babyGewicht'] ?? null;

    if (!$vorname || !$nachname) {
        echo json_encode(["status" => "error", "message" => "Vorname und Nachname sind erforderlich"]);
        exit;
    }

    try {
        $sql = "UPDATE users SET 
                vorname = :vorname, 
                nachname = :nachname, 
                babyVorname = :babyVorname, 
                babyNachname = :babyNachname, 
                babyGeburtsdatum = :babyGeburtsdatum, 
                gewicht = :gewicht,
                windelgroesse = :windelgroesse
                WHERE id = :userID";

        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            ":vorname"  => $vorname,
            ":nachname" => $nachname,
            ":babyVorname" => $babyVorname,
            ":babyNachname" => $babyNachname,
            ":babyGeburtsdatum"   => $babyGeburtsdatum,
            ":gewicht" => $babyGewicht,
            ":windelgroesse" => :windelgroesse
            ":userID"   => $userID
        ]);

        echo json_encode(["status" => "success", "message" => "Daten gespeichert"]);
    } catch (PDOException $e) {
        echo json_encode(["status" => "error", "message" => "Datenbankfehler: " . $e->getMessage()]);
    }

} else {
    echo json_encode(["status" => "error", "message" => "Ungültige Anfrage"]);
}