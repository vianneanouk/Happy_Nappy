<?php

/** 
 * Diese Datei liefert alle Informationen, die für die Profilseite benötigt werden.
 * Zugriff auf die user_id, laden des Benutzerprofils inkl. Familienname, ermitteln der Familien-ID des Benutzers, laden aller Kinder.
 * Rückgabe als JSON für das Frontend.
 */

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