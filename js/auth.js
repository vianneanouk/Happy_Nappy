/* Diese Datei überprüft beim Laden der Profil-Seite, ob eine gültige Benutzersitzung vorhanden ist. Dazu wird eine Anfrage an das Backend gesendet und die Antwort ausgewertet.
Bei fehlender Authentifizierung wird der/die Benutzer:in automatisch zur Login-Seite weitergeleitet. Bei erfolgreicher Authentifizierung können die Benutzerdaten im geschützten Bereich angezeigt werden.*/

async function checkAuth() {
  try {
    const response = await fetch("/api/protected.php", {
      credentials: "include",
    });

    if (response.status === 401) {
      window.location.href = "/login.html";
      return false;
    }

    const result = await response.json();

    // Display user data in the protected content div

    return true;
  } catch (error) {
    console.error("Auth check failed:", error);
    window.location.href = "/login.html";
    return false;
  }
}

// Check auth when page loads
window.addEventListener("load", checkAuth);