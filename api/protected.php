<?php

/**
 * Diese Datei liefert Informationen über den aktuell eingeloggten Benutzer. 
 * Sie dient als Authentifizierungs-Check für das Frontend und wird verwendet, um geschützte Seiten nur für eingeloggte User zugänglich zu machen.
 * Rückgabe als JSON mit Benutzerinformationen wie user_id, email und vorname. Wenn kein Benutzer eingeloggt ist, wird eine Fehlermeldung zurückgegeben.
 */
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

$stmt = $pdo->prepare("SELECT id, email, vorname FROM users WHERE id = ?");
$stmt->execute([$userId]);

$user = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$user) {
    http_response_code(404);
    echo json_encode([
        "error" => "User not found"
    ]);
    exit;
}

echo json_encode([
    "status" => "success",
    "user_id" => $user["id"],
    "email" => $user["email"],
    "vorname" => $user["vorname"]
]);