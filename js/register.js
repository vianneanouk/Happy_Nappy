/* Diese Datei steuert die Logik der Registrierungsseite. Im Dropdown-Menü kann ausgewählt werden, ob eine neue Familie erstellt oder einer bestehenden beigetreten wird.
Beim Absenden des Formulars werden die eingegeben Daten an den Backend-Endpunkt register.php gesendet und dort verarbeitet.
Die Datei enthält ausserdem eine Funktion, die es möglich macht, über den Einladungslink das Familien-ID-Feld automatisch zu befüllen und den Modus auf "join" zu setzen. */

const modeSelect = document.getElementById("mode");

const familiennameContainer = document.getElementById("familienname-container");
const familienIDContainer = document.getElementById("familienid-container");

modeSelect.addEventListener("change", () => {

  if (modeSelect.value === "new") {

    familiennameContainer.style.display = "block";
    familienIDContainer.style.display = "none";

  } else {

    familiennameContainer.style.display = "none";
    familienIDContainer.style.display = "block";
  }
});

document.getElementById("registerForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  const mode = document.querySelector('select[name="mode"]').value;
  
  const familienIDInput =
  document.querySelector('input[name="familien_id"]');

  const familiennameInput =
  document.querySelector('input[name="familienname"]');

  const familien_id = familienIDInput
  ? familienIDInput.value.trim()
  : "";

const familienname = familiennameInput
  ? familiennameInput.value.trim()
  : "";
  const errorMessage = document.getElementById("error-message");
  errorMessage.style.display = "none";
  errorMessage.textContent = "";

  try {
    const response = await fetch("api/register.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        password,
        mode,
        familien_id,
        familienname
      }),
    });

    const result = await response.json();

    if (result.status === "success") {
      window.location.href = "login.html";
    } else {
      errorMessage.style.display = "block";
      errorMessage.textContent = result.message || "Fehler beim Registrieren";
    }

  } catch (error) {
    console.error(error);
    errorMessage.style.display = "block";
    errorMessage.textContent = "Serverfehler";
  }
});

window.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);

  const familienId = params.get("familien_id");

  if (familienId) {

    // Modus automatisch auf "join"
    modeSelect.value = "join";

    familiennameContainer.style.display = "none";
    familienIDContainer.style.display = "block";

    // Feld automatisch ausfüllen
    const input = document.getElementById("familien_id");

    if (input) {
      input.value = familienId;
      input.readOnly = true;
    }
  }
});