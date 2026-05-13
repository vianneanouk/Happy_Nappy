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
  const distanz = Number(kind.aktuelle_distanz ?? 200);
  const bestandWindeln = calculateDiapersFromDistance(distanz);
  const verbrauchWoche = Number(kind.verbrauch_woche ?? 0);
  const verbleibendeTage = calculateDaysLeft(bestandWindeln);
  const progress = calculateProgress(bestandWindeln);
  const bestellung = getOrderStatus(bestandWindeln);

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


function calculateDiapersFromDistance(distanz) {
  const regalHoehe = 200;
  const windelnBeiVollemRegal = 28;

  const windeln =
    ((regalHoehe - distanz) / regalHoehe) * windelnBeiVollemRegal;

  return Math.round(Math.min(Math.max(windeln, 0), windelnBeiVollemRegal));
}


function calculateDaysLeft(bestandWindeln) {
  const windelnProPackung = 28;
  const tageProPackung = 7;

  return Math.round((bestandWindeln / windelnProPackung) * tageProPackung);
}


function calculateProgress(bestandWindeln) {
  const maxBestand = 28;
  const progress = (bestandWindeln / maxBestand) * 100;

  return Math.min(progress, 100);
}


function getOrderStatus(bestandWindeln) {
  if (bestandWindeln < 14) {
    return {
      statusText: "28 Windeln unterwegs",
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