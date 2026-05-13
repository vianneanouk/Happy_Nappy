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
  const distanz = Number(kind.aktuelle_distanz ?? 200);
  const bestandWindeln = calculateDiapersFromDistance(distanz);
  const bestellung = getOrderStatus(bestandWindeln);

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
          <div class="timeline-circle"></div>

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


function calculateDiapersFromDistance(distanz) {
  const regalHoehe = 200;
  const windelnBeiVollemRegal = 28;

  const windeln =
    ((regalHoehe - distanz) / regalHoehe) * windelnBeiVollemRegal;

  return Math.round(Math.min(Math.max(windeln, 0), windelnBeiVollemRegal));
}


function getOrderStatus(bestandWindeln) {
  if (bestandWindeln < 14) {
    const lieferdatum = getDeliveryDate();

    return {
      isActive: true,
      status: "Unterwegs",
      bestelltAm: "heute automatisch ausgelöst",
      packageText: "Windeln, 28 Stück",
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