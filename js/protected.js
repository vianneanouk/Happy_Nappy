/* Diese Datei steuert die Logik der Startseite nach erfolgreicher Anmeldung. Nachdem die Authentifizierung überprüft wurde, werden die Daten der Kinder des Benutzers geladen und in einem Dashboard angezeigt.
 Protected.js enthält ausserdem Funktionen zur Berechnung des Windelbestandes, wie lange die Windeln noch reichen werden und zeigt den Bestellstatus an.*/

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

    document.getElementById("userVorname").textContent = result.vorname ?? "";
    document.getElementById("userId").textContent = result.user_id ?? "";

    return true;
  } catch (error) {
    console.error("Auth check failed:", error);
    window.location.href = "/login.html";
    return false;
  }
}


async function loadDashboardData() {
  try {
    const response = await fetch("/api/dashboard.php", {
      credentials: "include",
    });

    const data = await response.json();

    const container = document.getElementById("childrenContainer");
    const emptyState = document.getElementById("emptyState");

    container.innerHTML = "";

    if (data.status !== "success" || !data.kinder || data.kinder.length === 0) {
      emptyState.style.display = "block";
      return;
    }

    emptyState.style.display = "none";

    data.kinder.forEach((kind) => {
      const childElement = createChildDashboard(kind);
      container.appendChild(childElement);
    });

  } catch (error) {
    console.error("Dashboard data failed:", error);
  }
}


function createChildDashboard(kind) {
  const hatGeraet =
    typeof kind.geraet_code === "string" &&
    kind.geraet_code.trim() !== "";

  const letztePackung = Number(kind.letzte_packung ?? 0);

  const hatMessdaten =
    kind.aktuelle_distanz !== null ||
    letztePackung === 1;

  const distanz = Number(kind.aktuelle_distanz ?? 200);

  const bestandWindeln =
    hatGeraet && hatMessdaten
      ? calculateCurrentDiaperStock(letztePackung, distanz)
      : 0;

  const verbrauchWoche =
    hatGeraet && hatMessdaten
      ? Number(kind.verbrauch_woche ?? 0)
      : 0;

  const verbleibendeTage = calculateDaysLeft(bestandWindeln);
  const progress = calculateProgress(bestandWindeln);

  const bestellung = getOrderStatus(
    bestandWindeln,
    hatGeraet && hatMessdaten
  );

  const windelgroesseText =
    hatGeraet && hatMessdaten
      ? getWindelgroesseText(kind.letzte_rfid_windelgroesse)
      : "Kein Gerät verbunden";

  const wrapper = document.createElement("div");
  wrapper.classList.add("child-dashboard");

  wrapper.innerHTML = `
    <section class="stock-card">
      <h2>Aktueller Bestand für ${kind.vorname}</h2>

      <div class="stock-number">
        <span>${bestandWindeln}</span>
      </div>

      <p class="stock-text">Windeln verfügbar</p>

      <p class="stock-text">
        ${windelgroesseText}
      </p>

      <p class="stock-text">
        reicht noch für ${verbleibendeTage} Tage
      </p>

      <div class="progress-bar">
        <div class="progress-fill" style="width: ${progress}%"></div>
      </div>
    </section>

    <section class="info-card delivery-card">
      <h2>Nächste Lieferung für ${kind.vorname}</h2>

      <p>${bestellung.statusText}</p>

      <p>
        Ankunft:
        <span>${bestellung.datum}</span>
      </p>
    </section>

    <section class="info-card">
      <h2>${kind.vorname}s Verbrauch</h2>

      <p>
        <span>${verbrauchWoche}</span>
        Windeln diese Woche
      </p>
    </section>
  `;

  return wrapper;
}


function getWindelgroesseText(windelgroesse) {
  if (windelgroesse === null || windelgroesse === undefined || windelgroesse === "") {
    return "Windelgrösse noch nicht erkannt";
  }

  return `Windelgrösse ${windelgroesse}`;
}


function calculateCurrentDiaperStock(letztePackung, distanz) {
  if (letztePackung === 1) {
    return 18;
  }

  return calculateDiapersFromDistance(distanz);
}


function calculateDiapersFromDistance(distanz) {
  const minDistanz = 30;
  const maxDistanz = 200;

  const bestandBeiMinDistanz = 18;
  const bestandBeiMaxDistanz = 10;

  if (Number.isNaN(distanz)) {
    return bestandBeiMaxDistanz;
  }

  if (distanz <= minDistanz) {
    return bestandBeiMinDistanz;
  }

  if (distanz >= maxDistanz) {
    return bestandBeiMaxDistanz;
  }

  const anteil =
    (maxDistanz - distanz) / (maxDistanz - minDistanz);

  const windeln =
    bestandBeiMaxDistanz +
    anteil * (bestandBeiMinDistanz - bestandBeiMaxDistanz);

  return Math.round(
    Math.min(
      Math.max(windeln, bestandBeiMaxDistanz),
      bestandBeiMinDistanz
    )
  );
}


function calculateDaysLeft(bestandWindeln) {
  const windelnProPackung = 18;
  const tageProPackung = 7;

  return Math.round((bestandWindeln / windelnProPackung) * tageProPackung);
}


function calculateProgress(bestandWindeln) {
  const maxBestand = 18;
  const progress = (bestandWindeln / maxBestand) * 100;

  return Math.min(progress, 100);
}


function getOrderStatus(bestandWindeln, sensorAktiv = true) {
  if (!sensorAktiv) {
    return {
      statusText: "Gerade keine Bestellung am Laufen",
      datum: "keine Lieferung geplant",
    };
  }

  if (bestandWindeln <= 11) {
    return {
      statusText: "18 Windeln unterwegs",
      datum: getDeliveryDate(),
    };
  }

  return {
    statusText: "Gerade keine Bestellung am Laufen",
    datum: "keine Lieferung geplant",
  };
}


function getDeliveryDate() {
  const date = new Date();

  date.setDate(date.getDate() + 3);

  return date.toLocaleDateString("de-CH", {
    day: "numeric",
    month: "long",
  });
}


window.addEventListener("load", async () => {
  const isAuthenticated = await checkAuth();

  if (isAuthenticated) {
    loadDashboardData();
  }
});