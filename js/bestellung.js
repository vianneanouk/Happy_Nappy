async function loadBestellungData() {
  try {
    const response = await fetch("/api/dashboard.php", {
      credentials: "include",
    });

    const data = await response.json();

    const container = document.getElementById("ordersContainer");
    const emptyState = document.getElementById("emptyState");

    container.innerHTML = "";

    if (data.status !== "success" || !data.kinder || data.kinder.length === 0) {
      emptyState.style.display = "block";
      return;
    }

    emptyState.style.display = "none";

    data.kinder.forEach((kind) => {
      const orderElement = createOrderElement(kind);
      container.appendChild(orderElement);
    });

  } catch (error) {
    console.error("Bestelldaten konnten nicht geladen werden:", error);
  }
}


function createOrderElement(kind) {
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

  const bestellung = getOrderStatus(
    bestandWindeln,
    hatGeraet && hatMessdaten
  );

  const wrapper = document.createElement("div");
  wrapper.classList.add("order-child");

  wrapper.innerHTML = `
    <section class="toggle-card">
      <h3>Automatische Bestellung für ${kind.vorname} aktiv</h3>
    </section>

    <section class="status-card">
      <div class="status-top">
        <div>
          <h2>Status</h2>
          <p>${bestellung.status}</p>
        </div>

        <div class="status-icon">
          <img src="bilder/Icon2.png" alt="">
        </div>
      </div>

      <div class="timeline">
        <div class="timeline-item active">
          <div class="timeline-circle ${bestellung.isActive ? "" : "inactive"}"></div>

          <div>
            <h4>Bestellung</h4>
            <p>${bestellung.bestelltAm}</p>
          </div>
        </div>

        <div class="timeline-item">
          <div class="timeline-circle ${bestellung.isActive ? "" : "inactive"}"></div>

          <div>
            <h4>Lieferung</h4>
            <p>${bestellung.timelineText}</p>
          </div>
        </div>
      </div>
    </section>

    <section class="details-card">
      <h2>Lieferdetails</h2>

      <div class="detail-item">
        <img src="bilder/Paket.png" alt="Paket">

        <div>
          <p class="detail-label">Paket</p>
          <h4>${bestellung.packageText}</h4>
        </div>
      </div>

      <div class="detail-item">
        <img src="bilder/Check.png" alt="Check">

        <div>
          <p class="detail-label">Voraussichtliche Lieferung</p>
          <h4>${bestellung.datum}</h4>
        </div>
      </div>
    </section>
  `;

  return wrapper;
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


function getOrderStatus(bestandWindeln, sensorAktiv = true) {
  if (!sensorAktiv) {
    return {
      isActive: false,
      status: "Keine Bestellung",
      bestelltAm: "kein Gerät verbunden",
      packageText: "Aktuell kein Paket unterwegs",
      datum: "keine Lieferung geplant",
      timelineText: "keine Lieferung geplant",
    };
  }

  if (bestandWindeln <= 11) {
    const lieferdatum = getDeliveryDate();

    return {
      isActive: true,
      status: "Unterwegs",
      bestelltAm: "heute automatisch ausgelöst",
      packageText: "Windeln, 18 Stück",
      datum: lieferdatum,
      timelineText: `voraussichtlich ${lieferdatum}`,
    };
  }

  return {
    isActive: false,
    status: "Keine Bestellung",
    bestelltAm: "nicht ausgelöst",
    packageText: "Aktuell kein Paket unterwegs",
    datum: "keine Lieferung geplant",
    timelineText: "keine Lieferung geplant",
  };
}


function getDeliveryDate() {
  const date = new Date();

  date.setDate(date.getDate() + 3);

  return date.toLocaleDateString("de-CH", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}


window.addEventListener("load", loadBestellungData);