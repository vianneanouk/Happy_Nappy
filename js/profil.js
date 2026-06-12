/* Beim Laden der Profil-Seite werden die Profildaten und die Daten der Kinder über den API-Endpunkt vom Server geladen und in die Formularfelder eingefügt.
Die Benutzer:innen können ihre Daten und die ihrer Kinder bearbeiten und speichern. Beim Speichern werden die Daten an den Server gesendet, der sie verarbeitet und in der Datenbank aktualisiert. 
Die Datei enthält zudem die Logik zur automatischen Berechnung der Windelgrösse basierend auf dem Gewicht des Kindes, sowie die Möglichkeit, die automatische Berechnung zu überschreiben. 
Beim Speichern werden alle Änderungen gesammelt und über die API an den Server gesendet, wo sie in der Datenbank aktualisiert werden.
Bei Admin-Usern wird ein Einladungslink generiert, den sie an andere Personen weitergeben können, damit diese sich mit der gleichen Familien-ID registrieren können.
*/

async function loadProfile() {
  try {
    const response = await fetch("api/profil.php", {
      credentials: "include",
    });

    const result = await response.json();

    console.log(result);

    console.log("is_admin:", result.user.is_admin);
    console.log(typeof result.user.is_admin);

    if (result.status !== "success") {
      console.error("Profil API Fehler:", result);
      return;
    }

    document.getElementById("vorname").value = result.user.vorname || "";
    document.getElementById("nachname").value = result.user.nachname || "";
    document.getElementById("email").value = result.user.email || "";
    document.getElementById("beitrittsdatum").value = result.user.beitrittsdatum || "";
    document.getElementById("familienname").value = result.user.familienname || "";
    document.getElementById("familien_id").value = result.user.familien_id || "";

    const familienId = result.user.familien_id;

  const inviteLinkInput = document.getElementById("inviteLink");

  if (inviteLinkInput) {
  inviteLinkInput.value = familienId
    ? `${window.location.origin}/register.html?familien_id=${familienId}`
    : "";
}

    const adminSection = document.getElementById("adminInviteSection");

    if (result.user.is_admin == 1) {
    adminSection.style.display = "block";
    }

    const rawDate = "2026-05-21";

    const formattedDate = new Date(rawDate).toLocaleDateString("de-CH");

document.getElementById("beitrittsdatum").value = formattedDate;

    renderKinder(result.kinder || []);

  } catch (error) {
    console.error("Profil konnte nicht geladen werden", error);
  }
}


function getWindelgroesse(gewicht) {
  gewicht = parseFloat(gewicht);

  if (Number.isNaN(gewicht)) return 1;
  if (gewicht < 3) return 1;
  if (gewicht <= 5) return 2;
  if (gewicht <= 8) return 3;

  return 4;
}


function createKindHTML(kind = {}) {
  const windelgroesse =
    kind.windelgroesse !== undefined && kind.windelgroesse !== null
      ? kind.windelgroesse
      : getWindelgroesse(kind.gewicht || 0);

  return `
    <div class="kind-block">

      <input
        type="hidden"
        class="kindId"
        value="${kind.id || ""}"
      >

      <div>
        <label><h4>Vorname</h4></label>

        <input
          type="text"
          class="kindVorname"
          value="${kind.vorname || ""}"
          required
        >
      </div>

      <div>
        <label><h4>Geburtsdatum</h4></label>

        <input
          type="date"
          class="kindGeburtsdatum"
          value="${kind.geburtsdatum || ""}"
          required
        >
      </div>

      <div>
        <label><h4>Gewicht (kg)</h4></label>

        <input
          type="number"
          step="0.1"
          class="kindGewicht"
          value="${kind.gewicht || ""}"
          required
        >
      </div>

      <div>
        <label><h4>Windelgrösse</h4></label>

        <select class="kindWindelgroesse">
          <option value="1" ${windelgroesse == 1 ? "selected" : ""}>
            Grösse 1
          </option>

          <option value="2" ${windelgroesse == 2 ? "selected" : ""}>
            Grösse 2
          </option>

          <option value="3" ${windelgroesse == 3 ? "selected" : ""}>
            Grösse 3
          </option>

          <option value="4" ${windelgroesse == 4 ? "selected" : ""}>
            Grösse 4
          </option>

        </select>
      </div>

      <div>
        <label><h4>Geräte-Code</h4></label>

        <input
          type="text"
          class="kindGeraetCode"
          value="${kind.geraet_code || ""}"
          placeholder="z. B. REGAL_001"
          required
        >
      </div>

      <button
        type="button"
        class="removeKindBtn"
      >
        Windelfrei!
      </button>

      <hr>

    </div>
  `;
}


function renderKinder(kinder) {
  const container = document.getElementById("kinderContainer");

  container.innerHTML = "";

  kinder.forEach((kind) => {
    container.innerHTML += createKindHTML(kind);
  });

  attachEvents();
}


document.getElementById("addKindBtn").addEventListener("click", () => {
  const container = document.getElementById("kinderContainer");

  container.innerHTML += createKindHTML();

  attachEvents();
});


function attachEvents() {
  document.querySelectorAll(".removeKindBtn").forEach((btn) => {
    btn.onclick = () => {
      btn.closest(".kind-block").remove();
    };
  });

  document.querySelectorAll(".kindGewicht").forEach((input) => {
    input.oninput = () => {
      const block = input.closest(".kind-block");
      const gewicht = input.value;
      const groesse = getWindelgroesse(gewicht);

      const select = block.querySelector(".kindWindelgroesse");

      if (!select.dataset.manual) {
        select.value = groesse;
      }
    };
  });

  document.querySelectorAll(".kindWindelgroesse").forEach((select) => {
    select.onchange = () => {
      select.dataset.manual = "true";
    };
  });
}


document.getElementById("profilForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const vorname = document.getElementById("vorname").value.trim();
  const nachname = document.getElementById("nachname").value.trim();

  const kinder = [];

  document.querySelectorAll(".kind-block").forEach((block) => {
    kinder.push({
      id: block.querySelector(".kindId").value,
      vorname: block.querySelector(".kindVorname").value.trim(),
      geburtsdatum: block.querySelector(".kindGeburtsdatum").value,
      gewicht: block.querySelector(".kindGewicht").value,
      windelgroesse: block.querySelector(".kindWindelgroesse").value,
      geraet_code: block.querySelector(".kindGeraetCode").value.trim(),
    });
  });

  try {
    const response = await fetch("api/profilUpdate.php", {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      credentials: "include",

      body: JSON.stringify({
        vorname,
        nachname,
        kinder,
      }),
    });

    const result = await response.json();

   const saveMessage = document.getElementById("saveMessage");

  saveMessage.textContent = result.message;

if (result.status === "success") {
  saveMessage.style.color = "#9F83CF";
} else {
  saveMessage.style.color = "#d9534f";
}

saveMessage.style.opacity = "1";

  setTimeout(() => {
  saveMessage.style.opacity = "0";
  }, 10000);

  } catch (error) {
    console.error("Profil konnte nicht gespeichert werden", error);
  }
});


loadProfile();