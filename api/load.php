<?php
 /***
 * Diese Datei empfängt die Daten von den Sensoren (ESP32) und speichert sie in der Datenbank.
**/

require_once("../system/config.php"); 

###################################### Empfangen der JSON-Daten

$inputJSON = file_get_contents('php://input');
$input = json_decode($inputJSON, true); 

###################################### receiving a post request from a HTML form, later from ESP

$distanz = $input["distanz"];
$packung = $input["packung"];
$geraet_code = isset($input["geraet_code"]) ? $input["geraet_code"] : 'UNBEKANNT';  // 👈 neu

# insert new user into db
$sql = "INSERT INTO sensordaten (distanz, packung, geraet_code) VALUES (?, ?, ?)";  // 👈 angepasst
$stmt = $pdo->prepare($sql);
$stmt->execute([$distanz, $packung, $geraet_code]);  // 👈 angepasst

?>