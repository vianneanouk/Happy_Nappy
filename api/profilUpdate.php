<?php

/**
 * Diese Datei verarbeitet gespeicherte Profiländerungen aus dem Frontend.
 * Wenn der Vorname oder Nachname des Benutzers geändert wurde, oder wenn Kinder hinzugefügt, bearbeitet oder gelöscht wurden, werden die entsprechenden Einträge in der Datenbank aktualisiert.
 * Alle Änderungen erfolgen innerhalb einer Datenbanktransaktion, um sicherzustellen, dass die Daten konsistent bleiben. Am Ende wird eine Erfolgsmeldung oder im Fehlerfall eine Fehlermeldung als JSON zurückgegeben.
 */

session_start();

header('Content-Type: application/json');

require_once "../system/config.php";

$data = json_decode(file_get_contents("php://input"), true);

$userID = $_SESSION['user_id'] ?? null;

if (!$userID) {
    echo json_encode([
        "status" => "error",
        "message" => "Nicht eingeloggt"
    ]);
    exit;
}

$vorname = trim($data['vorname'] ?? "");
$nachname = trim($data['nachname'] ?? "");
$kinder = $data['kinder'] ?? [];

try {
    $pdo->beginTransaction();

    $stmt = $pdo->prepare("
        SELECT familien_id
        FROM users
        WHERE id = :id
    ");

    $stmt->execute([
        ":id" => $userID
    ]);

    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        $pdo->rollBack();

        echo json_encode([
            "status" => "error",
            "message" => "User nicht gefunden"
        ]);
        exit;
    }

    $familienID = $user['familien_id'];

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

    $gesendeteKinderIds = [];

    foreach ($kinder as $kind) {
        $kindId = trim($kind['id'] ?? "");
        $geraetCode = trim($kind['geraet_code'] ?? "");

        if ($kindId !== "") {
            $gesendeteKinderIds[] = (int)$kindId;

            $stmt = $pdo->prepare("
                UPDATE kinder
                SET
                    vorname = :vorname,
                    geburtsdatum = :geburtsdatum,
                    gewicht = :gewicht,
                    windelgroesse = :windelgroesse,
                    geraet_code = :geraet_code
                WHERE id = :id
                  AND familien_id = :familien_id
            ");

            $stmt->execute([
                ":vorname" => trim($kind['vorname'] ?? ""),
                ":geburtsdatum" => $kind['geburtsdatum'] ?? null,
                ":gewicht" => $kind['gewicht'] ?? null,
                ":windelgroesse" => $kind['windelgroesse'] ?? null,
                ":geraet_code" => $geraetCode !== "" ? $geraetCode : null,
                ":id" => (int)$kindId,
                ":familien_id" => $familienID
            ]);
        } else {
            $stmt = $pdo->prepare("
                INSERT INTO kinder (
                    vorname,
                    geburtsdatum,
                    gewicht,
                    windelgroesse,
                    familien_id,
                    geraet_code
                )
                VALUES (
                    :vorname,
                    :geburtsdatum,
                    :gewicht,
                    :windelgroesse,
                    :familien_id,
                    :geraet_code
                )
            ");

            $stmt->execute([
                ":vorname" => trim($kind['vorname'] ?? ""),
                ":geburtsdatum" => $kind['geburtsdatum'] ?? null,
                ":gewicht" => $kind['gewicht'] ?? null,
                ":windelgroesse" => $kind['windelgroesse'] ?? null,
                ":familien_id" => $familienID,
                ":geraet_code" => $geraetCode !== "" ? $geraetCode : null
            ]);

            $gesendeteKinderIds[] = (int)$pdo->lastInsertId();
        }
    }

    if (count($gesendeteKinderIds) > 0) {
        $platzhalter = implode(",", array_fill(0, count($gesendeteKinderIds), "?"));

        $sql = "
            DELETE FROM kinder
            WHERE familien_id = ?
              AND id NOT IN ($platzhalter)
        ";

        $stmt = $pdo->prepare($sql);

        $werte = array_merge(
            [$familienID],
            $gesendeteKinderIds
        );

        $stmt->execute($werte);
    } else {
        $stmt = $pdo->prepare("
            DELETE FROM kinder
            WHERE familien_id = ?
        ");

        $stmt->execute([$familienID]);
    }

    $pdo->commit();

    echo json_encode([
        "status" => "success",
        "message" => "Profil gespeichert"
    ]);

} catch (PDOException $e) {
    $pdo->rollBack();

    echo json_encode([
        "status" => "error",
        "message" => $e->getMessage()
    ]);
}
?>