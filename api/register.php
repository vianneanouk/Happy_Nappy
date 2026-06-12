<?php

/**
 * Diese Datei verarbeitet die Benutzerregistrierung. 
 * Zuerst wird geprüft, ob die Anfrage per POST erfolgt und die benötigten Daten (E-Mail, Passwort und Registrierungsmodus) im JSON-Body vorhanden sind. 
 * Anschliessend wird kontrolliert, ob die E-Mail bereits in der Datenbank existiert. Falls dies nicht der Fall ist, wird ein neuer Benutzer mit einem sicher gehashten Passwort erstellt.
 * Je nach Modus ("new" oder "join") wird entweder eine neue Familie erstellt oder der Benutzer einer bestehenden Familie zugeordnet. 
 * Am Ende wird eine JSON-Antwort mit dem Status der Registrierung, der Benutzer-ID, der Familien-ID und der Admin-Status zurückgegeben. Bei Fehlern werden entsprechende Fehlermeldungen zurückgegeben.
 * 
 */
session_start();
header('Content-Type: application/json');
require_once '../system/config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(["status" => "error", "message" => "Invalid request"]);
    exit;
}

$data = json_decode(file_get_contents("php://input"), true);

$email = trim($data['email'] ?? '');
$password = trim($data['password'] ?? '');
$mode = $data['mode'] ?? 'new';
$familienID = $data['familien_id'] ?? null;
$familienname = trim($data['familienname'] ?? '');

if (!$email || !$password) {
    echo json_encode(["status" => "error", "message" => "Email und Passwort erforderlich"]);
    exit;
}

/* 1. Check ob User existiert */
$stmt = $pdo->prepare("SELECT id FROM users WHERE email = :email");
$stmt->execute([':email' => $email]);

if ($stmt->fetch()) {
    echo json_encode(["status" => "error", "message" => "Email bereits vergeben"]);
    exit;
}

/* 2. Passwort hashen */
$hashedPassword = password_hash($password, PASSWORD_DEFAULT);

/* 3. User erstellen */
$isAdmin = ($mode === "new") ? 1 : 0;

$stmt = $pdo->prepare("
    INSERT INTO users (email, password, is_admin)
    VALUES (:email, :password, :is_admin)
");

$stmt->execute([
    ':email' => $email,
    ':password' => $hashedPassword,
    ':is_admin' => $isAdmin
]);

$userID = $pdo->lastInsertId();

/* 4. Familie bestimmen */
if ($mode === "new") {

    $stmt = $pdo->prepare("
        INSERT INTO familie (familienname)
        VALUES (:familienname)
    ");

    if (!$familienname) {
    echo json_encode([
        "status" => "error",
        "message" => "Familienname erforderlich"
    ]);
    exit;
}

$stmt->execute([
    ':familienname' => $familienname
]);

    $familienID = $pdo->lastInsertId();
}

/* 5. Join bestehende Familie */
if ($mode === "join") {

    if (!$familienID) {
        echo json_encode(["status" => "error", "message" => "Keine Familien-ID angegeben"]);
        exit;
    }

    $stmt = $pdo->prepare("SELECT id FROM familie WHERE id = :id");
    $stmt->execute([':id' => $familienID]);

    if (!$stmt->fetch()) {
        echo json_encode(["status" => "error", "message" => "Familie existiert nicht"]);
        exit;
    }
}

/* 6. User mit Familie verbinden */
$stmt = $pdo->prepare("
    UPDATE users
    SET familien_id = :familien_id
    WHERE id = :user_id
");

$stmt->execute([
    ':familien_id' => $familienID,
    ':user_id' => $userID
]);

echo json_encode([
    "status" => "success",
    "user_id" => $userID,
    "familien_id" => $familienID,
    "is_admin" => $isAdmin
]);