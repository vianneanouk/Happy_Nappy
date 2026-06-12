<?php
/**  
 * Diese Datei beendet die aktuelle Benutzersession auf dem Server. Dabei werden alle gespeicherten Session-Daten gelöscht und die Session zerstört.
 * Anschliessend gibt die Datei eine JSON-Antwort zurück, die bestätigt, dass der Logout erfolgreich durchgeführt wurde.
*/
session_start();
$_SESSION = [];
session_destroy();

// Return a success response instead of redirecting
header('Content-Type: application/json');
echo json_encode(["status" => "success"]);
exit;
?>