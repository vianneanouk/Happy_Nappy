<?php
// register.php
session_start();
header('Content-Type: application/json');

require_once '../system/config.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {

    $data = json_decode(file_get_contents("php://input"), true);

    $email    = trim($data['email'] ?? '');
    $password = trim($data['password'] ?? '');

    if (!$email || !$password) {
        echo json_encode(["status" => "error", "message" => "Email and password are required"]);
        exit;
    }

    // Check if email already exists
    $stmt = $pdo->prepare("SELECT id FROM users WHERE email = :email");
    $stmt->execute([':email' => $email]);
    if ($stmt->fetch()) {
        echo json_encode(["status" => "error", "message" => "Email is already in use"]);
        exit;
    }

    // Hash the password
    $hashedPassword = password_hash($password, PASSWORD_DEFAULT);

    // Insert the new user
    $insert = $pdo->prepare("INSERT INTO users (email, password) VALUES (:email, :pass)");
    $insert->execute([
        ':email' => $email,
        ':pass'  => $hashedPassword
    ]);

    // Entscheidug: neue oder bestehende Familie

    $mode = $_POST['mode'] ?? 'new';

    if ($mode === "new") {

    $stmt = $pdo->prepare("
        INSERT INTO familie (familiennamen)
        VALUES (:familiennamen)
    ");

    $stmt->execute([
        ":familiennamen" => "Familie " . $userID
    ]);

    $familienID = $pdo->lastInsertId();
}

if ($mode === "join") {

    $familienID = $_POST['familien_id'] ?? null;

    if (!$familienID) {
        die("Keine Familien-ID angegeben");
    }

    // Optional: prüfen ob Familie existiert
    $stmt = $pdo->prepare("
        SELECT id FROM familie WHERE id = :id
    ");

    $stmt->execute([
        ":id" => $familienID
    ]);

    if (!$stmt->fetch()) {
        die("Familie existiert nicht");
    }
}

$stmt = $pdo->prepare("
    UPDATE users
    SET familien_id = :familienID
    WHERE id = :userID
");

$stmt->execute([
    ":familienID" => $familienID,
    ":userID" => $userID
]);

    echo json_encode(["status" => "success"]);
} else {
    echo json_encode(["status" => "error", "message" => "Invalid request method"]);
}
