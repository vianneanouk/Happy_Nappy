async function loadBestellungData() {
  try {
    const response = await fetch("/api/dashboard.php", {
      credentials: "include",
    });

    const data = await response.json();

    if (data.status !== "success" || data.kinder.length === 0) {
      return;
    }

    fillOrderData(1, data.kinder[0]);

    if (data.kinder[1]) {
      fillOrderData(2, data.kinder[1]);
    } else {
      hideSecondOrder();
    }

  } catch (error) {
    console.error("Bestelldaten konnten nicht geladen werden:", error);
  }
}


function fillOrderData(number, kind) {
  const distanz = Number(kind.aktuelle_distanz ?? 0);
  const bestandWindeln = calculateDiapersFromDistance(distanz);
  const bestellung = getOrderStatus(bestandWindeln);

  document.getElementById(`kind${number}Name`).textContent = kind.vorname;

  document.getElementById(`kind${number}Status`).textContent =
    bestellung.status;

  document.getElementById(`kind${number}OrderDate`).textContent =
    bestellung.bestelltAm;

  document.getElementById(`kind${number}PackageText`).textContent =
    bestellung.packageText;

  document.getElementById(`kind${number}DeliveryDate`).textContent =
    bestellung.datum;

  document.getElementById(`kind${number}DeliveryDateTimeline`).textContent =
    bestellung.timelineText;
}


function calculateDiapersFromDistance(distanz) {
  const regalHoehe = 200;
  const windelnBeiVollemRegal = 28;

  const windeln = (distanz / regalHoehe) * windelnBeiVollemRegal;

  return Math.round(Math.min(Math.max(windeln, 0), windelnBeiVollemRegal));
}


function getOrderStatus(bestandWindeln) {
  if (bestandWindeln < 14) {
    return {
      status: "Unterwegs",
      bestelltAm: "heute automatisch ausgelöst",
      packageText: "Windeln (28 Stück)",
      datum: getDeliveryDate(),
      timelineText: `voraussichtlich ${getDeliveryDate()}`,
    };
  }

  return {
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


function hideSecondOrder() {
  const elements = [
    document.getElementById("kind2Toggle"),
    document.getElementById("kind2StatusCard"),
    document.getElementById("kind2Details"),
  ];

  elements.forEach((element) => {
    if (element) {
      element.style.display = "none";
    }
  });
}


window.addEventListener("load", loadBestellungData);