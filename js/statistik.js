/* Diese Datei steuert die dynamische Darstellung der Statistik-Seite. Beim Laden der Seite werden Verbrauchsdaten der Kindern über den API-Endpunkt statistik.php vom Server geladen und in Form von Balkendiagrammen dargestellt. 
Es gibt die Möglichkeit, zwischen einer Wochen- und Tagesansicht zu wechseln. Ebenfalls enthält die Datei Funktionen, die sicherstellen, dass auch bei fehlenden Daten für bestimmte Tage oder Wochen die Diagramme korrekt dargestellt werden.
*/

async function loadStatistikData() {
  try {
    const response = await fetch("/api/statistik.php", {
      credentials: "include",
    });

    const data = await response.json();

    console.log("Statistik API:", data);

    const container = document.getElementById("statisticsContainer");
    const emptyState = document.getElementById("emptyState");

    if (!container || !emptyState) {
      console.error("statisticsContainer oder emptyState fehlt im HTML.");
      return;
    }

    container.innerHTML = "";

    if (data.status !== "success" || !data.kinder || data.kinder.length === 0) {
      emptyState.style.display = "block";
      return;
    }

    emptyState.style.display = "none";

    data.kinder.forEach((kind, index) => {
      const statisticElement = createStatisticElement(kind, index);
      container.appendChild(statisticElement);

      fillWeekBars(`weeks-${kind.id}`, `weeks-axis-${kind.id}`, kind.wochen || []);
      fillDayBars(`days-${kind.id}`, `days-axis-${kind.id}`, kind.tage || []);
    });

    initChartSwitches();

  } catch (error) {
    console.error("Statistik konnte nicht geladen werden:", error);
  }
}


function createStatisticElement(kind, index) {
  const wrapper = document.createElement("div");
  wrapper.classList.add("statistic-child");

  if (index > 0) {
    wrapper.classList.add("statistic-child-spacing");
  }

  wrapper.innerHTML = `
    <section class="dashboard-header ${index > 0 ? "second-child-header" : ""}">
      <p class="welcome-text">Statistik für ${kind.vorname}</p>
      <h1>Verbrauch</h1>
    </section>

    <section class="chart-switch">
      <button class="switch-btn active" data-child="${kind.id}" data-target="weeks">
        6 Wochen
      </button>

      <button class="switch-btn" data-child="${kind.id}" data-target="days">
        7 Tage
      </button>
    </section>

    <section class="chart-card chart-${kind.id} chart-weeks active-chart">
      <div class="chart-title">
        <img src="bilder/Paket.png" alt="Icon">
        <h2>Verbrauch letzte 6 Wochen</h2>
      </div>

      <div class="chart-wrapper">
        <div class="y-axis" id="weeks-axis-${kind.id}"></div>

        <div class="chart-container">
          <div class="chart-grid"></div>
          <div class="bars weekly-bars" id="weeks-${kind.id}"></div>
        </div>
      </div>
    </section>

    <section class="chart-card chart-${kind.id} chart-days">
      <div class="chart-title">
        <img src="bilder/Paket.png" alt="Icon">
        <h2>Verbrauch letzte 7 Tage</h2>
      </div>

      <div class="chart-wrapper">
        <div class="y-axis" id="days-axis-${kind.id}"></div>

        <div class="chart-container">
          <div class="chart-grid"></div>
          <div class="bars" id="days-${kind.id}"></div>
        </div>
      </div>
    </section>
  `;

  return wrapper;
}


function initChartSwitches() {
  const switchButtons = document.querySelectorAll(".switch-btn");

  switchButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const child = button.dataset.child;
      const target = button.dataset.target;

      document
        .querySelectorAll(`.switch-btn[data-child="${child}"]`)
        .forEach((btn) => btn.classList.remove("active"));

      button.classList.add("active");

      document
        .querySelectorAll(`.chart-${child}`)
        .forEach((chart) => chart.classList.remove("active-chart"));

      const activeChart = document.querySelector(`.chart-${child}.chart-${target}`);

      if (activeChart) {
        activeChart.classList.add("active-chart");
      }
    });
  });
}


