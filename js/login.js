/* Diese Datei steuert die Anmeldung der Nutzer:innen. Beim Absenden des Login-Formulars werden die eingegebenen Daten als JSON an den Server gesendet.
Bei erfolgreicher Authentifizierung wird der/die Benutzer:in zur geschützten Startseite weitergeleitet. */

document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  const errorMessage = document.getElementById("error-message");

  /* Fehlermeldung zurücksetzen */
  errorMessage.style.display = "none";
  errorMessage.textContent = "";

  try {
    const response = await fetch("api/login.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const result = await response.json();

    if (result.status === "success") {

      window.location.href = "protected.html";

    } else {

      errorMessage.style.display = "block";
      errorMessage.textContent = "Ungültige Angaben";

    }

  } catch (error) {

    console.error("Error:", error);

    errorMessage.style.display = "block";
    errorMessage.textContent = "Etwas ist schiefgelaufen";

  }
});