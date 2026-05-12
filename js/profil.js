async function loadProfile() {
  
    try {
      const response = await fetch("api/profil.php", {
        credentials: "include",
        })

      const result = await response.json();

      console.log("Profile data", result);
      
      document.querySelector("#vorname").value = result.vorname || "";
      document.getElementById("nachname").value = result.nachname || "";
      document.getElementById("email").value = result.email || "";
      document.getElementById("beitrittsdatum").value = result.beitrittsdatum || "";
      document.getElementById("babyVorname").value = result.babyVorname || "";
      document.getElementById("babyNachname").value = result.babyNachname || "";
      document.getElementById("babyGeburtsdatum").value = result.babyGeburtsdatum || "";
      document.getElementById("babyGewicht").value = result.babyGewicht || "";

      } catch (error) {
        console.error ("Failed to load profile:", error);
        
}
}

loadProfile();

document.getElementById("profilForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  // 1. Werte aus den Feldern auslesen
  const vorname = document.getElementById("vorname").value.trim();
  const nachname = document.getElementById("nachname").value.trim();
  const babyVorname = document.getElementById("babyVorname").value.trim();
  const babyNachname = document.getElementById("babyNachname").value.trim();
  const babyGeburtsdatum = document.getElementById("babyGeburtsdatum").value;
  const babyGewicht = document.getElementById("babyGewicht").value.trim();

  try {
    const response = await fetch("api/profilUpdate.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      // HIER FEHLTEN DIE DATEN: Alle Variablen müssen hier rein!
      body: JSON.stringify({
        vorname,
        nachname,
        babyVorname,
        babyNachname,
        babyGeburtsdatum,
        babyGewicht, // Das PHP-Skript erwartet diesen Schlüssel
        windelgroesse: document.getElementById("windelgroesse").value
      }),
    });

    const result = await response.json();
    console.log("Update response:", result);

    if (result.status === "success") {
      alert("Profil erfolgreich gespeichert!");
    } else {
      alert("Fehler: " + result.message);
    }

  } catch (error) {
    console.error("Failed to update profile:", error);
  }
});

let isAutoMode = true; // Solange true, schlägt das System die Grösse vor

// Funktion: Empfehlung berechnen
function getRecommendedSize(weight) {
    const w = parseFloat(weight);
    if (w < 3) return 0;
    if (w <= 5) return 1;
    if (w <= 8) return 2;
    if (w <= 10) return 3;
    return 4;
}

// Event: Gewicht wird eingegeben
document.getElementById("babyGewicht").addEventListener("input", (e) => {
    const weight = e.target.value;
    updateDiaperHighlight(weight); // Deine Tabellen-Markierung von vorhin

    if (isAutoMode && weight > 0) {
        const recommendation = getRecommendedSize(weight);
        document.getElementById("windelgroesse").value = recommendation;
        document.getElementById("empfehlung-text").innerText = "Automatisch vorgeschlagen";
    }
});

// Event: User ändert die Grösse manuell
document.getElementById("windelgroesse").addEventListener("change", () => {
    isAutoMode = false; // Automatik deaktivieren, da User manuell gewählt hat
    document.getElementById("empfehlung-text").innerText = "Manuell angepasst";
});