function fillWeekBars(containerId, axisId, weeks) {
  const container = document.getElementById(containerId);

  if (!container) return;

  container.innerHTML = "";

  const filledWeeks = fillMissingWeeks(weeks);
  const maxValue = getMaxValue(filledWeeks);

  fillYAxis(axisId, maxValue);

  filledWeeks.forEach((week) => {
    const height = calculateBarHeight(week.anzahl, maxValue);

    container.innerHTML += `
      <div class="bar-item">
        <div class="bar large" style="height: ${height}%;"></div>
        <span>${week.label}</span>
      </div>
    `;
  });
}


function fillDayBars(containerId, axisId, days) {
  const container = document.getElementById(containerId);

  if (!container) return;

  container.innerHTML = "";

  const filledDays = fillMissingDays(days);
  const maxValue = getMaxValue(filledDays);

  fillYAxis(axisId, maxValue);

  filledDays.forEach((day) => {
    const height = calculateBarHeight(day.anzahl, maxValue);

    container.innerHTML += `
      <div class="bar-item">
        <div class="bar" style="height: ${height}%;"></div>
        <span>${day.label}</span>
      </div>
    `;
  });
}


function fillYAxis(axisId, maxValue) {
  const axis = document.getElementById(axisId);

  if (!axis) return;

  axis.innerHTML = "";

  const step = Math.max(1, Math.ceil(maxValue / 3));

  const values = [
    step * 3,
    step * 2,
    step,
    0,
  ];

  values.forEach((value) => {
    axis.innerHTML += `<span>${value}</span>`;
  });
}


function fillMissingDays(days) {
  const labels = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];
  const result = [];

  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);

    const dateString = formatDate(date);
    const foundDay = days.find((day) => day.datum === dateString);

    result.push({
      datum: dateString,
      label: labels[date.getDay()],
      anzahl: foundDay ? Number(foundDay.anzahl) : 0,
    });
  }

  return result;
}


function fillMissingWeeks(weeks) {
  const result = [];

  for (let i = 5; i >= 0; i--) {
    const weekDate = new Date();
    weekDate.setDate(weekDate.getDate() - i * 7);

    const year = getIsoWeekYear(weekDate);
    const week = getIsoWeekNumber(weekDate);
    const weekKey = `${year}-${String(week).padStart(2, "0")}`;

    const foundWeek = weeks.find((item) => item.woche === weekKey);

    result.push({
      woche: weekKey,
      label: `KW ${week}`,
      anzahl: foundWeek ? Number(foundWeek.anzahl) : 0,
    });
  }

  return result;
}


function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}


function getIsoWeekNumber(date) {
  const tempDate = new Date(date.getTime());

  tempDate.setHours(0, 0, 0, 0);
  tempDate.setDate(tempDate.getDate() + 3 - ((tempDate.getDay() + 6) % 7));

  const week1 = new Date(tempDate.getFullYear(), 0, 4);

  return (
    1 +
    Math.round(
      ((tempDate.getTime() - week1.getTime()) / 86400000 -
        3 +
        ((week1.getDay() + 6) % 7)) /
        7
    )
  );
}


function getIsoWeekYear(date) {
  const tempDate = new Date(date.getTime());

  tempDate.setDate(tempDate.getDate() + 3 - ((tempDate.getDay() + 6) % 7));

  return tempDate.getFullYear();
}


function getMaxValue(items) {
  if (!items || items.length === 0) {
    return 1;
  }

  const maxValue = Math.max(...items.map((item) => Number(item.anzahl)));

  return maxValue === 0 ? 1 : maxValue;
}


function calculateBarHeight(value, maxValue) {
  if (!value || value === 0) {
    return 0;
  }

  return Math.max((Number(value) / maxValue) * 100, 4);
}


window.addEventListener("load", loadStatistikData);