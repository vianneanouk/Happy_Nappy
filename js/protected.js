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

    document.getElementById("userVorname").textContent = result.vorname;
    document.getElementById("userId").textContent = result.user_id;

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

    if (data.status !== "success" || data.kinder.length === 0) {
      return;
    }

    fillChildData(1, data.kinder[0]);

    if (data.kinder[1]) {
      fillChildData(2, data.kinder[1]);
    } else {
      hideSecondChild();
    }

  } catch (error) {
    console.error("Dashboard data failed:", error);
  }
}


function fillChildData(number, kind) {
  const distanz = Number(kind.aktuelle_distanz ?? 0);
  const bestandWindeln = calculateDiapersFromDistance(distanz);
  const verbrauch = Number(kind.verbrauch_woche ?? 0);
  const bestellung = getOrderStatus(bestandWindeln);

  document.getElementById(`kind${number}Name`).textContent = kind.vorname;
  document.getElementById(`kind${number}Bestand`).textContent = bestandWindeln;
  document.getElementById(`kind${number}Tage`).textContent = calculateDaysLeft(bestandWindeln);

  document.getElementById(`kind${number}NameLieferung`).textContent = kind.vorname;
  document.getElementById(`kind${number}LieferStatus`).textContent = bestellung.statusText;
  document.getElementById(`kind${number}LieferDatum`).textContent = bestellung.datum;

  document.getElementById(`kind${number}NameVerbrauch`).textContent = kind.vorname;
  document.getElementById(`kind${number}Verbrauch`).textContent = verbrauch;

  const progress = document.getElementById(`kind${number}Progress`);

  if (progress) {
    progress.style.width = calculateProgress(bestandWindeln) + "%";
  }
}


function calculateDiapersFromDistance(distanz) {
  const regalHoehe = 200;
  const windelnBeiVollemRegal = 28;

  const windeln = (distanz / regalHoehe) * windelnBeiVollemRegal;

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


function hideSecondChild() {
  const sections = [
    document.getElementById("kind2Section"),
    document.getElementById("kind2Delivery"),
    document.getElementById("kind2Usage"),
  ];

  sections.forEach((section) => {
    if (section) {
      section.style.display = "none";
    }
  });
}


window.addEventListener("load", async () => {
  const isAuthenticated = await checkAuth();

  if (isAuthenticated) {
    loadDashboardData();
  }
});