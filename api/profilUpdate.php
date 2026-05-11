<?php
session_start();

require_once "../system/config.php";

if ($_SERVER['REQUEST_METHOD'] === 'POST') {

    $data = json_decode(file_get_contents("php://input"), true);

    $vorname    = trim($data['vorname'] ?? '');
    $nachname = trim($data['nachname'] ?? '');

if (!$vorname || !$nachname) {
    echo json_encode(["status" => "error", "message" =>"Vorname and Nachname are required"]);
    exit;
    }

    echo json_encode(["status" => "success"]);

    $userID = $_SESSION['user_id'];

    $stmt = $pdo->prepare("UPDATE users SET vorname = :vorname, nachname = :nachname WHERE id = :userID");
    $stmt->execute([ ":vorname" => $vorname, ":nachname" => $nachname, ":userID" => $userID]);
    $userUpdate = $stmt->fetch();

} else {
    echo json_encode(["status" => "error", "message" => "Falsch"]);
}