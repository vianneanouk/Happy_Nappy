<?php

session_start();

header('Content-Type: application/json');

require_once "../system/config.php";

$userID = $_SESSION['user_id'];

// User laden
$stmt = $pdo->prepare("
    SELECT
        users.*,
        familie.familienname AS familienname
    FROM users
    LEFT JOIN familie
        ON users.familien_id = familie.id
    WHERE users.id = :id
");

$stmt->execute([
    ":id" => $userID
]);

$user = $stmt->fetch(PDO::FETCH_ASSOC);

// Kinder laden
$stmt = $pdo->prepare("
    SELECT *
    FROM kinder
    WHERE familien_id = :familieID
");

$stmt->execute([
    ":familieID" => $user['familien_id']
]);

$kinder = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo json_encode([

    "status" => "success",

    "user" => $user,

    "kinder" => $kinder

]);