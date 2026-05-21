async function loadProfile() {

    try {

        const response = await fetch(
            "api/profil.php",
            {
                credentials: "include"
            }
        );

        const result = await response.json();

        console.log(result);

        // Userdaten
        document.getElementById("vorname").value =
            result.user.vorname || "";

        document.getElementById("nachname").value =
            result.user.nachname || "";

        document.getElementById("email").value =
            result.user.email || "";

        document.getElementById("beitrittsdatum").value =
            result.user.beitrittsdatum || "";

        document.getElementById("familienname").value =
            result.user.familienname || "";

        // Kinder anzeigen
        renderKinder(result.kinder);

    } catch (error) {

        console.error(
            "Profil konnte nicht geladen werden",
            error
        );

    }
}

function getWindelgroesse(gewicht) {

    gewicht = parseFloat(gewicht);

    if (gewicht < 3) return 0;
    if (gewicht <= 5) return 1;
    if (gewicht <= 8) return 2;
    if (gewicht <= 10) return 3;

    return 4;
}

function createKindHTML(kind = {}) {

    const windelgroesse =
        kind.windelgroesse !== undefined
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

                    <option value="0"
                        ${windelgroesse == 0 ? "selected" : ""}
                    >
                        Grösse 0
                    </option>

                    <option value="1"
                        ${windelgroesse == 1 ? "selected" : ""}
                    >
                        Grösse 1
                    </option>

                    <option value="2"
                        ${windelgroesse == 2 ? "selected" : ""}
                    >
                        Grösse 2
                    </option>

                    <option value="3"
                        ${windelgroesse == 3 ? "selected" : ""}
                    >
                        Grösse 3
                    </option>

                    <option value="4"
                        ${windelgroesse == 4 ? "selected" : ""}
                    >
                        Grösse 4
                    </option>

                </select>
            </div>

            <button
                type="button"
                class="removeKindBtn"
            >
                Entfernen
            </button>

            <hr>

        </div>
    `;
}

function renderKinder(kinder) {

    const container =
        document.getElementById("kinderContainer");

    container.innerHTML = "";

    kinder.forEach(kind => {

        container.innerHTML +=
            createKindHTML(kind);

    });

    attachEvents();
}

document.getElementById("addKindBtn")
.addEventListener("click", () => {

    const container =
        document.getElementById("kinderContainer");

    container.innerHTML += createKindHTML();

    attachEvents();
});

function attachEvents() {

    // Entfernen
    document.querySelectorAll(".removeKindBtn")
    .forEach(btn => {

        btn.onclick = () => {

            btn.closest(".kind-block").remove();

        };

    });

    // Gewicht ändern
    document.querySelectorAll(".kindGewicht")
    .forEach(input => {

        input.oninput = () => {

            const block =
                input.closest(".kind-block");

            const gewicht =
                input.value;

            const groesse =
                getWindelgroesse(gewicht);

            const select =
                block.querySelector(
                    ".kindWindelgroesse"
                );

            // Nur automatisch setzen,
            // wenn User nicht manuell geändert hat
            if (!select.dataset.manual) {

                select.value = groesse;

            }

        };

    });

    // Manuelle Änderung merken
    document.querySelectorAll(".kindWindelgroesse")
    .forEach(select => {

        select.onchange = () => {

            select.dataset.manual = "true";

        };

    });
}

document.getElementById("profilForm")
.addEventListener("submit", async (e) => {

    e.preventDefault();

    const vorname =
        document.getElementById("vorname").value;

    const nachname =
        document.getElementById("nachname").value;

    const kinder = [];

    document.querySelectorAll(".kind-block")
    .forEach(block => {

        kinder.push({

            id:
                block.querySelector(".kindId").value,

            vorname:
                block.querySelector(".kindVorname").value,

            geburtsdatum:
                block.querySelector(
                    ".kindGeburtsdatum"
                ).value,

            gewicht:
                block.querySelector(
                    ".kindGewicht"
                ).value,

            windelgroesse:
                block.querySelector(
                    ".kindWindelgroesse"
                ).value

        });

    });

    try {

        const response = await fetch(
            "api/profilUpdate.php",
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body: JSON.stringify({
                    vorname,
                    nachname,
                    kinder
                })
            }
        );

        const result =
            await response.json();

        alert(result.message);

    } catch (error) {

        console.error(
            "Profil konnte nicht gespeichert werden",
            error
        );

    }
});

loadProfile();