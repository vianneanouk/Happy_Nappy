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
  const deliveryDate = "15. Mai 2026";
  const orderDate = "28. April";
  const amount = 28;

  document.getElementById(`kind${number}Name`).textContent = kind.vorname;
  document.getElementById(`kind${number}Status`).textContent = "Unterwegs";
  document.getElementById(`kind${number}OrderDate`).textContent = orderDate;

  document.getElementById(`kind${number}Size`).textContent = kind.windelgroesse;
  document.getElementById(`kind${number}Amount`).textContent = amount;

  document.getElementById(`kind${number}DeliveryDate`).textContent = deliveryDate;
  document.getElementById(`kind${number}DeliveryDateTimeline`).textContent = deliveryDate;
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