async function loadStatistikData() {
  try {
    const response = await fetch("/api/statistik.php", {
      credentials: "include",
    });

    const data = await response.json();

    if (data.status !== "success" || data.kinder.length === 0) {
      return;
    }

    fillChildStatistics(1, data.kinder[0]);

    if (data.kinder[1]) {
      fillChildStatistics(2, data.kinder[1]);
    } else {
      hideSecondChildStatistics();
    }

  } catch (error) {
    console.error("Statistik konnte nicht geladen werden:", error);
  }
}


function fillChildStatistics(number, kind) {
  document.getElementById(`kind${number}Name`).textContent = kind.vorname;

  fillWeekBars(`kind${number}Weeks`, `kind${number}WeeksAxis`, kind.wochen);
  fillDayBars(`kind${number}Days`, `kind${number}DaysAxis`, kind.tage);
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

  const step = Math.ceil(maxValue / 3);

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

    const dateString = date.toISOString().split("T")[0];

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


function hideSecondChildStatistics() {
  const elements = [
    document.querySelector(".child-spacer"),
    document.getElementById("kind2Header"),
    document.getElementById("kind2Switch"),
    document.querySelector(".noah-chart.chart-weeks"),
    document.querySelector(".noah-chart.chart-days"),
  ];

  elements.forEach((element) => {
    if (element) {
      element.style.display = "none";
    }
  });
}


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
      .querySelectorAll(`.${child}-chart`)
      .forEach((chart) => chart.classList.remove("active-chart"));

    document
      .querySelector(`.${child}-chart.chart-${target}`)
      .classList.add("active-chart");
  });
});


window.addEventListener("load", loadStatistikData);