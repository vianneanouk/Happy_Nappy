<?php
// index.php (API that returns JSON about the logged-in user)
session_start();

include_once "../system/config.php";


$userID = $_SESSION['user_id'];

$stmt = $pdo->prepare("SELECT * FROM users WHERE id = :userID");
$stmt->execute([':userID' => $userID]);
$user = $stmt->fetch(PDO::FETCH_ASSOC);

echo json_encode ([
    "status" => "success",
    "user_id" => $user['id'],
    "email" => $user['email'],
    "vorname" => $user['vorname'],
    "nachname" => $user['nachname'],
    "beitrittsdatum" => $user['beitrittsdatum'],
    "babyVorname" => $user['babyVorname'],
    "babyNachname" => $user['babyNachname'],
    "babyGeburtsdatum" => $user['babyGeburtsdatum'],
    "babyGewicht" => $user['gewicht']
]);