<?php
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